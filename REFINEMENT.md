# De Gouden Kurk, impressie 2: design- en motion-verfijning

Branch `webrnds-refinement`, gebaseerd op `0xtsotsi/de-gouden-kurk-site` (`/v2/`). Geen rebuild: de HTML-structuur, productdata, winkelmand, checkout, leeftijdspoort en teksten zijn ongewijzigd. De verfijning is een laag erbovenop.

Preview: `npm start`, dan http://127.0.0.1:4174/v2/

## Analyse

**Behouden:** zwart-goud met Bodoni-kapitalen, de echte winkelfoto, echte productfoto's, de gouden swirl, leeftijdspoort (18+, per sessie), alcoholwaarschuwing, concept-melding, strikte CSP, lokale fonts, alle teksten en feiten.

**Verfijnd:** hero-compositie op mobiel (flessen waren een klein eilandje), kaartdiepte (vlak, geen vloer of lichtbron), sectieopmaak (kopjes zonder index of ritme), navigatie (alleen een onderstreping bij hover), menu en leeftijdspoort (verschijnen abrupt), knoppen.

**Opnieuw ontworpen:** de bewegingslaag. De oude site kende alleen één fade-up per blok (IntersectionObserver). Nu: geregisseerde hero-entree, scroll-gekoppelde diepte, mask-reveals, productreveals en vloeiend scrollen.

**Grootste kansen (in volgorde van winst):** 1. hero-entree en gelaagdheid; 2. typografie die verschijnt in plaats van fade; 3. productkaarten met licht, vloer en hover-diepte; 4. de winkelfoto als beeldmoment; 5. mobiele hero; 6. navigatie met positiebesef; 7. sectieovergang hero naar intro; 8. kaart en icoontjes als afsluitende details. Fotokwaliteit staat apart onder "Aandachtspunten".

## Toegepaste motion

| Onderdeel | Beweging |
| --- | --- |
| Hero (na leeftijdspoort) | Kop in woordmaskers omhoog, gouden swirl tekent zichzelf, flessen stijgen uit de donkerte (clip-path), licht fadet in, feiten volgen |
| Hero scroll | Tekst glijdt langzamer weg dan de pagina (de intro schuift eroverheen), flessen bewegen op eigen diepte, swirl schaalt mee |
| Hero aanwijzer | Drie flessen en de gloed reageren op de muis (alleen fijne aanwijzer, desktop) |
| Sectiekoppen | Woordmasker-reveal, Romeins cijfer en gouden lijn tekenen zich |
| Intro | Drie schuine flessen parallax op eigen snelheid |
| Uit de kast | Podium opent van onder naar boven, fles stijgt, tekst volgt; middelste kolom drijft licht; 3D-tilt en meebewegend licht bij hover |
| Collectie | Kaarten per rij in beeld (ScrollTrigger.batch); na filteren of zoeken opnieuw; hover: tilt, spotlight, fles tilt op, schaduw krimpt, knop vult |
| Advies | Winkelfoto "opent" van kader naar volle breedte, parallax in de foto |
| Samenstellingen, afhalen | Gestaffelde reveal, gouden lijn bij hover, icoontjes tekenen zich, fles-parallax |
| Bezoek | Kaart onthult met inzoom, speld valt erop |
| Navigatie | Voortgangslijn in goud, actieve sectie (`aria-current`), overige links dimmen bij hover, menupaneel opent met clip-path en gestaffelde links |
| Overig | Glans over primaire knoppen, leeftijdspoort bouwt gestaffeld op |
| Hero, gouden lijnen | De dunne lijnen komen zacht omhoog terwijl ze zich tekenen en drijven daarna langzaam door (een paar pixels, 8 tot 13 s per beweging, elk in eigen tempo). Pauzeert buiten beeld, uit bij reduced motion |
| Hero, extra accenten | "340+" telt eenmalig op; een lichtpunt reist af en toe (elke ~11 s) over de gouden hoofdlijn en pauzeert buiten beeld |
| "In de mand" | De fles vliegt in een boog naar de mandknop, die licht veert. Alleen als de teller echt oploopt; nooit bij reduced motion |

Reduced motion: geen bibliotheek wordt gestart, geen verborgen startstanden, alles direct zichtbaar. Zonder JavaScript: ook alles zichtbaar. Als de bibliotheken niet laden, valt de pagina terug op de statische versie.

**3D/WebGL: bewust niet toegevoegd.** De productfoto's zijn 2D-uitsnedes (sommige maar 100 tot 120 px breed). WebGL of three.js zou die beperking uitvergroten en kost enkele honderden KB extra. De diepte komt nu uit CSS-tilt, parallax en licht. Een 3D-moment is pas zinvol met eigen, hoge-resolutie productfotografie of een echt 3D-model van de winkel.

## Referenties, wat is gebruikt

