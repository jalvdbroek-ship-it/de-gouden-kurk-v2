# De Gouden Kurk — websiteconcept v1

Een websiteconcept voor De Gouden Kurk, de slijterij aan het Raadhuisplein 6 in
Rozenburg. Gebouwd door Webrnds als vervolg op Johns eerste concept
(`jalvdbroek-ship-it/de-gouden-kurk-site`). Eén statische pagina: HTML, CSS en
JavaScript-modules, geen framework, geen build-stap, geen dependencies.

Brief en spec: `workspace/clients/de-gouden-kurk/01-brief.md` en `02-spec.md`.

## Lokaal bekijken

```sh
npm start            # http://127.0.0.1:4174
```

## Controleren

```sh
npm run check        # syntax, verwijzingen, ankers, CSP, externe bronnen, verboden tekst, contrast
npm run check -- --contrast   # idem, plus de gemeten contrastverhoudingen
npm test             # node --test: catalogus, sorteren, mand, validatie, server
npm run check:browser         # gedrag in Chrome (poort, filters, mand, afrekenen, reduced motion, zonder JS)
```

`check:browser` heeft `playwright-core` en Chrome nodig en draait tegen een
lopende `npm start`:

```sh
PLAYWRIGHT_CORE=<pad>/playwright-core/index.mjs CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run check:browser
```

## Wat erin zit

- Leeftijdspoort (18+) per sessie. "Nee" sluit de site af; Escape sluit de poort niet.
- Hero met een plank vol flessen, "Uit de kast" (drie flessen), de collectie
  met zoeken, filteren per soort, sorteren en een productvenster.
- Advies aan de toonbank, drie samenstellingen als voorstel, afhalen of
  bezorgen, het verhaal van de winkel en bezoek met een lokale kaart.
- Winkelmand (bewaard in `localStorage`, alleen product-id's en aantallen) en
  een proefbestelling: afhalen of bezorgen binnen 3181, met leeftijdsbevestiging.
  Er wordt niets verstuurd, betaald of opgeslagen; het formulier wordt na
  afronden gewist.
- Strikte CSP in de pagina zelf (`script-src 'self'`, `style-src 'self'`,
  geen inline scripts of stijlen), geen analytics, geen externe runtime-bronnen,
  lettertypen lokaal (Cormorant + Instrument Sans, OFL).
- `prefers-reduced-motion` zet alle beweging uit; zonder JavaScript is alle
  inhoud zichtbaar en wijst een melding naar de telefoon.

## Beelden

De productfoto's komen uit Johns concept (Wikimedia Commons en Open Food Facts).
Voor deze versie is bij elke foto de achtergrond verwijderd (macOS Vision) en
is hij bijgesneden; dat staat ook in de beeldcredits op de site. De foto van
José Cuervo is weggelaten: er stond een hand om de fles die niet netjes weg te
halen was, en er was geen vrije vervanger. Daarom staat tequila niet in de
voorbeeldcollectie.

Beefeater (116×400), Havana Club (114×400) en J&B (103×297) zijn klein en ogen
op een retina-scherm zacht. Voor livegang zijn leveranciersfoto's nodig.

De winkelfoto komt uit Rodi (8 januari 2026). Gebruik buiten dit concept vraagt
toestemming of een eigen foto.

## Wat de site niet beweert

Alle feiten komen uit `workspace/clients/de-gouden-kurk/notes/research.md`.
Er staan geen openingstijden, geen echte prijzen, geen voorraad en geen
reviewscore op. `npm run check` faalt als de Google-score of Cuervo
terugkomt.

## Open vóór een echte webshop

- Echte prijzen, voorraad en het volledige assortiment (productfeed).
- Openingstijden, bezorggebied, minimumbestelling en bezorgkosten.
- Betaling, orderbevestiging en e-mail.
- Leeftijdsverificatie bij aankoop en bij aflevering die meer is dan een
  vinkje (Alcoholwet art. 20a).
- Privacyverklaring, algemene voorwaarden en een bedrijfsgegevensblok (KvK,
  btw) van de winkel zelf.
- Toestemming voor de winkelfoto, of een eigen foto.

## Publiceren

Elke statische host werkt (GitHub Pages, Cloudflare Pages): de map zoals hij
is. Alle paden zijn relatief. Er is nog niets gepubliceerd; waar de preview
komt te staan is een open vraag in de brief.

## Impressie 2 (`v2/`)

Een tweede ontwerprichting op dezelfde inhoud en functies: zwart en goud,
Didone-kapitalen (Bodoni Moda, OFL, lokaal), een donkere spotlight voor
"Uit de kast" en de winkelfoto als volle band. `v2/index.html` gebruikt
dezelfde JS en `site.css`, met `v2/v2.css` eroverheen; `data-base="../"` op
`<html>` laat productfoto's vanuit de submap laden. Live op `/v2/`.

## Impressie 2: bewegingslaag

`/v2/` heeft een verfijningslaag met GSAP, ScrollTrigger en Lenis (lokaal in `assets/vendor/`), geregeld door `assets/js/motion.js` en `v2/motion.css`. Zie `REFINEMENT.md` voor analyse, motion, referenties, tests en aandachtspunten.
