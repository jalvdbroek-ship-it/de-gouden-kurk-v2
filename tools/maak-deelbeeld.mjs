// Maakt het deelbeeld (1200×630, og:image) en het icoon voor het beginscherm (180×180) uit de eigen fonts en productfoto's.
// Gebruik: PLAYWRIGHT_CORE=<pad>/playwright-core/index.mjs node tools/maak-deelbeeld.mjs
import { writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const mark = `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="29" stroke-width="1.6"/><circle cx="32" cy="32" r="25.5" stroke-width=".8" opacity=".55"/><g transform="rotate(-24 32 32)" stroke-width="1.6"><path d="M20.5 19.6c0-1.8 1.4-3.1 3.2-3.1h16.6c1.8 0 3.2 1.3 3.2 3.1v1.6c0 1-.8 1.8-1.8 1.8H22.3c-1 0-1.8-.8-1.8-1.8z" fill="currentColor" fill-opacity=".22"/><path d="M26.2 23v21.6c0 1.6 1.3 2.9 2.9 2.9h5.8c1.6 0 2.9-1.3 2.9-2.9V23"/><path d="M29.3 28.5v14.5M34.7 28.5v14.5" stroke-width=".9" opacity=".6"/></g><path d="M46.5 14.5v5M44 17h5M17 45.5v3.6M15.2 47.3h3.6" stroke-width="1.1" opacity=".8"/></g></svg>`;
const fonts = `
@font-face { font-family: B; src: url("../assets/fonts/bodoni-moda-latin.woff2"); }
@font-face { font-family: S; src: url("../assets/fonts/instrument-sans-latin.woff2"); }
* { margin: 0; box-sizing: border-box; }
body { background: #0a0908; color: #f6f1e8; font-family: S, sans-serif; }`;
const share = `<!doctype html><meta charset="utf-8"><style>${fonts}
.c { position: relative; width: 1200px; height: 630px; overflow: hidden; background: radial-gradient(55% 75% at 76% 58%, rgb(236 196 120 / 0.28), rgb(217 180 104 / 0) 70%), #0a0908; }
.c svg.m { width: 64px; height: 64px; color: #d9b468; }
.t { position: absolute; left: 80px; top: 92px; display: grid; gap: 26px; width: 620px; }
h1 { font: 400 76px/1.02 B, serif; text-transform: uppercase; letter-spacing: -0.005em; }
h1 em { font-style: normal; color: #d9b468; }
p { font-size: 26px; line-height: 1.4; color: #bfb6a8; }
.nix { position: absolute; left: 80px; bottom: 56px; display: flex; align-items: center; gap: 14px; font-size: 19px; color: #f6f1e8; }
.nix b { display: grid; place-items: center; width: 46px; height: 46px; border: 1.5px solid #d9b468; border-radius: 50%; color: #d9b468; font: 400 17px/1 B, serif; }
.line { position: absolute; left: 0; right: 0; top: 0; height: 4px; background: linear-gradient(90deg, #6b4a1c, #e9c983, #b8893f, #6b4a1c); }
.b { position: absolute; bottom: 40px; filter: drop-shadow(0 28px 30px rgb(0 0 0 / 0.75)); }
.b1 { height: 520px; left: 820px; z-index: 2; } .b2 { height: 360px; left: 735px; filter: drop-shadow(0 24px 26px rgb(0 0 0 / 0.75)) brightness(0.85); } .b3 { height: 290px; left: 965px; z-index: 3; }
</style><div class="c"><div class="line"></div>
<div class="t">${mark.replace("<svg", '<svg class="m"')}<h1>De Gouden <em>Kurk</em></h1><p>Slijterij aan het Raadhuisplein 6 in Rozenburg. Ruim 340 spiritualiën en persoonlijk advies aan de toonbank.</p></div>
<img class="b b2" src="../assets/products/ballantines-finest.webp"><img class="b b1" src="../assets/products/johnnie-walker-black-label.webp"><img class="b b3" src="../assets/products/hennessy-vs.webp">
<div class="nix"><b>18+</b>Geen alcohol onder de 18. Geniet, maar drink met mate.</div></div>`;
const icon = `<!doctype html><meta charset="utf-8"><style>${fonts}
.i { width: 180px; height: 180px; display: grid; place-items: center; background: radial-gradient(60% 60% at 50% 45%, #1d1712, #0a0908); color: #d9b468; }
.i svg { width: 132px; height: 132px; }</style><div class="i">${mark}</div>`;

const tmp = join(root, "tools", ".deelbeeld.html");
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [html, out, size, type] of [[share, "assets/img/deelbeeld.jpg", [1200, 630], "jpeg"], [icon, "assets/img/apple-touch-icon.png", [180, 180], "png"]]) {
  await writeFile(tmp, html);
  await page.setViewportSize({ width: size[0], height: size[1] });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, out), type, ...(type === "jpeg" ? { quality: 86 } : {}), clip: { x: 0, y: 0, width: size[0], height: size[1] } });
  console.log("gemaakt:", out);
}
await rm(tmp);
await browser.close();
