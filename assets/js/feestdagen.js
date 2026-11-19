import { huidigeFeestdag } from "./feest.js";

const root = document.querySelector("[data-feest-root]");
if (root) {
  const panels = [...root.querySelectorAll("[data-feest]")];
  const feestdagen = panels.map((p) => ({ id: p.dataset.feest, naam: p.querySelector(".feest__title").textContent, start: p.dataset.start, einde: p.dataset.einde }));
  const NAMEN = { sinterklaas: "Sinterklaas", kerst: "Kerst", "oud-en-nieuw": "oud en nieuw", halloween: "Halloween" };
  // ?feestdag=kerst laat een andere periode zien, handig om te bekijken en te testen
  const gekozen = new URLSearchParams(location.search).get("feestdag");
  const keuze = feestdagen.find((f) => f.id === gekozen);
  const { feestdag, actief } = keuze ? { feestdag: keuze, actief: true } : huidigeFeestdag(feestdagen);
  for (const p of panels) p.hidden = p.dataset.feest !== feestdag.id;
  const naam = NAMEN[feestdag.id];
  root.querySelector("[data-feest-status]").textContent = actief
    ? `Het is nu ${naam}, dus staat dat recept bovenaan. De recepten wisselen mee met het jaar. Alles ook met een versie zonder alcohol.`
    : `Straks komt ${naam}, dus staat dat recept alvast klaar. De recepten wisselen mee met het jaar. Alles ook met een versie zonder alcohol.`;
}