- **Casa di Veo** (broncode gelezen): GSAP + ScrollTrigger + Lenis-opzet, woordmaskers voor kopjes, clip-path menu, scrub-gestuurde beeldmaskers, Lenis gekoppeld aan de GSAP-ticker. Techniek hergeschreven, niet gekopieerd (andere selectors, geen video-scrub, geen galerij); versies 3.15.1 en 1.3.27.
- **BRAND Napa Valley**: alleen de aankondigingspagina was leesbaar (zonder beelden). Gebruikt als richting: kapitalen met index, ruime witruimte, minimalistisch, vloeiende motion.
- **Oak & Eden**: de Elva-pagina stuurt door naar Third and Grove, de tweede link (sombathchum.com) is niet gelezen. Richting is afgeleid uit de opdracht: product als held, licht en vloer onder de fles, subtiele hover.
- **Winery Scrolltelling (ximmersion)**: alleen de beschrijving. Alleen de gedachte "scroll als verhaal" is overgenomen, niet de 3D.

Ik heb dus geen visuele analyse van Oak & Eden, BRAND Napa en de ximmersion-demo kunnen doen. Dat is een lacune.

## Skillry

De zoekopdracht werkt, maar geeft voor elke term (GSAP, Lenis, ScrollTrigger, motion, WebGL, wine) dezelfde lijst van `bs-*` landingspagina-templates terug. Geen enkele is een GSAP-, Lenis- of performance-skill.
Bekeken met `info`: `bs-obsidian-cinema-landing` (donker, champagne, cinematisch: stijlverwant maar een template voor een nieuwe pagina), `bs-editorial-ink-landing` (SaaS, andere stijl), `bs-aurawave-audio-landing` (licht en monochroom, productfoto-gedreven, fysiek product). Alle drie bouwen een nieuwe losse pagina met een Node-buildscript (deels met een afbeeldingstool), kosten 4,99 USD per stuk en passen niet bij "geen rebuild". **Niets geïnstalleerd, niets gekocht, geen SKILL.md gelezen.** De gebruikte werkwijze komt uit de lokale skill `evidence-led-ui` (rendered verification, rubric, anti-defaults).

## Nieuwe bestanden en afhankelijkheden

- `assets/vendor/`: gsap 3.15.1 + ScrollTrigger (GSAP Standard "no charge"-licentie, gratis ook commercieel) en Lenis 1.3.27 (MIT). Lokaal gehost, geen CDN, geen npm-dependency, geen build. Gzip: 28 + 18 + 5 KB.
- `assets/js/motion.js` (4,7 KB gz), `assets/js/motion-boot.js` (1 regel, zet `has-motion` vóór de eerste verf), `v2/motion.css` (3 KB gz).
- Aangepast: `v2/index.html` (scripts, stylesheet, `data-motion`), `assets/js/app.js` (oude fade-up slaat over als `data-motion` staat; impressie 1 blijft werken), `tools/check.mjs` (v2-controles, en een Windows-padfix voor de dynamische import).

## Testresultaten

- `npm run check`: geslaagd, nu ook voor `/v2/` (CSP, verwijzingen, ankers, vendor-bestanden, wettelijke tekst).
- `npm test`: 12/12.
- `tools/browser-check.mjs` tegen `/v2/` en tegen impressie 1: alle controles geslaagd (leeftijdspoort, zoeken, filteren, sorteren, mand, checkout-validatie, credits, reduced motion, zonder JS), geen console-, CSP- of externe-bronmeldingen.
- Aanvullend (Playwright, Chromium headless): hero-entree en volledige scroll op 1440, 820 en 390 breed; filteren en zoeken tonen alle kaarten na scrollen; tilt wordt losgelaten; Lenis stopt bij open dialoog en start weer; Enter op een navigatielink scrolt naar de sectie en zet `#hash` en `aria-current`; sectie-uitlijning onder de header klopt (76 px) op desktop en mobiel.
- Layout shift (CLS): 0 op desktop, tablet en mobiel. Laden tot networkidle: 765 ms lokaal.
- Scrollen (headless, software-rendering, dus alleen indicatief): mediaan 16,7 ms per frame, p95 33 ms, 6 frames boven 50 ms van 161.

## Aandachtspunten

- **Productfoto's**: Beefeater, Havana Club en J&B zijn 100 tot 120 px breed en ogen zacht op grotere kaarten en retina. Echt premium vraagt leveranciersfoto's of eigen studiofoto's met rechten. Niets is verzonnen of vervangen.
- **Winkelfoto (Rodi)**: rechten buiten dit concept zijn nog niet bevestigd (staat al in de credits).
- Niet getest op echte telefoon of Safari, geen WCAG-audit met schermlezer, geen echte GPU-meting. Dat blijft nodig voor livegang.
- De bibliotheken worden ook voor reduced-motion-bezoekers gedownload (52 KB gz) maar niet gestart.
- Alles is lokaal; er is niets gepubliceerd. De wijzigingen staan ongecommit in de werkmap op branch `webrnds-refinement`.
