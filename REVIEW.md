# Review De Gouden Kurk (zwart-goud, november 2026)

Getoetst: de zwart-gouden versie (toen nog op `/v2/`) op 390 en 1440 px breed, met de leeftijdspoort, de collectie, het productvenster, de mand, het afrekenen, de voettekst, 320 px en 200 % zoom, het toetsenbord en reduced motion. Gebruikt: `npm test` (12/12), `npm run check`, `tools/browser-check.mjs` (alles geslaagd), `check-a11y.mjs` uit de presentatietools en eigen Playwright-proeven.

Labels: `RUNTIME` gezien in de browser, `CODE` gelezen in de bron, `DEDUCED` afgeleid.

## Basisfouten (toegankelijkheid, layout)

| # | Bevinding | Bewijs | Oplossing |
| --- | --- | --- | --- |
| 1 | Op 320 px schuift de pagina 22 px opzij: de mandknop en de menuknop passen niet naast het merk (WCAG 1.4.10 Reflow). | RUNTIME: `scrollWidth - clientWidth = 22`, `.header__actions` eindigt op 342 px. CODE: `v2/v2.css:50` zet `.cart-button { padding: 0 1.15rem }` zonder mediaquery en overschrijft daardoor de smalle regel in `site.css:501`. | De smalle regel ook in de zwart-gouden laag zetten (≤ 360 px: kleinere padding en een kleiner merk). |
| 2 | In de mand op mobiel breekt de regelprijs af: "€" en "15,99" komen op twee regels. | RUNTIME: screenshot van de mand op 390 px. CODE: `site.css:373` `.line__total` heeft geen `nowrap`. | `white-space: nowrap` op `.line__total`. |

## Inhoud en vertrouwen

| # | Bevinding | Bewijs | Oplossing |
| --- | --- | --- | --- |
| 3 | De paginatitel bevat "(impressie 2)". Dat is werktaal, niet voor de klant. | RUNTIME: check-a11y "paginatitel". CODE: `v2/index.html:7`. | Titel: "De Gouden Kurk · Slijterij aan het Raadhuisplein in Rozenburg". |
| 4 | Geen `og:image`: een link in WhatsApp of op Facebook toont geen beeld. Geen apple-touch-icon voor het beginscherm van een iPhone. | CODE: `<head>` van `v2/index.html`. | Een deelbeeld van 1200×630 en een icoon van 180×180 maken en koppelen. |
| 5 | Geen privacypagina en geen 404-pagina. Het afrekenformulier vraagt naam en telefoon, ook al wordt er niets opgeslagen. | CODE: alleen `index.html` en `v2/index.html` in de site. | Een korte privacypagina die beschrijft wat het concept wel en niet doet, gelinkt in de voettekst, plus een 404 in dezelfde stijl. |
| 6 | Er is geen verwijzing naar de app The Taste Club. | CODE: geen link in de pagina. | Een rustige sectie met link en een regel in de voettekst. |
| 7 | De voettekstlink heet "Bekijk impressie 1" en breekt op mobiel over twee regels. | RUNTIME: voettekst op 390 px. | "Eerste ontwerp" naar `v1/`, en op mobiel boven de NIX18-regel. |
| 8 | In de voettekst ontbreekt "De winkel" onder "Op deze pagina", terwijl het hoofdmenu hem wel heeft. | CODE: voettekst-nav tegenover `.nav`. | Toevoegen in dezelfde volgorde als het hoofdmenu. |

## Beeld

| # | Bevinding | Bewijs | Oplossing |
| --- | --- | --- | --- |
| 9 | Havana Club, Beefeater en J&B ogen zacht op de kaarten en op retina. | RUNTIME: collectie op 1440 px. CODE: bronbestanden van 103 tot 116 px breed. | Alleen vervangen door een foto met een duidelijke vrije licentie en een credit; anders laten staan en voor livegang leveranciersfoto's vragen. |

## Gecontroleerd en in orde

- Leeftijdspoort: bouwt op, focus op "Ja", Escape sluit niet, "Nee" sluit af (browser-check).
- Eén h1, `lang="nl"`, landmarks, labels bij alle velden, tekstcontrast (check-a11y en `npm run check -- --contrast`).
- Focusring: zichtbaar op elk element in de tabvolgorde als de poort dicht is. De select toont de ring op zijn kader (`.sort:focus-within`). De meldingen van check-a11y over de focus en de skiplink komen doordat de poort als modaal venster openstaat; dat is zo bedoeld.
- 200 % zoom (640 px): geen horizontale overloop.
- Reduced motion: geen animatie, alles direct zichtbaar. Zonder JavaScript: inhoud zichtbaar met een melding.
- Geen console-, CSP- of externe-bronmeldingen.

## Niet gecontroleerd

- Echte iPhone met Safari, VoiceOver en TalkBack, en een echte GPU-meting. Dat moet voor livegang nog gebeuren.

## Opgelost (17 november 2026)

- 1: header past op 320 px (onder 340 px valt het merkteken weg, de naam blijft) en de koppen krijgen onder 360 px een kleinere maat, zodat "RAADHUISPLEIN." past. Gemeten: overloop 0 px op 320 px.
- 2: `white-space: nowrap` op de regelprijs.
- 3: titel zonder "(impressie 2)"; v1 heet "Eerste ontwerp · De Gouden Kurk, slijterij in Rozenburg".
- 4: `og:image` (1200×630, met NIX18-regel), `og:url`, `twitter:card` en een apple-touch-icon van 180×180, gemaakt met `tools/maak-deelbeeld.mjs`.
- 5: `privacy.html` en `404.html`; de lokale server toont de 404-pagina nu ook.
- 6: sectie "The Taste Club" vóór Bezoek, met link naar de app, en een regel in de voettekst.
- 7 en 8: voettekst met "De winkel", "The Taste Club", Privacy en "Eerste ontwerp" in de kolom "Over dit concept".
- 9: Beefeater vervangen door de grotere versie van dezelfde Open Food Facts-foto (260×900). Havana Club en J&B: geen grotere vrije foto van precies die fles gevonden (Commons heeft alleen Añejo 7 en Especial, Open Food Facts alleen een uitsnede van het J&B-etiket). Die blijven staan.

Na de fixes: `npm test` 14/14, `npm run check` in orde, browser-check op `/` (28) en `/v1/` (22) zonder fouten. check-a11y op `/`: alleen nog de meldingen door de openstaande leeftijdspoort. Op `/privacy.html` alleen "minder dan 10 focusbare elementen", wat bij een korte pagina hoort. Op `/v1/` meldt hij nog een tekst met contrast 1:1: dat is de onzichtbare beginstand van de scroll-reveal in het eerste ontwerp, geen echte kleurcombinatie.

## Richting

Zwart-goud houden zoals het is: Bodoni-kapitalen, de echte winkelfoto en de flessen als held. De bevindingen hierboven zijn afwerking, geen nieuwe richting. De bewegingslaag blijft gelijk.
