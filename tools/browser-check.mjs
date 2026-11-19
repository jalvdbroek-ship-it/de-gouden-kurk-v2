// Needs playwright-core and a Chrome: PLAYWRIGHT_CORE=<path to playwright-core/index.mjs> CHROME=<path> npm run check:browser (with npm start running).
const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const base = process.env.BASE_URL ?? "http://127.0.0.1:4174/";
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const results = [];
const ok = (name, cond) => results.push(`${cond ? "✓" : "✗"} ${name}`);
const issues = [];
async function fresh(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) issues.push(m.text()); });
  page.on("pageerror", (e) => issues.push(e.message));
  page.on("request", (r) => { const u = r.url(); if (!u.startsWith(new URL(base).origin) && !u.startsWith("data:")) issues.push("EXTERN " + u); });
  await page.goto(base, { waitUntil: "networkidle" });
  return { ctx, page };
}
{ const { ctx, page } = await fresh();
  ok("poort open bij eerste bezoek", await page.locator("[data-gate]").evaluate((d) => d.open));
  ok("focus op 'Ja' in de poort", await page.evaluate(() => document.activeElement?.matches("[data-gate-yes]")));
  await page.keyboard.press("Escape");
  ok("Escape sluit de poort niet", await page.locator("[data-gate]").evaluate((d) => d.open));
  await page.click("[data-gate-no]");
  ok("'Nee' houdt de poort dicht en verbergt de knoppen", await page.locator("[data-gate]").evaluate((d) => d.open) && !(await page.locator("[data-gate-yes]").count()));
  await page.reload({ waitUntil: "networkidle" });
  ok("na 'Nee' en herladen staat de poort er weer", await page.locator("[data-gate]").evaluate((d) => d.open));
  await page.keyboard.press("Enter");
  ok("Enter op 'Ja' opent de site", !(await page.locator("[data-gate]").evaluate((d) => d.open)));
  await page.reload({ waitUntil: "networkidle" });
  ok("binnen dezelfde sessie geen tweede poort", !(await page.locator("[data-gate]").evaluate((d) => d.open)));
  await page.fill("[data-search]", "gin");
  await page.waitForTimeout(250);
  ok("zoeken op 'gin' geeft 2 flessen", (await page.locator("[data-grid] > li").count()) === 2);
  await page.fill("[data-search]", "");
  await page.click("[data-category=whisky]");
  await page.waitForTimeout(150);
  ok("filter whisky geeft 3 flessen", (await page.locator("[data-grid] > li").count()) === 3 && (await page.getAttribute("[data-category=whisky]", "aria-pressed")) === "true");
  await page.fill("[data-search]", "xyz");
  await page.waitForTimeout(250);
  ok("lege staat zichtbaar zonder resultaat", await page.locator("[data-empty]").isVisible());
  await page.click("[data-reset]");
  ok("toon alles zet alles terug", (await page.locator("[data-grid] > li").count()) === 11);
  await page.selectOption("[data-sort]", "prijs-af");
  ok("duurste fles eerst", (await page.locator(".card__name").first().textContent()).includes("Johnnie Walker"));
  await page.click(".add >> nth=0"); await page.click(".add >> nth=0");
  ok("mandteller telt mee", (await page.textContent("[data-cart-count]")) === "2");
  await page.reload({ waitUntil: "networkidle" });
  ok("mand blijft bewaard na herladen", (await page.textContent("[data-cart-count]")) === "2");
  await page.click("[data-open-cart]");
  await page.click("[data-checkout]");
  await page.check("input[value=bezorgen]");
  await page.fill("#f-naam", "Sanne"); await page.fill("#f-tel", "06 12345678"); await page.fill("#f-straat", "Molenweg 1"); await page.fill("#f-postcode", "3011 AB"); await page.check("input[name=leeftijd]");
  await page.click("[data-checkout-form] button[type=submit]");
  ok("postcode buiten Rozenburg geweigerd, focus op het veld", (await page.textContent("[data-error-for=postcode]")).includes("3181") && await page.evaluate(() => document.activeElement?.id === "f-postcode"));
  await page.fill("#f-postcode", "3181 CG");
  await page.click("[data-checkout-form] button[type=submit]");
  ok("proefbestelling toont de bevestiging", await page.locator("[data-done]").isVisible());
  ok("mand is leeg en er staat geen formulierdata in storage", (await page.textContent("[data-cart-count]")) === "0" && await page.evaluate(() => !JSON.stringify({ ...localStorage, ...sessionStorage }).includes("Sanne")));
  await page.keyboard.press("Escape");
  ok("Escape sluit het venster", !(await page.locator("[data-checkout-dialog]").evaluate((d) => d.open)));
  await page.click("[data-open-credits]");
  ok("beeldcredits tonen 11 foto's", (await page.locator("[data-credit-list] li").count()) === 11);
  await ctx.close(); }
{ const { ctx, page } = await fresh({ reducedMotion: "reduce" });
  await page.click("[data-gate-yes]");
  const op = await page.evaluate(() => [...document.querySelectorAll(".shelf__bottle, .section-head")].map((e) => getComputedStyle(e).opacity));
  ok("reduced motion: alles direct zichtbaar", op.every((o) => o === "1"));
  ok("reduced motion: geen reveal-klassen", (await page.locator(".reveal").count()) === 0);
  await ctx.close(); }
