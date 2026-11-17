# De Gouden Kurk, websiteconcept

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

Beefeater is in november 2026 vervangen door de grotere versie van dezelfde
Open Food Facts-foto (260×900, achtergrond weggehaald). Havana Club (114×400)
en J&B (103×297) zijn klein en ogen op een retina-scherm zacht; er was geen
grotere vrije foto van precies die fles. Voor livegang zijn leveranciersfoto's nodig.

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
is. Alle paden zijn relatief, behalve in `404.html`. Nu op GitHub Pages; zie
`.github/workflows/pages.yml`.

## Opbouw

| Adres | Wat |
| --- | --- |
| `/` (`index.html`) | De hoofdsite in zwart en goud, met Bodoni-kapitalen en een bewegingslaag (GSAP, ScrollTrigger en Lenis, lokaal in `assets/vendor/`). Stijl: `assets/css/site.css` met `zwart-goud.css` en `motion.css` erover. |
| `/v1/` | Het eerste ontwerp (licht, wijnrood), ter vergelijking. `data-base="../"` laat de productfoto's vanuit de submap laden. |
| `/v2/` | Doorverwijzing naar `/`, zodat oude links blijven werken. |
| `/privacy.html` | Wat het concept met gegevens doet en wat niet. |
| `/404.html` | Pagina voor een onbekend adres. Gebruikt absolute paden onder `/de-gouden-kurk-v2/`, omdat GitHub Pages hem op elke diepte toont; `server.js` accepteert dat voorvoegsel lokaal ook. |
| `/social/` | Online portfolio van het socialpakket, gemaakt met `maak-portfolio.mjs` in `../social-media/editable-projects/generator/`. |

`tools/maak-deelbeeld.mjs` maakt het deelbeeld (`assets/img/deelbeeld.jpg`, 1200×630) en het icoon voor het beginscherm (`apple-touch-icon.png`). De sectie "The Taste Club" linkt naar de app op https://jalvdbroek-ship-it.github.io/the-taste-club/.

Live: https://jalvdbroek-ship-it.github.io/de-gouden-kurk-v2/ (GitHub Pages vanaf `main` van `jalvdbroek-ship-it/de-gouden-kurk-v2`). Zie `REFINEMENT.md` voor de bewegingslaag en `REVIEW.md` voor de laatste review.
