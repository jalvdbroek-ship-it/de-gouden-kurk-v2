import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { huidigeFeestdag } from "../assets/js/feest.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const feestdagen = [...html.matchAll(/data-feest="([^"]+)" data-start="([^"]+)" data-einde="([^"]+)"/g)].map(([, id, start, einde]) => ({ id, start, einde }));
const op = (iso) => huidigeFeestdag(feestdagen, new Date(`${iso}T12:00:00`));

test("de pagina heeft vier feestdagen met een periode", () => {
  assert.deepEqual(feestdagen.map((f) => f.id), ["sinterklaas", "kerst", "oud-en-nieuw", "halloween"]);
});
test("de periode volgt de datum", () => {
  const verwacht = { "2026-10-31": "halloween", "2026-11-19": "sinterklaas", "2026-12-05": "sinterklaas", "2026-12-06": "kerst", "2026-12-26": "kerst", "2026-12-27": "oud-en-nieuw", "2027-01-02": "oud-en-nieuw" };
  for (const [iso, id] of Object.entries(verwacht)) assert.deepEqual([op(iso).feestdag.id, op(iso).actief], [id, true], iso);
});
test("buiten een periode komt de eerstvolgende feestdag, niet actief", () => {
  assert.deepEqual([op("2027-03-10").feestdag.id, op("2027-03-10").actief], ["halloween", false]);
});
test("op de pagina is alleen Sinterklaas zonder script zichtbaar", () => {
  assert.equal([...html.matchAll(/class="feest__panel"[^>]*?( hidden)?>/g)].filter((m) => !m[1]).length, 1);
});
