import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { server } from "../server.js";

let base;
before(() => new Promise((resolve) => server.listen(0, "127.0.0.1", () => { base = `http://127.0.0.1:${server.address().port}`; resolve(); })));
after(() => new Promise((resolve) => server.close(resolve)));

test("de pagina en de assets worden geserveerd", async () => {
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.match(await page.text(), /De Gouden Kurk/);
  assert.equal((await fetch(`${base}/assets/js/app.js`)).status, 200);
  assert.equal((await fetch(`${base}/assets/products/campari.webp`)).headers.get("content-type"), "image/webp");
});

test("projectbestanden en paden buiten de map blijven dicht", async () => {
  for (const path of ["/tests/catalog.test.mjs", "/tools/check.mjs", "/package.json", "/.gitignore", "/%2e%2e/%2e%2e/etc/passwd"]) {
    assert.equal((await fetch(`${base}${path}`)).status, 404, path);
  }
});

test("alleen GET en HEAD", async () => {
  const res = await fetch(`${base}/`, { method: "POST" });
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "GET, HEAD");
});

test("de hoofdsite is zwart-goud, het eerste ontwerp staat op /v1/ en /v2/ verwijst door", async () => {
  const home = await (await fetch(`${base}/`)).text();
  assert.match(home, /data-motion="gsap"/);
  assert.match(home, /href="assets\/css\/zwart-goud\.css"/);
  const v1 = await fetch(`${base}/v1/`);
  assert.equal(v1.status, 200);
  assert.match(await v1.text(), /data-base="\.\.\/"/);
  const v2 = await (await fetch(`${base}/v2/`)).text();
  assert.match(v2, /http-equiv="refresh" content="0; url=\.\.\/"/);
  assert.match(v2, /<a href="\.\.\/">/);
});

test("privacy staat er, een onbekend adres geeft de 404-pagina, ook onder het Pages-pad", async () => {
  const privacy = await fetch(`${base}/privacy.html`);
  assert.equal(privacy.status, 200);
  assert.match(await privacy.text(), /Wat de site niet doet/);
  for (const path of ["/bestaat-niet", "/a/b/c.html", "/de-gouden-kurk-v2/bestaat-niet"]) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 404, path);
    assert.match(await res.text(), /Deze pagina bestaat niet/, path);
  }
  assert.equal((await fetch(`${base}/de-gouden-kurk-v2/assets/css/site.css`)).status, 200);
  assert.equal((await fetch(`${base}/assets/img/deelbeeld.jpg`)).headers.get("content-type"), "image/jpeg");
});
