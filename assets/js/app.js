import { products, categories } from "./products.js";
import {
  sortOptions, formatPrice, selectProducts, countByCategory, addToCart, setQuantity,
  sanitiseCart, cartLines, cartCount, cartTotal, isRozenburgPostcode, isDutchPhone, MAX_PER_BOTTLE
} from "./catalog.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const byId = new Map(products.map((p) => [p.id, p]));
const CART_KEY = "dgk-mand";
const GATE_KEY = "dgk-18";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.classList.add("js");

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) if (child != null) node.append(child);
  return node;
}

const SVG = "http://www.w3.org/2000/svg";
function icon(d) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}
const PLUS = "M12 6v12M6 12h12";
const CROSS = "m6 6 12 12M18 6 6 18";

function bottleImage(product, { loading = "lazy", className = "bottle" } = {}) {
  return el("img", {
    class: className, src: (document.documentElement.dataset.base ?? "") + product.image, alt: product.imageAlt,
    width: product.imageWidth, height: product.imageHeight, loading, decoding: "async"
  });
}

function safeStorage(kind) {
  try { const s = window[kind]; s.setItem("dgk-test", "1"); s.removeItem("dgk-test"); return s; } catch { return null; }
}
const local = safeStorage("localStorage");
const session = safeStorage("sessionStorage");

/* ---------- dialogs ---------- */

let lastFocus = null;
function openDialog(dialog) {
  lastFocus = document.activeElement;
  for (const open of $$("dialog[open]")) if (open !== dialog && !open.matches("[data-gate]")) open.close();
  dialog.showModal();
}
for (const dialog of $$("dialog:not([data-gate])")) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
    if (event.target.closest("[data-close]")) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  });
}

/* ---------- age gate ---------- */

const gate = $("[data-gate]");
function passGate() {
  session?.setItem(GATE_KEY, "ja");
  gate.close();
  document.documentElement.classList.add("is-welcome");
}
if (session?.getItem(GATE_KEY) === "ja") {
  document.documentElement.classList.add("is-welcome");
} else {
  gate.showModal();
  $("[data-gate-yes]").focus();
}
gate.addEventListener("cancel", (event) => event.preventDefault());
$("[data-gate-yes]").addEventListener("click", passGate);
$("[data-gate-no]").addEventListener("click", () => {
  $("[data-gate-text]").textContent = "Dan zien we je graag terug als je 18 bent. Tot die tijd kun je hier niets bekijken of bestellen.";
  $("[data-gate-actions]").remove();
  gate.focus();
});

/* ---------- header + menu ---------- */

const header = $("[data-header]");
const onScroll = () => header.classList.toggle("is-solid", scrollY > 24);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const menuButton = $("[data-menu]");
const menuPanel = $("[data-menu-panel]");
function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuPanel.hidden = !open;
  header.classList.toggle("is-menu", open);
  document.documentElement.classList.toggle("menu-open", open);
}
menuButton.addEventListener("click", () => setMenu(menuPanel.hidden));
menuPanel.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !menuPanel.hidden) { setMenu(false); menuButton.focus(); }
});
matchMedia("(min-width: 1100px)").addEventListener("change", (event) => { if (event.matches) setMenu(false); });

/* ---------- shelf + featured ---------- */

const shelfOrder = ["campari", "beefeater-london-dry", "johnnie-walker-black-label", "hennessy-vs", "martini-bianco", "ballantines-finest", "smirnoff-vodka"];
$("[data-shelf]").append(...shelfOrder.map((id, i) => el("div", { class: `shelf__bottle shelf__bottle--${i + 1}` }, bottleImage(byId.get(id), { loading: "eager" }))));

$("[data-featured]").append(...products.filter((p) => p.featured).map((p, i) =>
  el("li", { class: "feature" },
    el("button", { class: "feature__stage", type: "button", "aria-label": `Bekijk ${p.name}`, onclick: () => showProduct(p.id) },
      el("span", { class: "feature__index", "aria-hidden": "true", text: ["I", "II", "III"][i] }),
      bottleImage(p)),
    el("div", { class: "feature__copy" },
      el("p", { class: "eyebrow", text: p.categoryLabel }),
      el("h3", { class: "feature__name" }, el("button", { type: "button", class: "plain", onclick: () => showProduct(p.id), text: p.name })),
      el("p", { class: "feature__style", text: p.style }),
      el("p", { class: "feature__serve", text: p.serve }),
      el("div", { class: "feature__foot" },
        el("span", { class: "price", text: formatPrice(p.price) }),
        el("button", { class: "button button--dark button--small", type: "button", onclick: () => add(p.id), text: "In de mand" }))))));

