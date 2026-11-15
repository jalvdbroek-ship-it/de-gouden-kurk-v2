// Bewegingslaag voor /v2/: GSAP + ScrollTrigger + Lenis, lokaal gehost. Geen van deze bestanden is nodig voor de inhoud:
// zonder bibliotheken, zonder JavaScript of met prefers-reduced-motion blijft alles zichtbaar en werkt alles.
const root = document.documentElement;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

let lenis = null;
let tickerFn = null;
let context = null;
let mm = null;

function stop() {
  mm?.revert();
  context?.revert();
  if (tickerFn) window.gsap?.ticker.remove(tickerFn);
  lenis?.destroy();
  lenis = tickerFn = context = mm = null;
  root.classList.remove("has-motion");
}

if (reduced.matches || !window.gsap || !window.ScrollTrigger) {
  root.classList.remove("has-motion");
} else {
  start();
  reduced.addEventListener("change", (event) => { if (event.matches) stop(); });
}

function splitWords(element) {
  const words = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (!part.trim()) { fragment.append(part); continue; }
      const mask = document.createElement("span");
      const inner = document.createElement("span");
      mask.className = "w";
      inner.className = "w__i";
      inner.textContent = part;
      mask.append(inner);
      fragment.append(mask);
      words.push(inner);
    }
    node.replaceWith(fragment);
  }
  return words;
}

