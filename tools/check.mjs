import { readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const fail = (message) => problems.push(message);
const exists = (path) => access(join(root, path)).then(() => true, () => false);
const isLocal = (url) => !/^(?:[a-z]+:)?\/\//i.test(url) && !/^(?:mailto|tel|data):/i.test(url);

for (const file of ["assets/js/app.js", "assets/js/catalog.js", "assets/js/products.js", "assets/js/motion.js", "assets/js/motion-boot.js", "assets/js/feest.js", "assets/js/feestdagen.js", "server.js", "tools/check.mjs", "tools/browser-check.mjs"]) {
  try { execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" }); }
  catch (error) { fail(`syntax: ${file}: ${error.stderr}`); }
}

const css = await readFile(join(root, "assets/css/site.css"), "utf8");
const motionCss = (await readFile(join(root, "assets/css/motion.css"), "utf8")) + (await readFile(join(root, "assets/css/zwart-goud.css"), "utf8"));

// Every page gets the same CSP, reference, anchor and external-source rules; links resolve from the page's own folder.
async function checkPage(file) {
  const html = await readFile(join(root, file), "utf8");
  const dir = dirname(file);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
  if (!csp) fail(`csp: geen Content-Security-Policy in ${file}`);
  else {
    if (/unsafe-inline|unsafe-eval/.test(csp)) fail(`csp: ${file} bevat unsafe-inline of unsafe-eval`);
    for (const directive of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "object-src 'none'", "base-uri 'none'"]) if (!csp.includes(directive)) fail(`csp: ${file} mist ${directive}`);
  }
  if (/\sstyle="/.test(html)) fail(`csp: inline style-attribuut in ${file}`);
  if (/\son[a-z]+="/.test(html)) fail(`csp: inline event-handler in ${file}`);
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1];
    if (/type="application\/ld\+json"/.test(attrs)) { try { JSON.parse(m[2]); } catch { fail(`json-ld: ongeldige JSON in ${file}`); } continue; }
    if (!/\ssrc="/.test(attrs) || m[2].trim()) fail(`csp: inline script in ${file}`);
  }
  for (const m of html.matchAll(/\s(?:src|href|content)="([^"]+)"/g)) {
    if (m[0].startsWith(" content=") && !/^\d+;\s*url=/.test(m[1])) continue;
    const url = m[1].replaceAll("&amp;", "&").replace(/^\d+;\s*url=/, "");
    if (url.startsWith("#")) { if (url.length > 1 && !ids.has(url.slice(1))) fail(`anker: ${file} ${url} bestaat niet`); continue; }
    if (!isLocal(url)) continue;
    // 404.html can be served at any depth, so it links from the Pages root; nothing else may use absolute paths.
    if (url.startsWith("/") && !(file === "404.html" && url.startsWith("/de-gouden-kurk-v2/"))) { fail(`verwijzing: ${file} ${url} is absoluut`); continue; }
    let target = url.startsWith("/") ? normalize(url.replace(/^\/de-gouden-kurk-v2\//, "").split(/[?#]/)[0] || ".") : normalize(join(dir, url.split(/[?#]/)[0]));
    if (url.endsWith("/") || url === "." || url === "..") target = join(target, "index.html");
    if (!(await exists(target))) fail(`verwijzing: ${file} ${url} bestaat niet`);
  }
  for (const m of html.matchAll(/<(?:img|script|link)[^>]*\s(?:src|href)="(https?:\/\/[^"]+)"/g)) {
    if (!/rel="canonical"/.test(m[0])) fail(`extern: runtime-bron ${m[1]} in ${file}`);
  }
  for (const m of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
    for (const id of m[1].split(/\s+/)) if (!ids.has(id) && id !== "product-titel") fail(`aria: ${file} #${id} bestaat niet`);
  }
  return { html, ids };
}

const pages = ["index.html", "v1/index.html", "v2/index.html", "privacy.html", "404.html", "social/index.html"];
const checked = {};
for (const file of pages) checked[file] = await checkPage(file);
const { html, ids } = checked["index.html"];

for (const m of (css + motionCss).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
  const url = m[1];
  if (url.startsWith("data:")) continue;
  if (!isLocal(url)) { fail(`extern: css-bron ${url}`); continue; }
  if (!(await exists(join("assets/css", url)))) fail(`verwijzing: css ${url} bestaat niet`);
}

// The black-and-gold main site: motion files shipped locally, a reduced-motion path, no catch-all transitions.
for (const lib of ["gsap.min.js", "ScrollTrigger.min.js", "lenis.min.js", "LICENSES.txt"]) if (!(await exists(`assets/vendor/${lib}`))) fail(`motion: assets/vendor/${lib} ontbreekt`);
if (/transition:\s*all/.test(motionCss)) fail("motion: transition: all in CSS");
if (!/prefers-reduced-motion/.test(css) || !/has-motion/.test(motionCss)) fail("motion: reduced-motion-pad ontbreekt");
if (/impressie/i.test(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")) fail("inhoud: werktaal in de paginatitel");
if (!/data-base=""/.test(html) || !/data-base="\.\.\/"/.test(checked["v1/index.html"].html)) fail("data-base: hoofdsite leeg, v1 naar ../");
if (!/http-equiv="refresh" content="0; url=\.\.\/"/.test(checked["v2/index.html"].html)) fail("v2: doorverwijzing naar de hoofdsite ontbreekt");
for (const page of ["privacy.html", "404.html"]) if (!checked[page].html.includes("Geniet, maar drink met mate")) fail(`${page}: NIX18-regel ontbreekt`);
if (!html.includes('href="privacy.html"') || !/<meta property="og:image" content="https:\/\/[^"]+\.jpg">/.test(html) || !html.includes('rel="apple-touch-icon"')) fail("inhoud: privacylink, og:image of apple-touch-icon ontbreekt");
for (const required of ["Websiteconcept", "Alcoholwet", "Geniet, maar drink met mate", "data-gate-yes", "3181 CG"]) if (!checked["v1/index.html"].html.includes(required)) fail(`v1 inhoud: mist "${required}"`);

// Feestdagen: vier perioden met recepten, versie zonder alcohol, 18+-regel; geen prijzen, acties of punt aan het eind van een kop.
const panels = [...html.matchAll(/<div class="feest__panel" id="feest-[^"]+" data-feest="([^"]+)" data-start="([^"]+)" data-einde="([^"]+)"/g)];
if (panels.map((m) => m[1]).join() !== "sinterklaas,kerst,oud-en-nieuw,halloween") fail("feestdagen: verwacht sinterklaas, kerst, oud-en-nieuw en halloween");
const recipeCount = (html.match(/<article class="recipe">/g) || []).length;
if (recipeCount !== 5) fail(`feestdagen: ${recipeCount} recepten, verwacht 5`);
if ((html.match(/class="recipe__zonder"/g) || []).length !== recipeCount) fail("feestdagen: elk recept heeft een versie zonder alcohol nodig");
const feestHtml = html.slice(html.indexOf('id="feestdagen"'), html.indexOf('id="collectie"'));
if (!feestHtml.includes("Geniet, maar drink met mate")) fail("feestdagen: 18+-regel ontbreekt");
if (/€|euro|korting|gratis|aanbieding/i.test(feestHtml)) fail("feestdagen: prijs of actie in de recepten");
for (const file of pages.filter((f) => f !== "social/index.html")) for (const m of checked[file].html.matchAll(/<h[1-6][^>]*>([^<]*(?:<em>[^<]*<\/em>[^<]*)*)<\/h[1-6]>/g)) if (/[.!]$/.test(m[1].trim())) fail(`kop: ${file} eindigt met een punt: ${m[1].slice(0, 50)}`);

const { products, categories } = await import(pathToFileURL(join(root, "assets/js/products.js")).href);
const categoryIds = new Set(categories.map((c) => c.id));
const seen = new Set();
for (const p of products) {
  if (seen.has(p.id)) fail(`product: dubbel id ${p.id}`);
  seen.add(p.id);
  if (!categoryIds.has(p.category)) fail(`product: ${p.id} heeft onbekende categorie ${p.category}`);
  if (!(await exists(p.image))) fail(`product: foto ${p.image} bestaat niet`);
  for (const key of ["title", "creator", "license", "licenseUrl", "sourceUrl", "changes"]) if (!p.credit?.[key]) fail(`credits: ${p.id} mist ${key}`);
  for (const key of ["name", "style", "volume", "abv", "serve", "imageAlt"]) if (!p[key]) fail(`product: ${p.id} mist ${key}`);
}

// Claims that must never reach the page: the unverified Google score and the dropped Cuervo photo.
const text = pages.map((f) => checked[f].html).join("") + JSON.stringify(products);
for (const banned of [/5,0\s*(?:uit|sterren)/i, /18 beoordelingen/i, /google-score/i, /cuervo/i, /\[IN TE VULLEN/]) if (banned.test(text)) fail(`inhoud: verboden tekst ${banned}`);
for (const required of ["Alcoholwet", "Geniet, maar drink met mate", "Websiteconcept", "OpenStreetMap", "Raadhuisplein 6", "3181 CG"]) if (!html.includes(required)) fail(`inhoud: mist "${required}"`);

// WCAG 2.2 AA on every text/background pair the stylesheet uses; the lightest stop of a gradient counts.
const tokens = Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const colour = (v) => tokens[v] ?? v;
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(colour(a)), lum(colour(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ["ink", "ivory", 4.5], ["ink", "paper", 4.5], ["ink", "stone", 4.5], ["ink-soft", "ivory", 4.5], ["ink-soft", "paper", 4.5], ["ink-soft", "#fbf7f0", 4.5],
  ["brass-deep", "ivory", 4.5], ["brass-deep", "paper", 4.5], ["danger", "ivory", 4.5], ["danger", "#fffdf9", 4.5],
  ["light", "night", 4.5], ["light-soft", "night", 4.5], ["light-soft", "#0b0807", 4.5], ["brass", "night", 4.5], ["light-soft", "#3a1816", 4.5],
  ["light", "wine-2", 4.5], ["#e2d4c3", "wine-2", 4.5], ["#d9c9b7", "wine-2", 4.5], ["light-soft", "wine-2", 4.5], ["brass", "wine-2", 4.5],
  ["ivory", "ink", 4.5], ["ivory", "wine", 4.5], ["night", "brass", 4.5], ["night", "brass-hi", 4.5], ["brass", "ink", 4.5], ["light-soft", "ink", 4.5],
  ["brass-deep", "ivory", 3, "focus"], ["brass", "night", 3, "focus"], ["ink", "paper", 3, "rand filter"]
];
// Semi-transparent input borders, flattened onto the lightest background they sit on (WCAG 1.4.11).
const flatten = (rgbaVar, bg) => {
  const m = css.match(new RegExp(`--${rgbaVar}:\\s*rgb\\((\\d+) (\\d+) (\\d+) / ([\\d.]+)\\)`));
  const [r, g, b, a] = m.slice(1).map(Number);
  const base = [1, 3, 5].map((i) => parseInt(colour(bg).slice(i, i + 2), 16));
  return "#" + [r, g, b].map((c, i) => Math.round(c * a + base[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
};
for (const bg of ["#fffdf9", "ivory", "#fbf7f0"]) pairs.push([flatten("line-input", bg), bg, 3, "rand invoerveld"]);
const contrast = pairs.map(([fg, bg, min, what = "tekst"]) => ({ fg, bg, min, what, r: ratio(fg, bg) }));
for (const c of contrast) if (c.r < c.min) fail(`contrast: ${c.fg} op ${c.bg} is ${c.r.toFixed(2)}:1, minimaal ${c.min}:1 (${c.what})`);
if (process.argv.includes("--contrast")) for (const c of contrast) console.log(`${c.r.toFixed(2).padStart(6)}:1  ${c.fg} op ${c.bg} (${c.what}, min ${c.min})`);

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log(`alles in orde: ${products.length} producten, ${ids.size} id's, CSP streng, geen externe runtime-bronnen`);