/* ---------- collection ---------- */

const state = { query: "", category: "alles", sort: "naam" };
const grid = $("[data-grid]");
const counts = countByCategory(products, categories);

$("[data-sort]").append(...sortOptions.map((o) => el("option", { value: o.id, text: o.label })));
$("[data-filters]").append(...categories.filter((c) => counts[c.id] > 0).map((c) =>
  el("button", { class: "filter", type: "button", "aria-pressed": String(c.id === state.category), "data-category": c.id },
    el("span", { text: c.label }), el("span", { class: "filter__count", text: String(counts[c.id]) }))));

function renderGrid() {
  const shown = selectProducts(products, state);
  grid.replaceChildren(...shown.map((p) =>
    el("li", { class: "card" },
      el("button", { class: "card__stage", type: "button", "aria-label": `Bekijk ${p.name}`, onclick: () => showProduct(p.id) }, bottleImage(p)),
      el("div", { class: "card__body" },
        el("p", { class: "card__meta" }, el("span", { text: p.categoryLabel }), el("span", { text: `${p.volume} · ${p.abv}` })),
        el("h3", { class: "card__name" }, el("button", { type: "button", class: "plain", onclick: () => showProduct(p.id), text: p.name })),
        el("p", { class: "card__style", text: p.style }),
        el("div", { class: "card__foot" },
          el("span", { class: "price", text: formatPrice(p.price) }),
          el("button", { class: "add", type: "button", "aria-label": `${p.name} in de mand`, onclick: () => add(p.id) },
            icon(PLUS), el("span", { text: "In de mand" })))))));
  const n = shown.length;
  $("[data-result-count]").textContent = n === 1 ? "1 fles" : `${n} flessen`;
  $("[data-empty]").hidden = n > 0;
  for (const button of $$("[data-category]")) button.setAttribute("aria-pressed", String(button.dataset.category === state.category));
}

let searchTimer;
$("[data-search]").addEventListener("input", (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.query = event.target.value; renderGrid(); }, 120);
});
$("[data-sort]").addEventListener("change", (event) => { state.sort = event.target.value; renderGrid(); });
$("[data-filters]").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderGrid();
});
$("[data-reset]").addEventListener("click", () => {
  Object.assign(state, { query: "", category: "alles" });
  $("[data-search]").value = "";
  renderGrid();
  $("[data-search]").focus();
});
renderGrid();

/* ---------- product detail ---------- */

const productDialog = $("[data-product-dialog]");
function stepper(initial, onChange, label) {
  let value = initial;
  const output = el("output", { class: "stepper__value", "aria-live": "polite", text: String(value) });
  const set = (v) => { value = Math.max(1, Math.min(MAX_PER_BOTTLE, v)); output.textContent = String(value); onChange(value); };
  return el("div", { class: "stepper", role: "group", "aria-label": label },
    el("button", { type: "button", class: "stepper__button", "aria-label": "Eén minder", onclick: () => set(value - 1), text: "−" }),
    output,
    el("button", { type: "button", class: "stepper__button", "aria-label": "Eén meer", onclick: () => set(value + 1), text: "+" }));
}
function showProduct(id) {
  const p = byId.get(id);
  let quantity = 1;
  $("[data-product-body]").replaceChildren(
    el("button", { class: "icon-button detail__close", type: "button", "data-close": true, "aria-label": "Sluit productinformatie" }, icon(CROSS)),
    el("div", { class: "detail__stage" }, bottleImage(p, { loading: "eager" }),
      el("p", { class: "detail__credit" }, `Foto: ${p.credit.creator}, `, el("a", { href: p.credit.licenseUrl, rel: "noopener", text: p.credit.license }))),
    el("div", { class: "detail__copy" },
      el("p", { class: "eyebrow", text: p.categoryLabel }),
      el("h2", { class: "detail__name", id: "product-titel", text: p.name }),
      el("p", { class: "detail__style", text: p.style }),
      el("dl", { class: "detail__facts" },
        el("div", {}, el("dt", { text: "Inhoud" }), el("dd", { text: p.volume })),
        el("div", {}, el("dt", { text: "Alcohol" }), el("dd", { text: p.abv })),
        el("div", {}, el("dt", { text: "Zo drink je hem" }), el("dd", { text: p.serve }))),
      el("p", { class: "detail__price" }, el("span", { class: "price price--large", text: formatPrice(p.price) }), el("span", { class: "detail__demo", text: "voorbeeldprijs" })),
      el("div", { class: "detail__buy" },
        stepper(1, (v) => { quantity = v; }, "Aantal flessen"),
        el("button", { class: "button button--dark", type: "button", onclick: () => { add(p.id, quantity); productDialog.close(); }, text: "In de mand" })),
      el("p", { class: "detail__note", text: "Bij afhalen en bezorgen vragen we naar je legitimatiebewijs." })));
  openDialog(productDialog);
}

