import { readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const fail = (message) => problems.push(message);
const exists = (path) => access(join(root, path)).then(() => true, () => false);
const isLocal = (url) => !/^(?:[a-z]+:)?\/\//i.test(url) && !/^(?:mailto|tel|data):/i.test(url);

for (const file of ["assets/js/app.js", "assets/js/catalog.js", "assets/js/products.js", "assets/js/motion.js", "assets/js/motion-boot.js", "server.js", "tools/check.mjs", "tools/browser-check.mjs"]) {
  try { execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" }); }
  catch (error) { fail(`syntax: ${file}: ${error.stderr}`); }
}

const html = await readFile(join(root, "index.html"), "utf8");
const css = await readFile(join(root, "assets/css/site.css"), "utf8");
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
if (!csp) fail("csp: geen Content-Security-Policy in index.html");
else {
  if (/unsafe-inline|unsafe-eval/.test(csp)) fail("csp: bevat unsafe-inline of unsafe-eval");
  for (const directive of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "object-src 'none'", "base-uri 'none'"]) if (!csp.includes(directive)) fail(`csp: mist ${directive}`);
}
if (/\sstyle="/.test(html)) fail("csp: inline style-attribuut in index.html");
if (/\son[a-z]+="/.test(html)) fail("csp: inline event-handler in index.html");
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  const attrs = m[1];
  if (/type="application\/ld\+json"/.test(attrs)) { try { JSON.parse(m[2]); } catch { fail("json-ld: ongeldige JSON"); } continue; }
  if (!/\ssrc="/.test(attrs) || m[2].trim()) fail("csp: inline script in index.html");
}

for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
  const url = m[1].replaceAll("&amp;", "&");
  if (url.startsWith("#")) { if (url.length > 1 && !ids.has(url.slice(1))) fail(`anker: ${url} bestaat niet`); continue; }
  if (!isLocal(url)) continue;
  if (!(await exists(normalize(url.split(/[?#]/)[0])))) fail(`verwijzing: ${url} bestaat niet`);
}
for (const m of html.matchAll(/<(?:img|script|link)\b[^>]*\s(?:src|href)="(https?:\/\/[^"]+)"/g)) {
  if (!/<a\b/.test(m[0])) fail(`extern: runtime-bron ${m[1]}`);
}
for (const m of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
  for (const id of m[1].split(/\s+/)) if (!ids.has(id) && id !== "product-titel") fail(`aria: #${id} bestaat niet`);
}
for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
  const url = m[1];
  if (url.startsWith("data:")) continue;
  if (!isLocal(url)) { fail(`extern: css-bron ${url}`); continue; }
  if (!(await exists(join("assets/css", url)))) fail(`verwijzing: css ${url} bestaat niet`);
}

// Impressie 2 (/v2/): zelfde CSP-, verwijzings- en externe-bronregels, plus de lokaal meegeleverde bewegingsbestanden.
const v2 = await readFile(join(root, "v2/index.html"), "utf8");
const v2csp = v2.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
if (/unsafe-inline|unsafe-eval/.test(v2csp) || !v2csp.includes("script-src 'self'") || !v2csp.includes("style-src 'self'")) fail("v2: CSP te los of ontbreekt");
if (/\sstyle="/.test(v2) || /\son[a-z]+="/.test(v2)) fail("v2: inline stijl of event-handler");
const v2ids = new Set([...v2.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const m of v2.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
  const url = m[1].replaceAll("&amp;", "&");
  if (url.startsWith("#")) { if (url.length > 1 && !v2ids.has(url.slice(1))) fail(`v2 anker: ${url} bestaat niet`); continue; }
  if (!isLocal(url)) continue;
  if (!(await exists(join("v2", url.split(/[?#]/)[0])))) fail(`v2 verwijzing: ${url} bestaat niet`);
}
for (const m of v2.matchAll(/<(?:img|script|link)[^>]*\s(?:src|href)="(https?:\/\/[^"]+)"/g)) fail(`v2 extern: runtime-bron ${m[1]}`);
for (const lib of ["gsap.min.js", "ScrollTrigger.min.js", "lenis.min.js", "LICENSES.txt"]) if (!(await exists(`assets/vendor/${lib}`))) fail(`v2: assets/vendor/${lib} ontbreekt`);
for (const required of ["Websiteconcept", "Alcoholwet", "Geniet, maar drink met mate", "data-gate-yes", "3181 CG"]) if (!v2.includes(required)) fail(`v2 inhoud: mist "${required}"`);
const v2css = (await readFile(join(root, "v2/motion.css"), "utf8")) + (await readFile(join(root, "v2/v2.css"), "utf8"));
if (/transition:\s*all/.test(v2css)) fail("v2: transition: all in CSS");
if (!/prefers-reduced-motion/.test(css) || !/has-motion/.test(v2css)) fail("v2: reduced-motion-pad ontbreekt");

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
const text = html + JSON.stringify(products);
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