function start() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.config({ nullTargetWarn: false });

  const header = $("[data-header]");
  mm = gsap.matchMedia();

  context = gsap.context(() => {
    smoothScroll();
    navigation();
    hero();
    sectionHeads();
    intro();
    featured();
    collection();
    advice();
    sets();
    ways();
    visit();
    footer();
    pointerDepth();
    flyToCart();
  });

  function smoothScroll() {
    if (!window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    tickerFn = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    const lock = () => {
      const locked = $$("dialog").some((dialog) => dialog.open) || root.classList.contains("menu-open");
      if (!lenis) return;
      if (locked) lenis.stop(); else lenis.start();
    };
    new MutationObserver(lock).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    new MutationObserver(lock).observe(root, { attributes: true, attributeFilter: ["class"] });
    for (const node of $$("dialog, [data-menu-panel]")) node.setAttribute("data-lenis-prevent", "");

    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!lenis || !link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const hash = link.getAttribute("href");
      if (hash.length < 2) return;
      const target = hash === "#top" ? document.body : $(hash);
      if (!target) return;
      event.preventDefault();
      // Lenis houdt zelf rekening met scroll-padding-top uit de stylesheet.
      lenis.scrollTo(hash === "#top" ? 0 : target, { duration: 1.5, easing: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)) });
      history.pushState(null, "", hash);
      if (hash !== "#top") { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
    });
  }

  function navigation() {
    const bar = document.createElement("span");
    bar.className = "header__progress";
    bar.setAttribute("aria-hidden", "true");
    header.append(bar);
    gsap.set(bar, { scaleX: 0 });
    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });

    for (const link of $$('.nav a[href^="#"]')) {
      const section = $(link.getAttribute("href"));
      if (!section) continue;
      ScrollTrigger.create({
        trigger: section, start: "top 55%", end: "bottom 55%",
        onToggle: (self) => (self.isActive ? link.setAttribute("aria-current", "location") : link.removeAttribute("aria-current"))
      });
    }
    gsap.from(".header__inner > *", { opacity: 0, y: -14, duration: 0.9, stagger: 0.07, ease: "power3.out", delay: 0.1, clearProps: "transform" });
  }

  function hero() {
    const titleWords = splitWords($(".hero__title"));
    const bottles = $$(".shelf__bottle").filter((bottle) => getComputedStyle(bottle).display !== "none");
    const swirl = $$(".swirl path");
    const facts = $$(".hero__facts li");
    const copy = [$(".hero__kicker"), $(".hero__lead"), $(".hero__actions")];

    for (const path of swirl) path.setAttribute("pathLength", "1");
    gsap.set(swirl, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(titleWords, { yPercent: 118 });
    gsap.set(".hero__title", { visibility: "visible" });
    gsap.set(copy, { y: 24 });
    gsap.set(facts, { y: 18 });
    gsap.set(bottles, { y: 70, opacity: 1, clipPath: "inset(100% -40% -60% -40%)", "--px": 0, "--py": 0 });
    gsap.set(".hero__glow", { opacity: 0, "--px": 0, "--py": 0 });
    const drifters = $$(".swirl g path:not([filter])").filter((path, i) => i !== 0);
    gsap.set(drifters, { y: 26 });

    const play = () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });
      tl.to(".hero__glow", { opacity: 1, duration: 2.4, ease: "power2.out" }, 0)
        .to(swirl, { strokeDashoffset: 0, duration: 2.6, stagger: 0.14, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" }, 0.1)
        .to(copy[0], { opacity: 1, y: 0, duration: 0.9 }, 0.15)
        .to(titleWords, { yPercent: 0, duration: 1.2, stagger: 0.075, ease: "expo.out" }, 0.25)
        .to(copy.slice(1), { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.85)
        .to(bottles, { y: 0, clipPath: "inset(-20% -40% -60% -40%)", duration: 1.6, stagger: 0.16, ease: "expo.out", clearProps: "clipPath" }, 0.4)
        .to(facts, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 1.25)
        .to(drifters, { y: 0, duration: 3.2, stagger: 0.18, ease: "power2.out" }, 0.1)
        .add(countUp, 1.3)
        .add(glint, 3)
        .add(() => drift(drifters), 3.4);
    };
    if (root.classList.contains("is-welcome")) play();
    else {
      const watcher = new MutationObserver(() => {
        if (!root.classList.contains("is-welcome")) return;
        watcher.disconnect();
        play();
      });
      watcher.observe(root, { attributes: true, attributeFilter: ["class"] });
    }

    const scrub = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    mm.add("(min-width: 900px)", () => {
      gsap.to(".hero__copy", { y: 110, opacity: 0.2, ease: "none", scrollTrigger: scrub });
      gsap.to(".swirl", { y: 70, scale: 1.08, ease: "none", scrollTrigger: scrub });
      gsap.to(".hero__glow", { y: 60, ease: "none", scrollTrigger: scrub });
      const depth = [[".shelf__bottle--6 img", 70], [".shelf__bottle--3 img", -30], [".shelf__bottle--4 img", 20]];
      for (const [selector, y] of depth) gsap.to(selector, { y, ease: "none", scrollTrigger: scrub });
    });
    mm.add("(max-width: 899px)", () => {
      gsap.to(".hero__copy", { y: 40, opacity: 0.35, ease: "none", scrollTrigger: scrub });
    });
  }

  // De winkelaantallen tellen één keer op; de breedte wordt vastgezet zodat de tekst ernaast niet meebeweegt.
  function countUp() {
    const num = $(".hero__fact-num");
    const match = num && /^(\d+)(\D*)$/.exec(num.textContent.trim());
    if (!match) return;
    const [, end, suffix] = match;
    num.style.minWidth = `${num.offsetWidth}px`;
    const state = { v: 0 };
    num.textContent = `0${suffix}`;
    gsap.to(state, { v: Number(end), duration: 1.8, ease: "power2.out", onUpdate: () => { num.textContent = `${Math.round(state.v)}${suffix}`; }, onComplete: () => { num.textContent = `${end}${suffix}`; } });
  }

  // Na het opkomen drijven de dunne lijnen heel langzaam door: eigen tempo, een paar pixels, nooit ritmisch.
  function drift(lines) {
    if (!root.classList.contains("has-motion")) return;
    const ambient = gsap.timeline({ paused: true });
    lines.forEach((line, i) => {
      ambient.to(line, { y: i % 2 ? -7 : 7, x: i % 2 ? 9 : -9, duration: 8 + i * 1.7, ease: "sine.inOut", repeat: -1, yoyo: true }, i * 0.9);
    });
    ambient.to(".swirl", { x: 8, duration: 13, ease: "sine.inOut", repeat: -1, yoyo: true }, 0);
    ScrollTrigger.create({
      trigger: ".hero", start: "top top", end: "bottom top",
      onToggle: (self) => {
        if (!root.classList.contains("has-motion")) { ambient.kill(); return; }
        if (self.isActive) ambient.play(); else ambient.pause();
      }
    });
    if (ScrollTrigger.isInViewport?.(".hero")) ambient.play();
  }

  // Een lichtpunt reist af en toe over de gouden hoofdlijn; stopt zodra de hero uit beeld is.
  function glint() {
    const base = $(".swirl g path:nth-of-type(2)");
    if (!base || !root.classList.contains("has-motion")) return;
    const light = base.cloneNode();
    for (const name of ["filter", "opacity", "stroke-width"]) light.removeAttribute(name);
    light.setAttribute("pathLength", "1");
    light.setAttribute("stroke", "#fff1cf");
    light.setAttribute("stroke-width", "2.4");
    light.classList.add("swirl__glint");
    base.after(light);
    gsap.set(light, { strokeDasharray: "0.07 2", strokeDashoffset: 0.07, opacity: 0 });
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 8, onRepeat: () => { if (!root.classList.contains("has-motion")) loop.kill(); } });
    loop.to(light, { opacity: 0.95, duration: 0.4, ease: "none" }, 0)
      .to(light, { strokeDashoffset: -1, duration: 3.2, ease: "power1.inOut" }, 0)
      .to(light, { opacity: 0, duration: 0.5, ease: "none" }, 2.7);
    ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top", onToggle: (self) => (self.isActive ? loop.play() : loop.pause()) });
  }

  // "In de mand": de fles vliegt in een boog naar de mandknop. Alleen als de teller echt verandert.
  function flyToCart() {
    const badge = $("[data-cart-count]");
    const cartButton = $("[data-open-cart]");
    if (!badge || !cartButton) return;
    let pending = null;
    document.addEventListener("click", (event) => {
      const button = event.target.closest?.(".add, .button--dark");
      if (!button || !root.classList.contains("has-motion") || !/in de mand/i.test(button.textContent)) { pending = null; return; }
      const image = $(".card__stage img", button.closest(".card") ?? document.createElement("i")) ?? $("img", button.closest("dialog") ?? document.createElement("i"));
      if (!image?.currentSrc) { pending = null; return; }
      const box = image.getBoundingClientRect();
      pending = { src: image.currentSrc, box, count: badge.textContent };
    }, true);
    document.addEventListener("click", () => {
      const job = pending;
      pending = null;
      if (!job || badge.textContent === job.count || !root.classList.contains("has-motion")) return;
      const from = job.box;
      const to = cartButton.getBoundingClientRect();
      if (!from.width || !to.width) return;
      const fly = new Image();
      fly.src = job.src;
      fly.alt = "";
      fly.className = "fly";
      fly.setAttribute("aria-hidden", "true");
      fly.style.width = `${from.width}px`;
      fly.style.height = `${from.height}px`;
      document.body.append(fly);
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      gsap.set(fly, { x: from.left, y: from.top });
      const done = () => {
        fly.remove();
        gsap.fromTo(cartButton, { scale: 1.07 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)", clearProps: "transform" });
      };
      gsap.timeline({ onComplete: done })
        .to(fly, { x: from.left + dx, duration: 0.85, ease: "power2.inOut" }, 0)
        .to(fly, { y: from.top + dy, duration: 0.85, ease: "power3.in" }, 0)
        .to(fly, { scale: 0.12, rotation: 14, duration: 0.85, ease: "power2.in", transformOrigin: "50% 50%" }, 0)
        .to(fly, { opacity: 0, duration: 0.2, ease: "none" }, 0.65);
    });
  }

  function sectionHeads() {
    for (const title of $$("main .section-title")) {
      const words = splitWords(title);
      gsap.set(words, { yPercent: 118 });
      gsap.set(title, { visibility: "visible" });
      gsap.to(words, { yPercent: 0, duration: 1.2, stagger: 0.055, ease: "expo.out", scrollTrigger: { trigger: title, start: "top 88%", once: true } });
    }
    for (const eyebrow of $$("main .section-head .eyebrow, main .advice__copy > .eyebrow, main .visit__copy > .eyebrow")) {
      gsap.set(eyebrow, { opacity: 0, x: -14, "--line": 0 });
      gsap.to(eyebrow, { opacity: 1, x: 0, "--line": 1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: eyebrow, start: "top 90%", once: true } });
    }
    for (const intro of $$("main .section-intro")) rise(intro, intro, { delay: 0.15 });
  }

  function rise(targets, trigger, vars = {}) {
    gsap.set(targets, { opacity: 0, y: 28 });
    return gsap.to(targets, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1, clearProps: "transform", scrollTrigger: { trigger, start: "top 86%", once: true }, ...vars });
  }

  function intro() {
    const speeds = [[".intro__b--1", 14, -14], [".intro__b--2", 9, -8], [".intro__b--3", 18, -22]];
    for (const [selector, from, to] of speeds) {
      gsap.fromTo(selector, { yPercent: from }, { yPercent: to, ease: "none", scrollTrigger: { trigger: ".intro", start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(selector, { opacity: 0, scale: 0.92, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: ".intro", start: "top 75%", once: true } });
    }
    rise($$(".intro__copy > :not(.section-title)"), ".intro__copy", { delay: 0.25 });
  }

  function featured() {
    for (const feature of $$(".feature")) {
      const stage = $(".feature__stage", feature);
      const bottle = $("img", stage);
      const copy = $$(".feature__copy > *", feature);
      gsap.set(stage, { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(bottle, { y: 90, opacity: 0 });
      gsap.set(copy, { opacity: 0, y: 24 });
      gsap.timeline({ scrollTrigger: { trigger: feature, start: "top 84%", once: true }, defaults: { ease: "expo.out" } })
        .to(stage, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", clearProps: "clipPath" }, 0)
        .to(bottle, { y: 0, opacity: 1, duration: 1.5 }, 0.4)
        .to(copy, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" }, 0.6);
    }
    mm.add("(min-width: 900px)", () => {
      gsap.fromTo("#uit-de-kast .feature:nth-child(2)", { y: 28 }, { y: -28, ease: "none", scrollTrigger: { trigger: ".featured", start: "top bottom", end: "bottom top", scrub: true } });
    });
    tilt($(".featured"), ".feature__stage", 4);
  }

  function collection() {
    rise($$(".toolbar, .filters"), ".toolbar", { stagger: 0.12 });
    const grid = $("[data-grid]");
    let triggers = [];
    const reveal = () => {
      for (const trigger of triggers) trigger.kill();
      const cards = $$(".card", grid);
      if (!cards.length) { triggers = []; return; }
      const bottles = (batch) => batch.map((card) => $(".card__stage img", card));
      gsap.set(cards, { opacity: 0, y: 44 });
      gsap.set(bottles(cards), { y: 40 });
      triggers = ScrollTrigger.batch(cards, {
        start: "top 92%", once: true, batchMax: 4,
        onEnter: (batch) => {
          gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "power3.out", clearProps: "transform" });
          gsap.to(bottles(batch), { y: 0, duration: 1.4, stagger: 0.08, ease: "expo.out" });
        }
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    new MutationObserver(reveal).observe(grid, { childList: true });
    reveal();
    tilt(grid, ".card__stage", 3);
  }

  function advice() {
    const photo = $(".advice__photo");
    mm.add("(min-width: 900px)", () => {
      gsap.fromTo(photo, { clipPath: "inset(10% 5% 10% 5%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: "#advies", start: "top 95%", end: "top 20%", scrub: 0.6 } });
    });
    gsap.fromTo($("img", photo), { scale: 1.22, yPercent: -4 }, { scale: 1.1, yPercent: 4, ease: "none", scrollTrigger: { trigger: "#advies", start: "top bottom", end: "bottom top", scrub: true } });
    rise($$(".advice__copy > p:not(.eyebrow)"), ".advice__copy", { stagger: 0.12 });
    rise($$(".advice__list li"), ".advice__list", { stagger: 0.14 });
    rise($("#advies .button"), "#advies .button");
  }

  function sets() {
    rise($$(".set"), ".sets", { stagger: 0.14 });
    gsap.fromTo(".deco--sets", { yPercent: 12 }, { yPercent: -12, ease: "none", scrollTrigger: { trigger: "#samenstellingen", start: "top bottom", end: "bottom top", scrub: true } });
  }

  function ways() {
    rise($$(".way"), ".ways", { stagger: 0.16 });
    rise($(".age-note"), ".age-note");
    for (const icon of $$(".way__icon")) {
      const shapes = $$("path, circle", icon);
      for (const shape of shapes) shape.setAttribute("pathLength", "1");
      gsap.set(shapes, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.to(shapes, { strokeDashoffset: 0, duration: 1.6, stagger: 0.12, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset", scrollTrigger: { trigger: icon, start: "top 85%", once: true } });
    }
    gsap.fromTo(".deco--ways", { yPercent: 10 }, { yPercent: -14, ease: "none", scrollTrigger: { trigger: "#ontvangen", start: "top bottom", end: "bottom top", scrub: true } });
  }

  function visit() {
    rise($$(".visit__copy > :not(.eyebrow):not(.section-title)"), ".visit__copy", { stagger: 0.12 });
    const frame = $(".map__frame");
    const pin = $(".map__pin");
    gsap.set(frame, { clipPath: "inset(0% 0% 100% 0%)" });
    gsap.set($("img", frame), { scale: 1.25 });
    gsap.set(pin, { y: -40, opacity: 0 });
    gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 82%", once: true } })
      .to(frame, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" }, 0)
      .to($("img", frame), { scale: 1, duration: 2, ease: "expo.out" }, 0)
      .to(pin, { y: 0, opacity: 1, duration: 1, ease: "bounce.out" }, 1.1);
    rise($(".map figcaption"), ".map");
  }

  function footer() {
    rise($$(".footer__grid > *"), ".footer", { stagger: 0.12 });
  }

  function tilt(container, selector, max) {
    if (!container || !finePointer.matches) return;
    let frame = 0;
    let stage = null;
    let point = { x: 0.5, y: 0.5 };
    const apply = () => {
      frame = 0;
      if (!stage) return;
      stage.style.setProperty("--rx", `${((0.5 - point.y) * max * 2).toFixed(2)}deg`);
      stage.style.setProperty("--ry", `${((point.x - 0.5) * max * 2).toFixed(2)}deg`);
      stage.style.setProperty("--mx", `${(point.x * 100).toFixed(1)}%`);
      stage.style.setProperty("--my", `${(point.y * 100).toFixed(1)}%`);
      stage.style.setProperty("--tx", `${((0.5 - point.x) * 12).toFixed(1)}px`);
      stage.style.setProperty("--ty", `${((0.5 - point.y) * 6).toFixed(1)}px`);
    };
    const release = (node) => {
      for (const name of ["--rx", "--ry", "--tx", "--ty"]) node?.style.removeProperty(name);
    };
    container.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const hit = event.target.closest(selector);
      if (hit !== stage) { release(stage); stage = hit; }
      if (!hit) return;
      const box = hit.getBoundingClientRect();
      point = { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
      if (!frame) frame = requestAnimationFrame(apply);
    });
    container.addEventListener("pointerleave", () => { release(stage); stage = null; });
  }

  function pointerDepth() {
    const hero = $(".hero");
    if (!finePointer.matches) return;
    const layers = [[".shelf__bottle--6", 12], [".shelf__bottle--3", 22], [".shelf__bottle--4", 34], [".hero__glow", 40]];
    const movers = layers.map(([selector, depth]) => {
      const node = $(selector);
      return node && { depth, x: gsap.quickTo(node, "--px", { duration: 1.4, ease: "power3.out" }), y: gsap.quickTo(node, "--py", { duration: 1.4, ease: "power3.out" }) };
    }).filter(Boolean);
    hero.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || innerWidth < 900) return;
      const box = hero.getBoundingClientRect();
      const nx = (event.clientX - box.left) / box.width - 0.5;
      const ny = (event.clientY - box.top) / box.height - 0.5;
      for (const mover of movers) { mover.x(-nx * mover.depth); mover.y(-ny * mover.depth * 0.6); }
    });
    hero.addEventListener("pointerleave", () => { for (const mover of movers) { mover.x(0); mover.y(0); } });
  }

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