/* ---------- cart ---------- */

let cart = {};
try { cart = sanitiseCart(JSON.parse(local?.getItem(CART_KEY) ?? "{}"), products); } catch { cart = {}; }
const cartDialog = $("[data-cart]");
const toast = $("[data-toast]");
let toastTimer;

function saveCart() {
  local?.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}
function notify(text) {
  toast.textContent = text;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2600);
}
function add(id, quantity = 1) {
  const before = cart[id] ?? 0;
  cart = addToCart(cart, id, quantity);
  saveCart();
  const p = byId.get(id);
  notify(cart[id] === before ? `Je hebt al ${MAX_PER_BOTTLE} flessen ${p.name} in je mand.` : `${p.name} ligt in je mand.`);
  const badge = $("[data-cart-count]");
  badge.classList.remove("is-bumped");
  void badge.offsetWidth;
  badge.classList.add("is-bumped");
}
function renderBadge() {
  const count = cartCount(cart);
  const badge = $("[data-cart-count]");
  badge.textContent = String(count);
  badge.setAttribute("aria-label", count === 1 ? "1 fles in je mand" : `${count} flessen in je mand`);
}
function renderCart() {
  renderBadge();
  const lines = cartLines(cart, products);
  const body = $("[data-cart-body]");
  $("[data-cart-foot]").hidden = lines.length === 0;
  if (!lines.length) {
    body.replaceChildren(el("div", { class: "drawer__empty" },
      el("p", { class: "drawer__empty-title", text: "Je mand is nog leeg." }),
      el("p", { text: "Kies een fles uit de collectie, of bel de winkel als je hulp wilt bij het kiezen." }),
      el("a", { class: "button button--outline", href: "#collectie", "data-close": true, text: "Naar de collectie" })));
    return;
  }
  body.replaceChildren(el("ul", { class: "lines" }, lines.map(({ product: p, quantity, total }) =>
    el("li", { class: "line" },
      el("div", { class: "line__thumb" }, bottleImage(p)),
      el("div", { class: "line__info" },
        el("p", { class: "line__name", text: p.name }),
        el("p", { class: "line__unit", text: `${formatPrice(p.price)} per fles · ${p.volume}` }),
        el("div", { class: "line__controls" },
          stepper(quantity, (v) => { cart = setQuantity(cart, p.id, v); local?.setItem(CART_KEY, JSON.stringify(cart)); updateTotals(); }, `Aantal ${p.name}`),
          el("button", { class: "link-button", type: "button", onclick: () => { cart = setQuantity(cart, p.id, 0); saveCart(); $("[data-cart-body] .lines button, [data-cart-body] a")?.focus(); notify(`${p.name} is uit je mand.`); }, text: "Verwijder" }))),
      el("p", { class: "line__total", "data-line-total": p.id, text: formatPrice(total) })))));
  updateTotals();
}
function updateTotals() {
  const total = formatPrice(cartTotal(cart, products));
  $("[data-cart-total]").textContent = total;
  for (const { product, total: t } of cartLines(cart, products)) {
    const cell = $(`[data-line-total="${product.id}"]`);
    if (cell) cell.textContent = formatPrice(t);
  }
  renderBadge();
}
$("[data-open-cart]").addEventListener("click", () => { renderCart(); openDialog(cartDialog); });
renderCart();