// The motion checks run on the black-and-gold main site (it carries data-motion), not on the first design in /v1/.
if (/data-motion="gsap"/.test(await (await fetch(base)).text())) {
  { const { ctx, page } = await fresh();
    await page.click("[data-gate-yes]");
    await page.waitForTimeout(4500);
    ok("motion: hero-telling eindigt op 340+", (await page.textContent(".hero__fact-num")).trim() === "340+");
    ok("motion: lichtglans over de gouden lijn aanwezig", (await page.locator(".swirl__glint").count()) === 1);
    const spots = async () => page.evaluate(() => [...document.querySelectorAll(".swirl g path:not([filter]):not(.swirl__glint)")].map((p) => p.getBoundingClientRect().top));
    const before = await spots(); await page.waitForTimeout(1500); const after = await spots();
    ok("motion: dunne lijnen drijven door, maar zacht (minder dan 12 px per 1,5 s)", after.some((v, i) => Math.abs(v - before[i]) > 0.05) && after.every((v, i) => Math.abs(v - before[i]) < 12));
    await page.locator("#collectie .add").first().scrollIntoViewIfNeeded();
    await page.click("#collectie .add >> nth=0");
    await page.waitForSelector(".fly", { timeout: 500 });
    ok("motion: fles vliegt naar de mand", true);
    await page.waitForFunction(() => !document.querySelector(".fly"), null, { timeout: 3000 });
    ok("motion: vliegende fles verdwijnt weer en teller telt", (await page.textContent("[data-cart-count]")) === "1");
    await ctx.close(); }
  { const { ctx, page } = await fresh({ reducedMotion: "reduce" });
    await page.click("[data-gate-yes]");
    await page.click("#collectie .add >> nth=0");
    await page.waitForTimeout(300);
    ok("motion, reduced: geen glans en geen vliegende fles", (await page.locator(".swirl__glint, .fly").count()) === 0 && (await page.textContent(".hero__fact-num")).trim() === "340+");
    await ctx.close(); }
}
{ const ctx = await browser.newContext({ javaScriptEnabled: false }); const page = await ctx.newPage();
  await page.goto(base);
  ok("zonder JavaScript: inhoud zichtbaar en noscript-melding", await page.locator("#winkel h2").isVisible() && await page.locator(".noscript").isVisible());
  await ctx.close(); }
// Feestdagen: de periode volgt de datum en de recepten blijven leesbaar op een telefoon.
for (const [datum, id, titel] of [["2026-11-19", "sinterklaas", /speculaas/i], ["2026-12-20", "kerst", /kerst/i], ["2027-01-01", "oud-en-nieuw", /bubbels/i], ["2026-10-20", "halloween", /halloween/i]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) issues.push(m.text()); });
  page.on("pageerror", (e) => issues.push(e.message));
  await page.addInitScript((iso) => {
    const t = new Date(`${iso}T12:00:00`).getTime(), Echt = Date;
    globalThis.Date = class extends Echt { constructor(...a) { a.length ? super(...a) : super(t); } static now() { return t; } };
    sessionStorage.setItem("dgk-18", "ja");
  }, datum);
  await page.goto(base, { waitUntil: "networkidle" });
  const zichtbaar = await page.evaluate(() => [...document.querySelectorAll(".feest__panel")].filter((x) => !x.hidden).map((x) => x.dataset.feest));
  ok(`feestdagen ${datum}: alleen ${id} staat open`, zichtbaar.length === 1 && zichtbaar[0] === id);
  ok(`feestdagen ${datum}: kop past bij de periode`, titel.test(await page.locator(".feest__panel:not([hidden]) .feest__title").innerText()));
  ok(`feestdagen ${datum}: elk recept heeft een versie zonder alcohol`, (await page.locator(".feest__panel:not([hidden]) .recipe").count()) === (await page.locator(".feest__panel:not([hidden]) .recipe__zonder").count()));
  ok(`feestdagen ${datum}: geen horizontaal scrollen`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await ctx.close();
}
console.log(results.join("\n"));
console.log("console/CSP/extern:", issues.length ? issues.join(" | ") : "geen");
await browser.close();
if (issues.length || results.some((r) => r.startsWith("✗"))) process.exit(1);
