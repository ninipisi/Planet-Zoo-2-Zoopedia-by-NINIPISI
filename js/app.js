/* ===== Zoopedia PZ2 – Oberfläche =====
   Lädt meta.json, Tierdaten und Übersetzungen, verwaltet den Zustand (nur lokal im Browser)
   und zeichnet Tabs, Filter, Tabelle, Detailansicht, Planer und Dialoge. Rechenlogik steckt in logic.js (ZL). */
(function () {
  "use strict";

  const STORE_KEY = "zoopedia-pz2.v1";
  const AUTHOR = { name: "NINIPISI", url: "https://steamcommunity.com/id/ninipisi", flag: "🇩🇪" };
  const LANGS = [
    ["de", "🇩🇪", "Deutsch"], ["en", "🇬🇧", "English"], ["fr", "🇫🇷", "Français"], ["it", "🇮🇹", "Italiano"], ["es", "🇪🇸", "Español (España)"],
    ["cs", "🇨🇿", "Čeština"], ["da", "🇩🇰", "Dansk"], ["nl", "🇳🇱", "Nederlands"], ["ja", "🇯🇵", "日本語"], ["ko", "🇰🇷", "한국어"], ["pl", "🇵🇱", "Polski"],
    ["pt-BR", "🇧🇷", "Português (Brasil)"], ["ru", "🇷🇺", "Русский"], ["zh-CN", "🇨🇳", "简体中文"], ["es-419", "🇲🇽", "Español (Latinoamérica)"],
    ["th", "🇹🇭", "ไทย"], ["zh-TW", "🇹🇼", "繁體中文"]
  ];
  const FALLBACK = { "es-419": "es" };
  const PLANNER = "planner";
  const LITERAL_UNITS = ["m²", "m", "%", "kg"];
  const GROUP_HINTS = { "grp.req": "grp.req.hint", "grp.inc": "grp.inc.hint", "grp.atMin": "grp.atMin.hint", "grp.atMax": "grp.atMax.hint" };

  /* Grafiken: Pfad im Projekt; die Vorschau-Datei kann sie über window.ZP_ASSETS eingebettet mitbringen */
  const asset = p => (window.ZP_ASSETS && window.ZP_ASSETS[p]) || p;
  const REQ_ICON = { shelter: 1, water: 1, deep: 1, climb: 1, land: 1, flight: 1, temp: 1, humidity: 1, salinity: 1, fence: 1, height: 1, strength: 1 };
  const SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  const FILTER_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>';
  const PAW_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="6" cy="10" rx="2.2" ry="2.8"/><ellipse cx="10" cy="5.6" rx="2.2" ry="2.9"/><ellipse cx="14.4" cy="5.6" rx="2.2" ry="2.9"/><ellipse cx="18.3" cy="10" rx="2.2" ry="2.8"/><path d="M12.2 11.5c-2.6 0-5.6 3.4-5.6 6.1 0 1.7 1.3 2.6 2.9 2.6 1.1 0 1.8-.5 2.7-.5s1.6.5 2.7.5c1.6 0 2.9-.9 2.9-2.6 0-2.7-3-6.1-5.6-6.1z"/></svg>';
  const KOFI_URL = "https://ko-fi.com/theniceguides";
  const CUP_SVG = '<svg class="cup" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 10h17v8.5A7.5 7.5 0 0 1 14.5 26h-2A7.5 7.5 0 0 1 5 18.5z" fill="currentColor"/>' +
    '<path d="M22 12.5h2.2a3.8 3.8 0 0 1 0 7.6H21.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M13.5 21.2c-2.6-1.7-4.1-3.1-4.1-4.8 0-1.2.9-2 2-2 .9 0 1.6.5 2.1 1.2.5-.7 1.2-1.2 2.1-1.2 1.1 0 2 .8 2 2 0 1.7-1.5 3.1-4.1 4.8z" fill="var(--kofi-heart, #ff6b6b)"/>' +
    '<path d="M10 3.5c-1 1.3 1 2.2 0 3.6M14.5 3.5c-1 1.3 1 2.2 0 3.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></svg>';
  const STEAM_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h12l1 5H5z"/><path d="M5 7h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M9 11a3 3 0 0 0 6 0"/></svg>';
  const COLS_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>';

  const S = { meta: null, i18n: {}, all: [], byId: {}, byCat: {}, compat: { pairs: [] }, state: null };
  const $ = id => document.getElementById(id);

  /* ---------- DOM-Helfer ---------- */
  function h(tag, attrs, kids) {
    const el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      const v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    [].concat(kids == null ? [] : kids).forEach(c => { if (c != null && c !== false) el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c); });
    return el;
  }
  const svg = html => h("span", { html }).firstChild;

  /* ---------- Übersetzung ---------- */
  function t(key, params) {
    const lang = S.state.lang;
    const chain = [lang, FALLBACK[lang], "en", "de"];
    let s = null;
    for (const l of chain) { if (l && S.i18n[l] && S.i18n[l][key]) { s = S.i18n[l][key]; break; } }
    if (s == null) s = key;
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? params[k] : m));
    return s;
  }
  /* Text mit {author} -> Knoten mit Link auf das Steam-Profil */
  function tAuthor(key) {
    const parts = t(key).split("{author}");
    const out = [parts[0]];
    for (let i = 1; i < parts.length; i++) {
      out.push(h("a", { href: AUTHOR.url, target: "_blank", rel: "noopener", text: AUTHOR.name }), " " + AUTHOR.flag, parts[i]);
    }
    return out;
  }
  const lcFirst = s => (s ? s.charAt(0).toLocaleLowerCase() + s.slice(1) : s);
  /* Meterangaben (Zaunhöhe, Wassergraben) immer mit zwei Nachkommastellen: #,## m */
  function fmtM(n) {
    if (!ZL.isNum(n)) return "–";
    try { return new Intl.NumberFormat(S.state.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " m"; } catch (e) { return n.toFixed(2) + " m"; }
  }
  function fmt(n, dec) {
    if (!ZL.isNum(n)) return "–";
    try { return new Intl.NumberFormat(S.state.lang, { maximumFractionDigits: dec == null ? 2 : dec }).format(n); } catch (e) { return String(n); }
  }
  /* Temperatur: Daten in °C, Anzeige je nach Einstellung */
  const isF = () => S.state.tempUnit === "f";
  const tempUnit = () => (isF() ? "°F" : "°C");
  const tShow = c => (isF() ? ZL.cToF(c) : c);
  const fmtT = c => fmt(tShow(c), 1);
  function nameOf(a) {
    if (!a) return "";
    const n = a.names || {};
    return n[S.state.lang] || n[FALLBACK[S.state.lang]] || a.name;
  }
  const sortCtx = () => ({ nameOf, locale: S.state.lang, dlcOrder: S.meta.dlcs.map(d => d.id) });

  /* ---------- Zustand (localStorage, jeder Besucher für sich) ---------- */
  function defaultState() {
    const dl = {};
    S.meta.dlcs.forEach(d => { dl[d.id] = !!d.default; });
    let lang = "de";
    try {
      const nav = (navigator.languages || [navigator.language || "de"]).map(x => String(x));
      outer: for (const n of nav) {
        const exact = LANGS.find(l => l[0].toLowerCase() === n.toLowerCase());
        if (exact) { lang = exact[0]; break; }
        for (const l of LANGS) if (l[0].split("-")[0] === n.split("-")[0].toLowerCase()) { lang = l[0]; break outer; }
      }
    } catch (e) { /* egal */ }
    return { v: 1, lang, tab: S.meta.categories[0].id, dlcs: dl, calcMode: "sum", theme: "system", tempUnit: "c", cats: {}, planner: [],
      zooMode: false, zoos: [{ id: "z1", name: "", owned: [] }], zoo: "z1" };
  }
  function loadState() {
    const def = defaultState();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { saved = null; }
    if (!saved || saved.v !== 1) return def;
    const st = Object.assign(def, saved);
    S.meta.dlcs.forEach(d => { if (!(d.id in st.dlcs)) st.dlcs[d.id] = !!d.default; }); // neue DLCs bekommen ihren Standard
    if (!LANGS.some(l => l[0] === st.lang)) st.lang = "de";
    if (["system", "light", "dark"].indexOf(st.theme) < 0) st.theme = "system";
    if (st.tempUnit !== "f") st.tempUnit = "c";
    if (!Array.isArray(st.planner)) st.planner = [];
    if (!Array.isArray(st.zoos) || !st.zoos.length) st.zoos = def.zoos;
    st.zoos.forEach(z => { if (!Array.isArray(z.owned)) z.owned = []; });
    if (!st.zoos.some(z => z.id === st.zoo)) st.zoo = st.zoos[0].id;
    return st;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S.state)); } catch (e) { /* privat/gesperrt: einfach ohne Speichern */ } }

  const MERGED = new WeakSet();
  /* Gespeicherte Filter mit Werten, die es nicht mehr gibt (z. B. alte Biome), bereinigen */
  function sanitizeFilter(f) {
    const ok = { status: S.meta.statuses.map(x => x.id), continents: S.meta.continents, biomes: S.meta.biomes, roles: S.meta.roles || [] };
    Object.keys(ok).forEach(k => { if (Array.isArray(f[k])) { const keep = f[k].filter(v => ok[k].indexOf(v) >= 0); if (keep.length !== f[k].length) f[k].splice(0, f[k].length, ...keep); } });
    return f;
  }
  function catState(catId) {
    const c = S.state.cats[catId] || (S.state.cats[catId] = {});
    if (!c.filter) c.filter = ZL.emptyFilter();
    else if (!MERGED.has(c.filter)) { const d = ZL.emptyFilter(); Object.keys(d).forEach(k => { if (!(k in c.filter)) c.filter[k] = d[k]; }); }
    MERGED.add(c.filter); // fehlende Felder nur einmal ergänzen, Objekt bleibt dasselbe
    sanitizeFilter(c.filter);
    if (!c.sort) c.sort = { col: "name", dir: "asc" };
    if (!c.cols) c.cols = {};
    if (c.open == null) c.open = false;
    return c;
  }
  function enabledDlcs() { return S.meta.dlcs.filter(d => S.state.dlcs[d.id]).map(d => d.id); }
  function dlcName(d) {
    if (typeof d === "string") d = S.meta.dlcs.find(x => x.id === d) || { id: d };
    if (d.names) return d.names[S.state.lang] || d.names[FALLBACK[S.state.lang]] || d.names.en || d.names.de || d.id;
    const k = "dlc." + d.id;
    const s = t(k);
    return s === k ? d.id : s;
  }
  function catById(id) { return S.meta.categories.find(c => c.id === id); }
  function animalsOf(catId) {
    const c = catById(catId);
    if (!c) return [];
    return S.byCat[catId] || (S.byCat[catId] = S.all.filter(a => (a.types || []).indexOf(c.type) >= 0));
  }
  function animalById(id) { return S.byId[id]; }
  function statusMeta(id) { return S.meta.statuses.find(s => s.id === id); }
  /* Kürzel wie im Spiel (EW, CR, EN, VU, NT, LC, DO, DD, NE) – in allen Sprachen gleich */
  function statusAbbr(id) { const s = statusMeta(id); return s ? s.code : (id || "–"); }
  function statusBadge(id, withName) {
    const b = h("span", { class: "st st-" + id, title: t("status." + id) }, h("span", { class: "st-code", text: statusAbbr(id) }));
    return withName ? h("span", { class: "st-wrap" }, [b, h("span", { class: "st-name", text: t("status." + id) })]) : b;
  }
  /* Icons aus dem Spiel */
  function reqIcon(key, title) {
    if (!REQ_ICON[key]) return null;
    return h("span", { class: "req-ic", title: title || null, "aria-hidden": title ? null : "true" }, h("img", { src: asset("assets/anforderungen/" + key + ".svg"), alt: "" }));
  }
  function biomeIcon(id, withLabel) {
    const img = h("img", { class: "bi-ic", src: asset("assets/biome/" + id + ".svg"), alt: withLabel ? "" : t("biome." + id), title: t("biome." + id) });
    return withLabel ? h("span", { class: "bi-tag" }, [img, t("biome." + id)]) : img;
  }
  function walkIcon(v) {
    if (v == null) return null;
    return h("img", { class: "walk-ic", src: asset(v ? "assets/icons/haken.svg" : "assets/icons/kreuz.svg"), alt: t(v ? "walk.yes" : "walk.no"), title: t(v ? "walk.yes" : "walk.no") });
  }
  function giftImg(extraTitle) {
    return h("img", { class: "gift", src: asset("assets/geschenk.png"), alt: t("gift.hint"), title: t("gift.hint") + (extraTitle || "") });
  }
  /* Zooplaner: aktueller Zoo und seine Tiere */
  function curZoo() { return S.state.zoos.find(z => z.id === S.state.zoo) || S.state.zoos[0]; }
  function zooName(z) { return z.name || t("zoo.default"); }
  function ownedSet() { return new Set(curZoo().owned); }

  /* ---------- Farbschema ---------- */
  function applyTheme() {
    const root = document.documentElement;
    if (S.state.theme === "light" || S.state.theme === "dark") root.setAttribute("data-theme", S.state.theme);
    else root.removeAttribute("data-theme");
    const dark = S.state.theme === "dark" || (S.state.theme === "system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", dark ? "#17594e" : "#1e8a74");
  }

  /* ---------- Laden ---------- */
  async function getJSON(url) {
    if (window.ZP_INLINE && window.ZP_INLINE[url]) return JSON.parse(JSON.stringify(window.ZP_INLINE[url])); // nur Vorschau-Datei
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(url + ": " + r.status);
    return r.json();
  }
  async function init() {
    try {
      const [meta, i18n] = await Promise.all([getJSON("data/meta.json"), getJSON("i18n/translations.json")]);
      S.meta = meta; S.i18n = i18n;
      const loads = [getJSON(meta.animalsFile || "data/tiere.json").then(d => { S.all = (d && d.animals) || []; S.all.forEach(a => { S.byId[a.id] = a; }); })];
      if (meta.compatFile) loads.push(getJSON(meta.compatFile).then(d => { S.compat = d || { pairs: [] }; }).catch(() => {}));
      await Promise.all(loads);
    } catch (e) {
      $("view").innerHTML = "";
      $("view").appendChild(h("div", { class: "card empty" }, [
        "Die Daten konnten nicht geladen werden. Bitte die Seite über einen Webserver öffnen (z. B. „python -m http.server“), nicht per Doppelklick.",
        h("br"), h("small", { text: String(e.message || e) })
      ]));
      return;
    }
    S.state = loadState();
    const fromHash = location.hash.replace("#", "");
    if (fromHash && (fromHash === PLANNER || catById(fromHash))) S.state.tab = fromHash;
    if (S.state.tab !== PLANNER && !catById(S.state.tab)) S.state.tab = S.meta.categories[0].id;

    applyTheme();
    bindStatic();
    renderAll();
    window.addEventListener("hashchange", () => {
      const id = location.hash.replace("#", "");
      if ((id === PLANNER || catById(id)) && id !== S.state.tab) { S.state.tab = id; save(); renderTabs(); renderView(); }
    });
    if (window.matchMedia) {
      const mq = matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => { if (S.state.theme === "system") applyTheme(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ---------- Statische Teile ---------- */
  function bindStatic() {
    const sel = $("langSel");
    LANGS.forEach(([code, flag, name]) => sel.appendChild(h("option", { value: code, text: flag + " " + name })));
    sel.addEventListener("change", () => { S.state.lang = sel.value; save(); renderAll(); });
    $("btnSettings").addEventListener("click", openSettings);
    $("btnDlc").addEventListener("click", openDlcDialog);
    $("dlgX").addEventListener("click", () => $("dlg").close());
    $("dlg").addEventListener("click", e => { if (e.target === $("dlg")) $("dlg").close(); });
    $("dlg").addEventListener("close", () => { if (dlgOnClose) { const f = dlgOnClose; dlgOnClose = null; f(); } });
  }

  function renderAll() {
    document.documentElement.lang = S.state.lang;
    $("langSel").value = S.state.lang;
    $("langSel").setAttribute("aria-label", t("nav.language"));
    $("langSel").title = t("nav.language");
    const tag = $("brandTag"); tag.innerHTML = ""; tAuthor("app.tagline").forEach(n => tag.append(n));
    $("btnSettingsLabel").textContent = t("nav.settings");
    $("btnSettings").setAttribute("aria-label", t("nav.settings"));
    $("btnSettings").title = t("nav.settings");
    $("dlgX").setAttribute("aria-label", t("settings.close"));
    const kt = $("kofiTop");
    if (kt) { kt.innerHTML = ""; kt.href = KOFI_URL; kt.title = t("kofi.title"); kt.append(svg(CUP_SVG), t("kofi.button")); }
    const ft = $("footer"); ft.innerHTML = "";
    /* Ko-fi: eigener, zum Layout passender Kasten (kein externes Ko-fi-Skript -> keine Fremd-Cookies) */
    ft.append(h("section", { class: "kofi card", "aria-label": "Ko-fi" }, [
      svg(CUP_SVG),
      h("div", { class: "kofi-text" }, [h("strong", { text: t("kofi.title") }), h("span", { text: t("kofi.text") })]),
      h("a", { class: "btn kofi-btn", href: KOFI_URL, target: "_blank", rel: "noopener" }, [svg(CUP_SVG), t("kofi.button")])
    ]));
    ft.append(h("div", {}, tAuthor("footer.line1")), h("div", { text: t("footer.line2") }), h("small", { text: t("footer.flags") }));
    renderDlcButton();
    renderTabs();
    renderView();
  }
  function renderDlcButton() {
    const on = enabledDlcs().length, all = S.meta.dlcs.length;
    $("btnDlcLabel").textContent = t("dlc.button");
    $("btnDlcCount").textContent = on + "/" + all;
    $("btnDlc").title = t("dlc.title");
  }

  /* ---------- Tabs ---------- */
  function renderTabs() {
    const nav = $("tabs");
    nav.innerHTML = "";
    const dl = enabledDlcs();
    S.meta.categories.forEach(c => {
      const count = animalsOf(c.id).filter(a => dl.indexOf(a.dlc) >= 0).length;
      nav.appendChild(tabButton(c.id, t(c.tab), count, count ? "" : "empty-tab"));
    });
    nav.appendChild(tabButton(PLANNER, t("tab.planner"), null, "planner"));
  }
  function tabButton(id, label, count, extra) {
    const sel = S.state.tab === id;
    return h("button", {
      type: "button", class: "tab" + (extra ? " " + extra : ""), role: "tab", "aria-selected": sel ? "true" : "false",
      onclick: () => { goTab(id); }
    }, [label, count == null ? null : h("span", { class: "badge", text: String(count) })]);
  }
  function goTab(id) {
    if (S.state.tab === id) return;
    S.state.tab = id; save();
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* z. B. Vorschau */ }
    renderTabs(); renderView();
    window.scrollTo({ top: 0 });
  }

  function renderView() {
    const v = $("view");
    v.innerHTML = "";
    if (S.state.tab === PLANNER) renderPlanner(v);
    else renderCategory(v, catById(S.state.tab));
  }

  /* ---------- Kategorie-Ansicht ---------- */
  function renderCategory(v, cat) {
    const cs = catState(cat.id);
    if (!animalsOf(cat.id).length) {
      v.appendChild(h("div", { class: "card empty", text: t("table.noData") }));
      return;
    }
    if (!enabledDlcs().length) v.appendChild(h("div", { class: "warn-box", style: "margin-bottom:12px" }, [t("dlc.noneWarn") + " ", h("button", { type: "button", class: "btn", style: "height:32px;margin-left:6px", text: t("dlc.button"), onclick: openDlcDialog })]));
    v.appendChild(renderToolbar(cat, cs));
    v.appendChild(h("div", { class: "table-meta" }, [h("span", { id: "countText" }), h("span", { style: "font-weight:600", text: t("table.hint") })]));
    v.appendChild(h("div", { class: "table-wrap", id: "tableWrap" }));
    renderTable(cat);
  }

  function onFilterChange(cat) { save(); renderTable(cat); updateFilterBadge(cat); }

  function activeFilterCount(f) {
    let n = 0;
    ["status", "continents", "biomes", "roles"].forEach(k => { if (f[k] && f[k].length) n++; });
    if (ZL.isNum(f.tempFrom) || ZL.isNum(f.tempTo)) n++;
    if (ZL.isNum(f.sizeMax)) n++;
    if (f.climbProof && f.climbProof !== "any") n++;
    if (f.walk && f.walk !== "any") n++;
    if (f.gift) n++;
    if (f.owned && f.owned !== "any") n++;
    return n;
  }
  function updateFilterBadge(cat) {
    const cs = catState(cat.id);
    const n = activeFilterCount(cs.filter);
    const b = $("filterBadge"), r = $("filterReset");
    if (b) { b.textContent = t("filter.active", { n }); b.hidden = !n; }
    if (r) r.hidden = !(n || (cs.filter.search && cs.filter.search.trim()));
    const key = filterKey(cs.filter);
    document.querySelectorAll(".preset[data-key]").forEach(el => el.setAttribute("aria-pressed", el.dataset.key === key ? "true" : "false"));
    const sv = $("presetSave"); if (sv) sv.classList.toggle("muted", !hasAnyFilter(cs.filter));
    document.querySelectorAll(".owned-seg button[data-v]").forEach(el => el.setAttribute("aria-pressed", el.dataset.v === (cs.filter.owned || "any") ? "true" : "false"));
  }

  /* ---------- Gespeicherte Filter (je Übersicht, nur lokal) ---------- */
  function hasAnyFilter(f) { return activeFilterCount(f) > 0 || !!(f.search && f.search.trim()); }
  function filterKey(f) {
    const n = Object.assign(ZL.emptyFilter(), JSON.parse(JSON.stringify(f)));
    n.search = (n.search || "").trim();
    ["status", "continents", "biomes", "roles"].forEach(k => { n[k] = (n[k] || []).slice().sort(); });
    return JSON.stringify(Object.keys(n).sort().map(k => [k, n[k]]));
  }
  function renderPresets(cat, cs) {
    if (!Array.isArray(cs.presets)) cs.presets = [];
    const row = h("div", { class: "presets" }, [h("span", { class: "presets-lbl", text: t("preset.title") + ":" })]);
    const list = h("div", { class: "chips" });
    cs.presets.forEach((p, i) => {
      list.appendChild(h("span", { class: "preset-wrap" }, [
        h("button", { type: "button", class: "chip preset", "data-key": filterKey(p.filter), "aria-pressed": "false", title: t("preset.apply", { name: p.name }), text: p.name,
          onclick: () => { cs.filter = Object.assign(ZL.emptyFilter(), JSON.parse(JSON.stringify(p.filter))); save(); renderView(); } }),
        h("button", { type: "button", class: "preset-x", title: t("preset.delete"), "aria-label": t("preset.delete") + ": " + p.name, text: "×",
          onclick: () => { cs.presets.splice(i, 1); save(); renderView(); } })
      ]));
    });
    row.appendChild(list);

    const input = h("input", { type: "text", class: "num-in", style: "width:100%", maxlength: "40", placeholder: t("preset.namePh"), "aria-label": t("preset.namePh") });
    const msg = h("p", { class: "f-hint", text: t("preset.hint") });
    const doSave = () => {
      const name = input.value.trim();
      if (!hasAnyFilter(cs.filter)) { msg.textContent = t("preset.needFilter"); msg.classList.add("note-warn"); return; }
      if (!name) { input.focus(); return; }
      const copy = JSON.parse(JSON.stringify(cs.filter));
      const ex = cs.presets.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (ex) ex.filter = copy; else cs.presets.push({ name, filter: copy });
      save(); renderView();
    };
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); doSave(); } });
    const pop = h("div", { class: "menu-pop", style: "left:0;right:auto;width:300px" }, [
      input, h("button", { type: "button", class: "btn btn-primary", text: t("preset.saveBtn"), onclick: doSave }), msg]);
    const det = h("details", { class: "menu" }, [h("summary", { class: "chip preset-add", id: "presetSave", text: "＋ " + t("preset.save") }), pop]);
    det.addEventListener("toggle", () => {
      if (!det.open) return;
      msg.textContent = hasAnyFilter(cs.filter) ? t("preset.hint") : t("preset.needFilter");
      msg.classList.toggle("note-warn", !hasAnyFilter(cs.filter));
      setTimeout(() => input.focus());
    });
    row.appendChild(det);
    return row;
  }

  /* ---------- Zooplaner: Zoos anlegen, wechseln, umbenennen, löschen ---------- */
  function renderZooBar(cat, cs) {
    const f = cs.filter;
    const z = curZoo();
    const box = h("div", { class: "zoo-bar" });
    const sel = h("select", { class: "sel-in", "aria-label": t("zoo.zoo"),
      onchange: e => { S.state.zoo = e.target.value; save(); renderView(); } },
      S.state.zoos.map(x => h("option", { value: x.id, text: zooName(x), selected: x.id === z.id })));
    const input = h("input", { type: "text", class: "num-in", style: "width:100%", maxlength: "40", placeholder: t("zoo.namePh"), "aria-label": t("zoo.namePh") });
    let mode = "new";
    const okBtn = h("button", { type: "button", class: "btn btn-primary" });
    const doIt = () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      if (mode === "new") {
        const id = "z" + Date.now().toString(36);
        S.state.zoos.push({ id, name, owned: [] }); S.state.zoo = id;
      } else z.name = name;
      save(); renderView();
    };
    okBtn.addEventListener("click", doIt);
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); doIt(); } });
    const pop = h("div", { class: "menu-pop", style: "left:0;right:auto;width:280px" }, [input, okBtn]);
    const det = h("details", { class: "menu" }, [h("summary", { class: "btn", text: "✎" , title: t("zoo.rename") + " / " + t("zoo.new") }), pop]);
    const open = m => {
      mode = m;
      okBtn.textContent = t(m === "new" ? "zoo.create" : "zoo.renameBtn");
      input.value = m === "new" ? "" : (z.name || "");
      det.open = true; setTimeout(() => input.focus());
    };
    const newBtn = h("button", { type: "button", class: "btn", text: "＋ " + t("zoo.new"), onclick: e => { e.stopPropagation(); open("new"); } });
    det.querySelector("summary").addEventListener("click", e => { e.preventDefault(); if (det.open) det.open = false; else open("rename"); });
    let armed = false;
    const del = h("button", { type: "button", class: "btn btn-quiet danger", title: t("zoo.delete"), "aria-label": t("zoo.delete"), text: "🗑",
      onclick: () => {
        if (!armed) { armed = true; del.textContent = t("zoo.deleteConfirm"); return; }
        S.state.zoos = S.state.zoos.filter(x => x !== z);
        if (!S.state.zoos.length) S.state.zoos.push({ id: "z1", name: "", owned: [] });
        S.state.zoo = S.state.zoos[0].id; save(); renderView();
      } });
    const segBox = h("div", { class: "seg owned-seg", role: "group", "aria-label": t("zoo.show") },
      [["any", t("zoo.all")], ["yes", "✓ " + t("zoo.have")], ["no", t("zoo.missing")]].map(([val, label]) =>
        h("button", { type: "button", "data-v": val, "aria-pressed": (f.owned || "any") === val ? "true" : "false", text: label,
          onclick: () => { f.owned = val; onFilterChange(cat); } })));
    box.append(
      h("label", { class: "zoo-pick" }, [h("span", { class: "zoo-lbl", text: t("zoo.zoo") }), sel]),
      h("span", { class: "zoo-tools" }, [det, newBtn, del]),
      h("span", { class: "zoo-show" }, [h("span", { class: "zoo-lbl", text: t("zoo.show") }), segBox]),
      h("span", { class: "zoo-count", id: "zooCount" }));
    return h("div", { class: "zoo-panel" }, [h("p", { class: "f-hint", style: "margin:0 0 8px", text: t("zoo.hint") }), box]);
  }
  function updateZooCount(cat) {
    const el = $("zooCount"); if (!el) return;
    const dl = enabledDlcs();
    const list = animalsOf(cat.id).filter(a => dl.indexOf(a.dlc) >= 0);
    const own = ownedSet();
    el.textContent = t("zoo.count", { have: list.filter(a => own.has(a.id)).length, total: list.length });
  }
  function toggleOwned(id, on) {
    const z = curZoo();
    const i = z.owned.indexOf(id);
    if (on && i < 0) z.owned.push(id);
    if (!on && i >= 0) z.owned.splice(i, 1);
    save();
  }

  function renderToolbar(cat, cs) {
    const f = cs.filter;
    const has = id => cat.filters.indexOf(id) >= 0;
    const card = h("section", { class: "card", "aria-label": t("filter.title") });
    const bar = h("div", { class: "toolbar" });
    if (has("search")) {
      bar.appendChild(h("label", { class: "search", title: t("filter.searchHint") }, [svg(SEARCH_SVG),
        h("input", { type: "search", placeholder: t("filter.search"), value: f.search || "", "aria-label": t("filter.search"),
          oninput: e => { f.search = e.target.value; onFilterChange(cat); } })]));
    }
    const panel = h("div", { class: "filter-panel", id: "filterPanel", hidden: !cs.open });
    const toggle = h("button", { type: "button", class: "btn", "aria-expanded": cs.open ? "true" : "false", "aria-controls": "filterPanel",
      onclick: () => { cs.open = !cs.open; panel.hidden = !cs.open; toggle.setAttribute("aria-expanded", cs.open ? "true" : "false"); save(); } },
      [svg(FILTER_SVG), t("filter.title"), h("span", { class: "pill", id: "filterBadge", hidden: true })]);
    bar.appendChild(toggle);
    bar.appendChild(h("button", { type: "button", class: "btn btn-quiet", id: "filterReset", hidden: true, text: "↺ " + t("filter.reset"),
      onclick: () => { cs.filter = ZL.emptyFilter(); save(); renderView(); } }));
    bar.appendChild(h("span", { class: "spacer" }));
    if (has("owned")) bar.appendChild(h("button", { type: "button", class: "btn zoo-toggle", "aria-pressed": S.state.zooMode ? "true" : "false",
      title: t("zoo.hint"), onclick: () => { S.state.zooMode = !S.state.zooMode; if (!S.state.zooMode) f.owned = "any"; save(); renderView(); } },
      [h("span", { class: "zoo-box", "aria-hidden": "true", text: "✓" }), t("zoo.mode")]));
    bar.appendChild(renderColumnMenu(cat, cs));
    card.appendChild(bar);
    if (S.state.zooMode && has("owned")) card.appendChild(renderZooBar(cat, cs));
    card.appendChild(renderPresets(cat, cs));

    /* nur Werte anbieten, die in dieser Übersicht vorkommen */
    const present = key => { const set = new Set(); animalsOf(cat.id).forEach(a => (a[key] || []).forEach(x => set.add(x))); return set; };
    const block = (title, content, hint, hintId) => h("div", { class: "f-block" }, [title ? h("h4", { text: title }) : null, content, hint ? h("p", { class: "f-hint", id: hintId || null, text: hint }) : null]);
    const chips = (key, items, label, titleFn, pre) => h("div", { class: "chips" }, items.map(id => {
      const b = h("button", { type: "button", class: "chip", "aria-pressed": f[key].indexOf(id) >= 0 ? "true" : "false", title: titleFn ? titleFn(id) : null },
        [pre ? pre(id) : null, label(id)]);
      b.addEventListener("click", () => {
        const i = f[key].indexOf(id);
        if (i >= 0) f[key].splice(i, 1); else f[key].push(id);
        b.setAttribute("aria-pressed", i >= 0 ? "false" : "true");
        onFilterChange(cat);
      });
      return b;
    }));
    /* Zahlenfeld; conv = Umrechnung Anzeige <-> gespeicherter Wert (für °F) */
    const numIn = (key, label, step, conv) => h("label", {}, [label, h("input", { type: "number", class: "num-in", step: step || "1", inputmode: "decimal",
      value: ZL.isNum(f[key]) ? String(conv ? ZL.round(conv.show(f[key]), 1) : f[key]) : "",
      oninput: e => { const n = parseFloat(String(e.target.value).replace(",", ".")); f[key] = isFinite(n) ? (conv ? conv.store(n) : n) : null; onFilterChange(cat); } })]);
    const select = (key, opts, label) => h("select", { class: "sel-in", "aria-label": label,
      onchange: e => { f[key] = e.target.value; onFilterChange(cat); } },
      opts.map(([val, txt]) => h("option", { value: val, text: txt, selected: f[key] === val })));
    const tconv = isF() ? { show: ZL.cToF, store: ZL.fToC } : null;

    if (has("status")) panel.appendChild(block(t("filter.status"),
      chips("status", S.meta.statuses.map(s => s.id).filter(id => animalsOf(cat.id).some(a => a.status === id)), id => t("status." + id), null, id => statusBadge(id))));
    if (has("biomes")) { const p = present("biomes"); panel.appendChild(block(t("filter.biomes"),
      chips("biomes", S.meta.biomes.filter(b => p.has(b)), id => t("biome." + id), null, id => biomeIcon(id)))); }
    if (has("continents")) { const p = present("continents"); panel.appendChild(block(t("filter.continents"),
      chips("continents", S.meta.continents.filter(c => p.has(c)), id => t("continent." + id)))); }
    if (has("roles")) { const p = present("roles"); if (p.size) panel.appendChild(block(t("filter.roles"),
      chips("roles", (S.meta.roles || []).filter(r => p.has(r)), id => t("role." + id)))); }
    if (has("temp")) panel.appendChild(block(t("filter.temp").replace("°C", tempUnit()), h("div", { class: "range-row" }, [
      numIn("tempFrom", t("filter.from"), "1", tconv), numIn("tempTo", t("filter.to"), "1", tconv),
      h("label", { class: "check", title: t("filter.exactHint") }, [
        h("input", { type: "checkbox", checked: !!f.tempExact, onchange: e => { f.tempExact = e.target.checked; onFilterChange(cat); } }),
        t("filter.exact")])]), t("filter.exact") + " = " + lcFirst(t("filter.exactHint")), "tempHint"));
    if (has("size") && cat.sizeKey) panel.appendChild(block(t("col." + cat.sizeKey) + " (m², 1 ×)", h("div", { class: "range-row" }, [reqIcon(cat.sizeKey), numIn("sizeMax", "≤", "10")])));
    if (has("climbProof")) panel.appendChild(block(t("col.climbProof"),
      select("climbProof", [["any", t("filter.any")], ["yes", t("val.yes")], ["no", t("val.no")]], t("col.climbProof"))));
    if (has("walk")) panel.appendChild(block(t("filter.walk"),
      select("walk", [["any", t("filter.any")], ["yes", t("val.yes")], ["no", t("val.no")]], t("filter.walk"))));
    if (has("gift") && animalsOf(cat.id).some(a => a.gift)) panel.appendChild(block("", h("label", { class: "check", title: t("gift.hint") }, [
      h("input", { type: "checkbox", checked: !!f.gift, onchange: e => { f.gift = e.target.checked; onFilterChange(cat); } }),
      giftImg(), t("filter.gift")])));
    card.appendChild(panel);
    setTimeout(() => updateFilterBadge(cat));
    return card;
  }

  /* Spalten ein-/ausblenden; Spalten ohne einen einzigen Wert in dieser Übersicht werden automatisch weggelassen */
  function hasValue(a, col) {
    const v = ZL.cellValue(a, col);
    if (v == null || v === "" || v === 0) return false;
    if (Array.isArray(v)) return v.length > 0 && v.some(x => x != null && x !== 0);
    if (typeof v === "object") return col.type === "rangeMinMax" ? ZL.isNum(v.min) : col.type === "moat" ? ZL.isNum(v.width) : true;
    return true;
  }
  function emptyCols(cat) {
    if (cat.__empty) return cat.__empty;
    const list = animalsOf(cat.id);
    return (cat.__empty = new Set(cat.columns.filter(c => !c.fixed && !list.some(a => hasValue(a, c))).map(c => c.id)));
  }
  function isColVisible(col, cs, cat) {
    if (col.fixed) return true;
    if (cat && emptyCols(cat).has(col.id)) return false;
    if (col.id in cs.cols) return !!cs.cols[col.id];
    return !col.hidden;
  }
  function colLabel(col) { return col.rawLabel ? col.label : t(col.label); }
  function colUnit(col) {
    if (!col.unit) return "";
    if (col.unit === "°C") return tempUnit();
    if (LITERAL_UNITS.indexOf(col.unit) >= 0) return col.unit;
    return "";
  }
  function renderColumnMenu(cat, cs) {
    const pop = h("div", { class: "menu-pop" });
    const empty = emptyCols(cat);
    const build = () => {
      pop.innerHTML = "";
      let lastGroup = null;
      cat.columns.forEach(col => {
        if (col.fixed || empty.has(col.id)) return;
        if (col.group !== lastGroup) { lastGroup = col.group; pop.appendChild(h("h5", { text: t(col.group) })); }
        pop.appendChild(h("label", { class: "check" }, [
          h("input", { type: "checkbox", checked: isColVisible(col, cs, cat), onchange: e => { cs.cols[col.id] = e.target.checked; save(); renderTable(cat); } }),
          col.icon ? reqIcon(col.icon) : null, colLabel(col)]));
      });
      pop.appendChild(h("button", { type: "button", class: "btn", style: "margin-top:10px", text: "↺ " + t("cols.defaults"),
        onclick: () => { cs.cols = {}; save(); build(); renderTable(cat); } }));
    };
    build();
    return h("details", { class: "menu" }, [h("summary", { class: "btn" }, [svg(COLS_SVG), t("cols.title")]), pop]);
  }

  /* ---------- Tabelle ---------- */
  function renderTable(cat) {
    const wrap = $("tableWrap");
    if (!wrap) return;
    const cs = catState(cat.id);
    const dl = enabledDlcs();
    const inDlc = animalsOf(cat.id).filter(a => dl.indexOf(a.dlc) >= 0);
    const zoo = S.state.zooMode && cat.filters.indexOf("owned") >= 0;
    const own = ownedSet();
    const fil = zoo ? cs.filter : Object.assign({}, cs.filter, { owned: "any" });
    const filtered = ZL.filterAnimals(inDlc, fil, null, nameOf, { sizeKey: cat.sizeKey, owned: own });
    const cols = cat.columns.filter(c => isColVisible(c, cs, cat));
    let sortCol = cat.columns.find(c => c.id === cs.sort.col && c.sortable && isColVisible(c, cs, cat));
    if (!sortCol) { sortCol = cat.columns.find(c => c.type === "name"); cs.sort = { col: sortCol.id, dir: "asc" }; }
    const rows = ZL.sortAnimals(filtered, sortCol, cs.sort.dir, sortCtx());

    $("countText").textContent = t("table.count", { shown: rows.length, total: inDlc.length });
    updateZooCount(cat);
    wrap.innerHTML = "";
    if (!rows.length) { wrap.appendChild(h("div", { class: "empty", text: t("table.empty") })); return; }

    const table = h("table", { class: "data" + (zoo ? " zoo-on" : "") });
    const thead = h("thead");
    const grpRow = h("tr", { class: "grp" });
    const colRow = h("tr", { class: "cols" });
    let i = 0;
    while (i < cols.length) {
      const g = cols[i].group; let span = 1;
      while (i + span < cols.length && cols[i + span].group === g) span++;
      const isName = cols[i].type === "name" && span === 1;
      grpRow.appendChild(h("th", { colspan: String(span), scope: "colgroup", class: isName ? "sticky left" : null,
        title: GROUP_HINTS[g] ? t(GROUP_HINTS[g]) : null, text: t(g) + (GROUP_HINTS[g] ? " ⓘ" : "") }));
      i += span;
    }
    cols.forEach(col => {
      const unit = colUnit(col);
      const active = sortCol.id === col.id;
      const th = h("th", { scope: "col", class: [col.sortable ? "sortable" : "", col.type === "name" ? "sticky left" : "", col.icon ? "has-ic" : ""].join(" ").trim() || null,
        title: col.sortable ? colLabel(col) + " – " + t("sort.hint") : colLabel(col), tabindex: col.sortable ? "0" : null,
        "aria-sort": active ? (cs.sort.dir === "asc" ? "ascending" : "descending") : null }, [
        col.icon ? reqIcon(col.icon) : null,
        h("span", { class: "th-l" }, [colLabel(col), unit ? h("span", { class: "u", text: " (" + unit + ")" }) : null]),
        col.sortable ? h("span", { class: "sort-arrow", "aria-hidden": "true", text: active ? (cs.sort.dir === "asc" ? "▲" : "▼") : "" }) : null
      ]);
      if (col.sortable) {
        const go = () => {
          if (cs.sort.col === col.id) cs.sort.dir = cs.sort.dir === "asc" ? "desc" : "asc";
          else cs.sort = { col: col.id, dir: "asc" };
          save(); renderTable(cat);
        };
        th.addEventListener("click", go);
        th.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      }
      colRow.appendChild(th);
    });
    thead.appendChild(grpRow); thead.appendChild(colRow);
    table.appendChild(thead);

    const tbody = h("tbody");
    const frag = document.createDocumentFragment();
    rows.forEach(a => {
      const tr = h("tr", { class: zoo && own.has(a.id) ? "owned" : null, onclick: () => openDetail(cat, a) });
      cols.forEach(col => tr.appendChild(renderCell(a, col, zoo ? { own, tr, cat } : null)));
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
    table.appendChild(tbody);
    wrap.appendChild(table);
    requestAnimationFrame(() => { const gh = grpRow.getBoundingClientRect().height; if (gh) table.style.setProperty("--grp-h", gh + "px"); });
  }

  function rangeText(v) {
    if (!Array.isArray(v)) return ZL.isNum(v) ? fmt(v) : null;
    if (!ZL.isNum(v[0])) return null;
    return v[0] === v[1] || !ZL.isNum(v[1]) ? fmt(v[0]) : fmt(v[0]) + "–" + fmt(v[1]);
  }
  /* Zeitangabe [Zahl, Einheit] -> "3 Jahre" in der gewählten Sprache */
  function fmtTime(v) {
    if (!Array.isArray(v) || !ZL.isNum(v[0])) return null;
    const one = v[0] === 1;
    const k = "time." + v[1] + (one ? ".one" : "");
    const s = t(k);
    return (s === k ? t("time." + v[1]) : s).replace("{n}", fmt(v[0]));
  }

  function renderCell(a, col, zoo) {
    const v = ZL.cellValue(a, col);
    const td = h("td");
    const dash = () => { td.appendChild(h("span", { class: "zero", text: "–" })); return td; };
    switch (col.type) {
      case "name": {
        td.className = "name sticky";
        if (zoo) {
          const cb = h("input", { type: "checkbox", class: "own-cb", checked: zoo.own.has(a.id), title: t("zoo.check"), "aria-label": t("zoo.check") + ": " + nameOf(a),
            onclick: e => e.stopPropagation(),
            onchange: e => { toggleOwned(a.id, e.target.checked); zoo.tr.classList.toggle("owned", e.target.checked); updateZooCount(zoo.cat);
              const f = catState(zoo.cat.id).filter; if (f.owned && f.owned !== "any") setTimeout(() => renderTable(zoo.cat), 250); } });
          td.appendChild(h("label", { class: "own-lbl", onclick: e => e.stopPropagation() }, cb));
        }
        const box = h("span", { class: "nm-box" }, [h("span", { class: "nm", text: nameOf(a) })]);
        if (nameOf(a) !== a.name) td.title = t("detail.germanName") + ": " + a.name;
        if (a.gift) box.firstChild.appendChild(giftImg(a.giftYear ? " (" + a.giftYear + ")" : ""));
        if (a.sci) box.appendChild(h("span", { class: "sci", text: a.sci }));
        td.appendChild(box);
        return td;
      }
      case "status":
        if (!v) return dash();
        td.appendChild(statusBadge(v));
        return td;
      case "dlc":
        td.appendChild(h("span", { class: "dlc-tag " + v, text: dlcName(v) }));
        return td;
      case "continents":
        if (!v || !v.length) return dash();
        td.appendChild(tagList("continents", v));
        return td;
      case "biomes":
        if (!v || !v.length) return dash();
        td.appendChild(h("span", { class: "bi-list" }, v.map(b => biomeIcon(b))));
        return td;
      case "roles":
        if (!v || !v.length) return dash();
        td.appendChild(h("span", { class: "mini" }, v.map(r => h("span", { class: "tag c", text: t("role." + r) }))));
        return td;
      case "area":
        if (!ZL.isNum(v) || v === 0) return dash(); // 0 als Strich – wirkt ruhiger
        td.textContent = fmt(v);
        return td;
      case "temp":
        if (!ZL.isNum(v[0])) return dash();
        td.textContent = fmtT(v[0]) + " – " + fmtT(v[1]);
        return td;
      case "bool":
        if (v == null) return dash();
        td.appendChild(h("span", { class: v ? null : "zero", text: t(v ? "val.yes" : "val.no") }));
        return td;
      case "walk":
        if (v == null) return dash();
        td.className = "c";
        td.appendChild(walkIcon(v));
        return td;
      case "moat":
        if (!v || !ZL.isNum(v.width)) return dash();
        td.textContent = fmtM(v.width) + " × " + fmtM(v.depth);
        td.title = t("plan.moatSize", { w: fmtM(v.width).replace(/ m$/, ""), d: fmtM(v.depth).replace(/ m$/, "") });
        return td;
      case "ratio":
        if (!ZL.isNum(v[0]) && !ZL.isNum(v[1])) return dash();
        td.textContent = fmt(v[0]) + " ♂ / " + fmt(v[1]) + " ♀";
        return td;
      case "rangeMinMax":
        if (!v || !ZL.isNum(v.min)) return dash();
        td.textContent = v.min === v.max ? fmt(v.min) : fmt(v.min) + "–" + fmt(v.max);
        return td;
      case "meter":
        if (!ZL.isNum(v) || v === 0) return dash();
        td.textContent = fmtM(v).replace(/ m$/, "");
        return td;
      case "time": {
        const tx = fmtTime(v);
        if (!tx) return dash();
        td.textContent = tx;
        return td;
      }
      default: {
        if (v == null || v === 0 || (Array.isArray(v) && !ZL.isNum(v[0]))) return dash();
        td.textContent = rangeText(v) || String(v);
        return td;
      }
    }
  }
  function tagList(type, list) {
    if (type === "biomes") return h("span", { class: "mini" }, list.map(x => biomeIcon(x, true)));
    return h("span", { class: "mini" }, list.map(x => h("span", { class: "tag c", text: t("continent." + x) })));
  }

  /* ---------- Dialog-Helfer ---------- */
  let dlgOnClose = null;
  function openDialog({ title, sub, tax, body, foot, wide, onClose }) {
    const d = $("dlg");
    if (d.open) { dlgOnClose = null; d.close(); }
    $("dlgTitle").innerHTML = "";
    [].concat(title).forEach(n => $("dlgTitle").append(n));
    $("dlgSub").textContent = sub || ""; $("dlgSub").hidden = !sub;
    $("dlgTax").innerHTML = ""; if (tax) $("dlgTax").appendChild(tax); $("dlgTax").hidden = !tax;
    $("dlgBody").innerHTML = ""; [].concat(body || []).forEach(n => n && $("dlgBody").appendChild(n));
    $("dlgFoot").innerHTML = ""; [].concat(foot || []).forEach(n => n && $("dlgFoot").appendChild(n));
    d.classList.toggle("wide", !!wide);
    dlgOnClose = onClose || null;
    d.showModal();
    $("dlgBody").scrollTop = 0;
  }
  const closeBtn = (key) => h("button", { type: "button", class: "btn btn-primary", text: t(key || "settings.close"), onclick: () => $("dlg").close() });

  /* ---------- Meine Spielinhalte (DLCs) ---------- */
  function openDlcDialog() {
    const counts = {};
    const seenIds = new Set(); // Arten, die in mehreren Bereichen stehen (z. B. Aquarium + Vivarium), nur einmal zählen
    S.meta.categories.forEach(c => animalsOf(c.id).forEach(a => { if (seenIds.has(a.id)) return; seenIds.add(a.id); counts[a.dlc] = (counts[a.dlc] || 0) + 1; }));
    const warn = h("div", { class: "warn-box", text: t("dlc.noneWarn") });
    const boxes = [];
    const refresh = () => { warn.hidden = !!enabledDlcs().length; };
    const list = h("div", { class: "opt-list" }, S.meta.dlcs.map(d => {
      const cb = h("input", { type: "checkbox", checked: !!S.state.dlcs[d.id], onchange: e => { S.state.dlcs[d.id] = e.target.checked; save(); refresh(); } });
      boxes.push([d.id, cb]);
      const opt = h("label", { class: "opt" }, [cb, dlcName(d), h("small", { text: t("dlc.animals", { n: counts[d.id] || 0 }) })]);
      if (!d.url) return opt;
      /* Steam-Shopseite des Inhalts – eigener Link neben der Zeile, damit ein Klick nicht das Häkchen umschaltet */
      return h("div", { class: "opt-row" }, [opt, h("a", { class: "steam-link", href: d.url, target: "_blank", rel: "noopener",
        title: t("dlc.steam") + ": " + dlcName(d), "aria-label": t("dlc.steam") + ": " + dlcName(d) }, [svg(STEAM_SVG), "Steam"])]);
    }));
    refresh();
    const allBtn = h("button", { type: "button", class: "btn", text: t("dlc.all"),
      onclick: () => { boxes.forEach(([id, cb]) => { cb.checked = true; S.state.dlcs[id] = true; }); save(); refresh(); } });
    openDialog({
      title: t("dlc.title"),
      body: [h("p", { class: "hint", style: "margin:0", text: t("dlc.intro") }), list, warn],
      foot: [allBtn, closeBtn("dlc.done")],
      onClose: () => { renderDlcButton(); renderTabs(); renderView(); }
    });
  }

  /* ---------- Einstellungen ---------- */
  function seg(options, current, onPick) {
    const wrap = h("div", { class: "seg", role: "group" });
    options.forEach(([val, label]) => {
      const b = h("button", { type: "button", "aria-pressed": current === val ? "true" : "false", text: label,
        onclick: () => { wrap.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); onPick(val); } });
      wrap.appendChild(b);
    });
    return wrap;
  }
  function openSettings() {
    const sec = (title, content) => h("section", {}, [h("h3", { text: title }), content]);
    let armed = false;
    const reset = h("button", { type: "button", class: "btn danger", text: t("settings.reset"),
      onclick: () => {
        if (!armed) { armed = true; reset.textContent = t("settings.resetConfirm"); return; }
        const lang = S.state.lang;
        S.state = defaultState(); S.state.lang = lang;
        try { localStorage.removeItem(STORE_KEY); } catch (e) { /* egal */ }
        save(); applyTheme();
        $("dlg").close();
      } });
    openDialog({
      title: t("nav.settings"),
      body: [
        sec(t("settings.theme"), seg([["light", "☀️ " + t("theme.light")], ["dark", "🌙 " + t("theme.dark")], ["system", "💻 " + t("theme.system")]], S.state.theme,
          v => { S.state.theme = v; save(); applyTheme(); })),
        sec(t("settings.temp"), seg([["c", t("temp.c")], ["f", t("temp.f")]], S.state.tempUnit, v => { S.state.tempUnit = v; save(); })),
        sec(t("settings.calc"), seg([["sum", t("settings.calcSum")], ["max", t("settings.calcMax")]], S.state.calcMode, v => { S.state.calcMode = v; save(); })),
        h("p", { class: "hint", style: "margin:0", text: t("settings.local") })
      ],
      foot: [reset, closeBtn()],
      onClose: () => { renderAll(); }
    });
  }

  /* ---------- Detailansicht je Tier ---------- */
  function openDetail(cat, a) {
    const sec = (title, kids, icon) => {
      const list = [].concat(kids).filter(Boolean);
      if (!list.length || list.every(k => k.tagName === "DL" && !k.children.length)) return null;
      return h("section", { class: "d-sec" }, [h("h3", {}, [icon ? reqIcon(icon) : null, title])].concat(list));
    };
    /* Zeilen: [Icon, Bezeichnung, Wert] – leere Werte fallen weg */
    const dl = rows => h("dl", { class: "d-dl" }, rows.filter(p => p && p[2] != null && p[2] !== "").reduce((acc, [ic, k, v]) =>
      acc.concat([h("dt", {}, [ic ? reqIcon(ic) : null, k]), typeof v === "string" ? h("dd", { text: v }) : h("dd", {}, v)]), []));
    const body = [];

    const badges = h("div", { class: "badges" }, [
      a.status ? statusBadge(a.status, true) : null,
      h("span", { class: "dlc-tag " + a.dlc, text: dlcName(a.dlc) }),
      a.gift ? h("span", { class: "tag gift-tag" }, [giftImg(), t("gift.hint") + (a.giftYear ? " (" + a.giftYear + ")" : "")]) : null
    ]);
    const types = h("div", { class: "badges" }, (a.types || []).map(ty => {
      const c = S.meta.categories.find(x => x.type === ty);
      return c ? h("button", { type: "button", class: "chip type-chip", text: t(c.tab), onclick: () => { $("dlg").close(); goTab(c.id); } }) : null;
    }));
    /* Tierbild: assets/tiere/<id>.webp, sonst Platzhalter */
    const ph = () => h("div", { class: "d-img-ph" }, [svg(PAW_SVG), h("span", { text: t("detail.imgSoon") })]);
    let fig;
    if (a.image) {
      const img = h("img", { src: asset("assets/tiere/" + a.image + ".webp"), alt: nameOf(a), loading: "lazy" });
      img.addEventListener("error", () => { fig.innerHTML = ""; fig.appendChild(ph()); });
      fig = h("figure", { class: "d-img" }, img);
    } else fig = h("figure", { class: "d-img" }, ph());
    const info = [badges, h("div", { class: "d-mini-h", text: t("detail.types") }), types,
      h("div", { class: "d-mini-h", text: t("col.biomes") }), tagList("biomes", a.biomes || []),
      h("div", { class: "d-mini-h", text: t("col.continents") }), tagList("continents", a.continents || [])];
    if (a.roles && a.roles.length) info.push(h("div", { class: "d-mini-h", text: t("detail.roles") }),
      h("div", { class: "mini" }, a.roles.map(r => h("span", { class: "tag c", text: t("role." + r) }))));
    body.push(h("div", { class: "d-hero" }, [fig, h("div", { class: "d-hero-info" }, info)]));

    const grid = h("div", { class: "detail-grid" });
    /* Flächen wie im Spiel: 1 Tier, 2 Tiere, je weiterem Tier, bei kleinster/größter Gruppe */
    if (a.area1) {
      const c = ZL.calc(a);
      const s = a.social || {};
      const keys = ZL.AREA_KEYS.filter(k => [a.area1, a.area2 || {}].some(o => ZL.isNum(o[k]) && o[k] !== 0));
      if (keys.length) {
        const cell = (obj, k) => h("td", { class: ZL.isNum(obj[k]) && obj[k] !== 0 ? null : "zero", text: ZL.isNum(obj[k]) && obj[k] !== 0 ? fmt(obj[k]) : "–" });
        const row = (label, obj) => h("tr", {}, [h("td", { text: label })].concat(keys.map(k => cell(obj, k))));
        grid.appendChild(h("section", { class: "d-sec", style: "grid-column:1/-1" }, [h("h3", { text: t("grp.req").replace(/\s*\(.*\)$/, "") + " (m²)" }),
          h("div", { class: "area-scroll" }, h("table", { class: "area-table" }, [
            h("thead", {}, h("tr", {}, [h("th", {})].concat(keys.map(k => h("th", {}, [reqIcon(k), h("span", { text: t("col." + k) })]))))),
            h("tbody", {}, [
              row(t("detail.oneAnimal"), a.area1),
              a.area2 ? row(t("detail.twoAnimals"), a.area2) : null,
              row("+ " + t("detail.perAdd"), c.inc),
              ZL.isNum(s.min) && s.min > 2 ? row(t("grp.atMin") + " (" + s.min + ")", c.atMin) : null,
              ZL.isNum(s.max) && s.max > 2 ? row(t("grp.atMax") + " (" + s.max + ")", c.atMax) : null
            ])]))]));
      }
    }
    const climate = [["temp", t("col.temp"), ZL.isNum(a.tempMin) ? fmtT(a.tempMin) + " – " + fmtT(a.tempMax) + " " + tempUnit() : null]];
    if (a.humidity) climate.push(["humidity", t("col.humidity"), rangeText(a.humidity) + " %"]);
    if (ZL.isNum(a.salinity)) climate.push(["salinity", t("col.salinity"), fmt(a.salinity)]);
    grid.appendChild(sec(t("grp.climate"), dl(climate)));
    const fz = a.fence || {};
    if (ZL.isNum(fz.strength) || ZL.isNum(fz.height) || fz.climbProof || fz.moat) {
      grid.appendChild(sec(t("grp.fence"), dl([
        ["strength", t("col.fenceStr"), ZL.isNum(fz.strength) ? fmt(fz.strength) : null],
        ["height", t("col.fenceH"), ZL.isNum(fz.height) ? fmtM(fz.height) : null],
        ["fence", t("col.climbProof"), fz.climbProof == null ? null : t(fz.climbProof ? "val.yes" : "val.no")],
        [null, t("col.moat").replace(/\s*\(.*\)\s*$/, "") + ":", fz.moat && ZL.isNum(fz.moat.width)
          ? [h("div", { title: t("col.moat"), text: "↔ " + fmtM(fz.moat.width) }), h("div", { text: "↕ " + fmtM(fz.moat.depth) })] : null]
      ])));
    }
    const s = a.social || {};
    const social = [[null, t("col.group"), ZL.isNum(s.min) ? (s.min === s.max ? fmt(s.min) : fmt(s.min) + "–" + fmt(s.max)) : null]];
    if (ZL.isNum(s.maxMales)) social.push([null, t("col.ratio"), fmt(s.maxMales) + " ♂ / " + fmt(s.maxFemales) + " ♀"]);
    if (s.maleOnly) social.push([null, t("col.maleOnly"), rangeText(s.maleOnly)]);
    if (s.femaleOnly) social.push([null, t("col.femaleOnly"), rangeText(s.femaleOnly)]);
    if (a.walkthrough != null) social.push([null, t("col.walk"), h("span", { class: "walk-dd" }, [walkIcon(a.walkthrough), t(a.walkthrough ? "val.yes" : "val.no")])]);
    grid.appendChild(sec(t("grp.social"), dl(social)));
    const lc = a.lifecycle || {};
    grid.appendChild(sec(t("grp.cycle"), dl([
      [null, t("col.maturity"), fmtTime(lc.maturity)], [null, t("col.sterility"), fmtTime(lc.sterility)],
      [null, t("col.litter"), rangeText(lc.litter)], [null, t("col.gestation"), fmtTime(lc.gestation)],
      [null, t("col.interval"), fmtTime(lc.interval)]
    ])));
    body.push(grid);

    /* Zusammenleben: Namen anklickbar, öffnen das Profil der anderen Art */
    const rel = ZL.relationsOf(a.id, S.compat);
    const chipList = (ids, cls) => h("div", { class: "chips" }, ids.slice().sort((x, y) => ZL.compareNames(animalById(x) || { name: x }, animalById(y) || { name: y }, sortCtx())).map(id => {
      const o = animalById(id);
      if (!o) return h("span", { class: "chip rel-chip " + cls, text: id });
      const oc = S.meta.categories.find(c => (o.types || []).indexOf(c.type) >= 0) || cat;
      return h("button", { type: "button", class: "chip rel-chip " + cls, text: nameOf(o), onclick: () => openDetail(oc, o) });
    }));
    const relRow = (label, ids, cls) => ids.length ? h("div", { class: "rel-row" }, [h("div", { class: "rel-lbl", text: label }), chipList(ids, cls)]) : null;
    const anyRel = rel.benefitsFrom.length || rel.benefitsOthers.length || rel.neutral.length;
    body.push(h("section", { class: "d-sec" }, [h("h3", { text: t("plan.compat") }),
      anyRel ? null : h("p", { class: "note-muted", style: "margin:0", text: t("compat.none") }),
      relRow(t("compat.benefitsFrom"), rel.benefitsFrom, "rel-ok"),
      relRow(t("compat.benefitsOthers"), rel.benefitsOthers, "rel-ok"),
      relRow(t("compat.neutral"), rel.neutral, "rel-neutral")]));

    const foot = [];
    const add = h("button", { type: "button", class: "btn", text: "＋ " + t("detail.addToPlan"),
      onclick: () => { addToPlanner(a); add.textContent = t("detail.added"); add.disabled = true; } });
    foot.push(add);
    if (S.state.zooMode) {
      const own = ownedSet().has(a.id);
      foot.push(h("label", { class: "check own-foot" }, [h("input", { type: "checkbox", checked: own,
        onchange: e => { toggleOwned(a.id, e.target.checked); } }), t("zoo.check") + " (" + zooName(curZoo()) + ")"]));
    }
    foot.push(closeBtn());
    const title = [nameOf(a)];
    if (a.gift) title.push(giftImg(a.giftYear ? " (" + a.giftYear + ")" : ""));
    /* Systematik: Klasse, Ordnung, Familie, Gattung (Kategorie fett+kursiv, Wert kursiv) */
    const tx = a.taxonomy || {};
    const taxItems = ["class", "order", "family", "genus"].filter(k => tx[k]).map(k =>
      h("span", { class: "tax-item" }, [h("b", { text: t("tax." + k) + ":" }), " ", h("i", { text: tx[k] })]));
    if (a.sci) taxItems.unshift(h("span", { class: "tax-item tax-sci" }, [h("b", { text: t("detail.sciName") + ":" }), " ", h("i", { text: a.sci })]));
    const tax = taxItems.length ? h("div", { class: "tax" }, taxItems) : null;
    openDialog({ title, tax, sub: nameOf(a) !== a.name ? t("detail.germanName") + ": " + a.name : null, body, foot, wide: true,
      onClose: S.state.zooMode && S.state.tab !== PLANNER ? () => renderView() : null });
  }

  /* ---------- Gehege-Planer ---------- */
  let planUid = 0;
  function startGroup(a) {
    const s = a.social || {};
    const min = ZL.isNum(s.min) ? s.min : 1;
    const m = ZL.isNum(s.maxMales) ? Math.min(1, s.maxMales) : (min > 1 ? 1 : 0);
    return { m, f: Math.max(0, min - m) || (m ? 0 : 1) };
  }
  function addToPlanner(a) {
    const g = startGroup(a);
    S.state.planner.push({ uid: ++planUid, id: a.id, m: g.m, f: g.f });
    save();
  }

  function renderPlanner(v) {
    const all = S.all;
    const byId = S.byId;
    if (!all.length) { v.appendChild(h("div", { class: "card empty", text: t("table.noData") })); return; }

    S.state.planner = S.state.planner.filter(e => byId[e.id]);
    S.state.planner.forEach(e => { if (!e.uid) e.uid = ++planUid; });

    const grid = h("div", { class: "planner-grid" });
    const left = h("section", { class: "card planner-card" }, [h("h2", { text: t("tab.planner") }), h("p", { class: "hint", text: t("plan.intro") })]);
    const rowsBox = h("div");
    const right = h("section", { class: "card planner-card", "aria-live": "polite" });
    left.appendChild(rowsBox);

    const dl = enabledDlcs();
    const options = ZL.sortAnimals(all.filter(a => dl.indexOf(a.dlc) >= 0), null, null, sortCtx());

    const rowRefs = [];
    function makeRow(entry) {
      const a = byId[entry.id];
      const sel = h("select", { class: "sel-in", "aria-label": t("plan.pick"),
        onchange: e => { entry.id = e.target.value; save(); renderView(); } });
      const opts = options.slice();
      if (opts.indexOf(a) < 0) opts.unshift(a); // Art aus deaktiviertem Inhalt bleibt sichtbar
      opts.forEach(o => sel.appendChild(h("option", { value: o.id, text: nameOf(o), selected: o.id === entry.id })));
      const num = (key, label) => h("label", {}, [label, h("input", { type: "number", class: "num-in", min: "0", step: "1", inputmode: "numeric", value: String(entry[key] || 0),
        oninput: e => { const n = parseInt(e.target.value, 10); entry[key] = isFinite(n) && n > 0 ? n : 0; save(); update(); } })]);
      const total = h("div", { class: "p-total" });
      const notes = h("div", { class: "p-notes" });
      const needs = h("div", { class: "p-needs" });
      const row = h("div", { class: "p-row" }, [
        h("label", { class: "sp" }, [t("col.name"), sel]),
        num("m", t("plan.males") + " ♂"), num("f", t("plan.females") + " ♀"),
        h("label", {}, [t("plan.total"), total]),
        h("button", { type: "button", class: "icon-btn", title: t("plan.remove"), "aria-label": t("plan.remove"), text: "×",
          onclick: () => { S.state.planner.splice(S.state.planner.indexOf(entry), 1); save(); renderView(); } }),
        notes, needs
      ]);
      rowRefs.push({ entry, total, notes, needs });
      return row;
    }

    if (!S.state.planner.length) rowsBox.appendChild(h("p", { class: "empty", style: "padding:20px 0", text: t("plan.goTable") }));
    S.state.planner.forEach(e => rowsBox.appendChild(makeRow(e)));

    const addSel = h("select", { class: "sel-in", "aria-label": t("plan.pick") },
      [h("option", { value: "", text: t("plan.pick") })].concat(options.map(o => h("option", { value: o.id, text: nameOf(o) }))));
    const addBtn = h("button", { type: "button", class: "btn btn-primary", text: "＋ " + t("plan.add"),
      onclick: () => {
        const id = addSel.value;
        if (!id) { addSel.focus(); return; }
        addToPlanner(byId[id]); renderView();
      } });
    left.appendChild(h("div", { class: "row-actions" }, [addSel, addBtn,
      S.state.planner.length ? h("button", { type: "button", class: "btn btn-quiet danger", text: t("plan.clear"), onclick: () => { S.state.planner = []; save(); renderView(); } }) : null]));

    grid.appendChild(left); grid.appendChild(right);
    v.appendChild(grid);

    function update() {
      const res = ZL.plan(S.state.planner.map(e => ({ animal: byId[e.id], males: e.m, females: e.f })), S.state.calcMode, S.compat);
      rowRefs.forEach((ref, i) => {
        const r = res.rows[i];
        ref.total.textContent = String(r.total);
        ref.notes.innerHTML = ""; ref.needs.innerHTML = "";
        const g = r.group;
        if (dl.indexOf(r.animal.dlc) < 0) ref.notes.appendChild(h("div", { class: "note-muted", text: "ⓘ " + t("plan.dlcOff") + " (" + dlcName(r.animal.dlc) + ")" }));
        if (g.scope) ref.notes.appendChild(h("div", { class: "note-muted", text: t(g.scope === "male" ? "plan.scopeMale" : g.scope === "female" ? "plan.scopeFemale" : "plan.scopeMixed") }));
        const hasSocial = r.animal.social && (ZL.isNum(r.animal.social.min) || ZL.isNum(r.animal.social.max));
        if (!hasSocial) ref.notes.appendChild(h("div", { class: "note-muted", text: "ⓘ " + t("plan.noSocial") }));
        else if (g.ok) ref.notes.appendChild(h("div", { class: "note-ok", text: "✓ " + t("plan.fits") }));
        g.issues.forEach(is => ref.notes.appendChild(h("div", { class: is.level === "bad" ? "note-bad" : "note-warn", text: "⚠ " + t(is.key, is.params) })));
        if (r.total > 0) ZL.AREA_KEYS.forEach(k => {
          if (!ZL.isNum(r.needs[k]) || r.needs[k] === 0) return;
          ref.needs.appendChild(h("span", { class: "stat" }, [reqIcon(k), t("col." + k), h("b", { text: fmt(r.needs[k]) }), "m²"]));
        });
      });

      right.innerHTML = "";
      right.appendChild(h("h2", { text: t("plan.result") }));
      right.appendChild(h("p", { class: "hint", text: t(res.mode === "max" ? "plan.modeMax" : "plan.modeSum") }));
      if (!res.rows.length) { right.appendChild(h("p", { class: "empty", style: "padding:10px 0", text: t("plan.empty") })); return; }
      const usedKeys = ZL.AREA_KEYS.filter(k => ZL.isNum(res.totals[k]) && res.totals[k] !== 0);
      right.appendChild(h("div", { class: "result-list" }, (usedKeys.length ? usedKeys : ["land"]).map(k => h("div", { class: "res-tile" }, [
        h("span", { class: "k" }, [reqIcon(k), t("col." + k)]),
        h("span", { class: "v" }, [ZL.isNum(res.totals[k]) ? fmt(res.totals[k]) : "–", h("small", { text: "m²" })])
      ]))));

      if (res.fence) {
        right.appendChild(h("div", { class: "res-sec", text: t("grp.fence") }));
        const parts = [];
        if (ZL.isNum(res.fence.strength)) parts.push(t("col.fenceStr") + " ≥ " + fmt(res.fence.strength));
        if (ZL.isNum(res.fence.height)) parts.push(t("col.fenceH") + " ≥ " + fmtM(res.fence.height));
        if (res.fence.climbProof) parts.push(t("col.climbProof"));
        const box = h("div", { class: "fence-line" }, [parts.join(" · ") || "–"]);
        if (res.fence.moat) box.appendChild(h("div", { class: "note-muted", style: "margin-top:4px" },
          [t("plan.or") + " " + t("col.moat").replace(/\s*\(.*\)\s*$/, "") + ": " + t("plan.moatSize", { w: fmtM(res.fence.moat.width).replace(/ m$/, ""), d: fmtM(res.fence.moat.depth).replace(/ m$/, "") })]));
        right.appendChild(box);
      }

      right.appendChild(h("div", { class: "res-sec", text: t("plan.temp") }));
      if (res.temp === false) right.appendChild(h("div", { class: "fence-line note-bad", text: "⚠ " + t("plan.noTemp") }));
      else if (res.temp) right.appendChild(h("div", { class: "fence-line", text: fmtT(res.temp[0]) + " – " + fmtT(res.temp[1]) + " " + tempUnit() }));
      else right.appendChild(h("div", { class: "fence-line note-muted", text: "–" }));

      right.appendChild(h("div", { class: "res-sec", text: t("plan.biomes") }));
      if (res.biomes.length) right.appendChild(tagList("biomes", res.biomes));
      else right.appendChild(h("div", { class: "fence-line note-bad", text: "⚠ " + t("plan.noBiome") }));

      right.appendChild(h("div", { class: "res-sec", text: t("plan.compat") }));
      if (!res.pairs.length) right.appendChild(h("div", { class: "fence-line note-muted", text: "–" }));
      else {
        const nm = id => (byId[id] ? nameOf(byId[id]) : id);
        right.appendChild(h("div", { class: "result-list" }, res.pairs.map(p => {
          let cls, txt;
          if (p.aFromB && p.bFromA) { cls = "note-ok"; txt = "✓ " + t("plan.mutual", { a: nm(p.a), b: nm(p.b) }); }
          else if (p.aFromB) { cls = "note-ok"; txt = "✓ " + t("plan.benefit", { a: nm(p.a), b: nm(p.b) }); }
          else if (p.bFromA) { cls = "note-ok"; txt = "✓ " + t("plan.benefit", { a: nm(p.b), b: nm(p.a) }); }
          else if (p.neutral) { cls = "note-muted"; txt = "○ " + t("plan.neutral", { a: nm(p.a), b: nm(p.b) }); }
          else { cls = "note-bad"; txt = "⚠ " + t("plan.conflict", { a: nm(p.a), b: nm(p.b) }); }
          return h("div", { class: "fence-line " + cls }, [txt, p.notes && p.notes.length ? h("div", { class: "note-muted", text: p.notes.join(" · ") }) : null]);
        })));
      }
    }
    update();
  }

  // offene Spaltenmenüs bei Klick daneben schließen
  document.addEventListener("click", e => {
    document.querySelectorAll("details.menu[open]").forEach(d => { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener("DOMContentLoaded", init);
})();