/* ---------- checkout ---------- */

const checkoutDialog = $("[data-checkout-dialog]");
const form = $("[data-checkout-form]");
const done = $("[data-done]");
const delivery = $("[data-delivery]");

function renderSummary() {
  $("[data-summary-lines]").replaceChildren(...cartLines(cart, products).map(({ product, quantity, total }) =>
    el("li", {}, el("span", { text: `${quantity} × ${product.name}` }), el("span", { text: formatPrice(total) }))));
  $("[data-summary-total]").textContent = formatPrice(cartTotal(cart, products));
}
function syncDelivery() {
  const bezorgen = form.elements.ontvangst.value === "bezorgen";
  delivery.hidden = !bezorgen;
  form.elements.straat.required = bezorgen;
  form.elements.postcode.required = bezorgen;
}
form.addEventListener("change", (event) => { if (event.target.name === "ontvangst") syncDelivery(); });

const rules = {
  naam: (v) => v.trim().length >= 2 || "Vul je naam in.",
  telefoon: (v) => isDutchPhone(v) || "Vul een Nederlands telefoonnummer in, bijvoorbeeld 06 12345678.",
  straat: (v) => delivery.hidden || /\d/.test(v) && v.trim().length >= 4 || "Vul je straat en huisnummer in.",
  postcode: (v) => delivery.hidden || isRozenburgPostcode(v) || "We bezorgen alleen binnen Rozenburg. Vul een postcode in die begint met 3181.",
  leeftijd: (_, input) => input.checked || "Bevestig dat je 18 jaar of ouder bent."
};
function validateField(name) {
  const input = form.elements[name];
  const result = rules[name](input.value ?? "", input);
  const message = result === true ? "" : result;
  $(`[data-error-for="${name}"]`).textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}
form.addEventListener("focusout", (event) => {
  const name = event.target.name;
  if (rules[name] && event.target.getAttribute("aria-invalid") !== null) validateField(name);
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const invalid = Object.keys(rules).filter((name) => !validateField(name));
  if (invalid.length) { form.elements[invalid[0]].focus(); return; }
  const bezorgen = form.elements.ontvangst.value === "bezorgen";
  const naam = form.elements.naam.value.trim().split(/\s+/)[0];
  const count = cartCount(cart);
  $("[data-done-title]").textContent = `Dank je wel, ${naam}.`;
  $("[data-done-text]").textContent = bezorgen
    ? `In een echte bestelling bellen we je om ${count === 1 ? "de fles" : `de ${count} flessen`} te bezorgen en vragen we aan de deur naar je legitimatiebewijs.`
    : `In een echte bestelling bellen we je wanneer ${count === 1 ? "de fles" : `de ${count} flessen`} klaarstaan aan het Raadhuisplein. Neem je legitimatiebewijs mee.`;
  form.reset();
  syncDelivery();
  cart = {};
  saveCart();
  form.hidden = true;
  done.hidden = false;
  done.focus();
});
$("[data-checkout]").addEventListener("click", () => {
  form.hidden = false;
  done.hidden = true;
  for (const node of $$("[data-error-for]", form)) node.textContent = "";
  for (const input of $$("[aria-invalid]", form)) input.removeAttribute("aria-invalid");
  syncDelivery();
  renderSummary();
  openDialog(checkoutDialog);
});

/* ---------- credits ---------- */

$("[data-credit-list]").append(...products.map((p) =>
  el("li", {},
    el("strong", { text: p.name }), " — ",
    el("a", { href: p.credit.sourceUrl, rel: "noopener", text: p.credit.title }),
    `, ${p.credit.creator}, `,
    el("a", { href: p.credit.licenseUrl, rel: "noopener", text: p.credit.license }),
    `; ${p.credit.changes}.`)));
$("[data-open-credits]").addEventListener("click", () => openDialog($("[data-credits]")));

/* ---------- reveal ---------- */

if (!reducedMotion.matches && !document.documentElement.dataset.motion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  for (const node of $$(".section-head, .feature, .advice__photo, .advice__copy, .set, .way, .age-note, .story__num, .story__copy, .visit__copy, .map")) {
    node.classList.add("reveal");
    observer.observe(node);
  }
}
