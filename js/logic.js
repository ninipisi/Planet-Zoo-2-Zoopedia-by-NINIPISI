/* ===== Zoopedia PZ2 – reine Logik =====
   Keine DOM-Zugriffe. Läuft im Browser (window.ZL) und in Node (require) für Tests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ZL = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const AREA_KEYS = ["shelter", "water", "deep", "climb", "land", "flight"];
  const STATUS_ORDER = ["ew", "cr", "en", "vu", "nt", "lc", "dom", "dd", "ne"];
  const DAYS = { years: 365, months: 30.4, weeks: 7, days: 1 };
  /* Zeitangabe [Zahl, Einheit] -> Tage (zum Sortieren) */
  function toDays(v) { return Array.isArray(v) && isNum(v[0]) && DAYS[v[1]] ? v[0] * DAYS[v[1]] : null; }

  /* ---------- Hilfen ---------- */
  function get(obj, path) {
    if (!path) return undefined;
    return String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function round(v, d) { const f = Math.pow(10, d == null ? 2 : d); return Math.round(v * f) / f; }

  /* Text normalisieren für die Suche: Groß/klein, Umlaute, Akzente egal */
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* ---------- Berechner (Excel-Logik) ----------
     Mehrbedarf je weiterem Tier = Wert für 2 Tiere − Wert für 1 Tier
     Bedarf für n Tiere = Basis + (n − 1) × Mehrbedarf */
  function increment(animal, key) {
    const a1 = get(animal, "area1." + key), a2 = get(animal, "area2." + key);
    if (!isNum(a1) || !isNum(a2)) return null;
    return a2 - a1;
  }
  function need(animal, n, key) {
    const base = get(animal, "area1." + key);
    if (!isNum(base)) return null;
    const inc = increment(animal, key);
    const cnt = Math.max(1, Math.round(n || 1));
    return round(base + (cnt - 1) * (inc || 0), 2);
  }
  function calc(animal) {
    const res = { inc: {}, atMin: {}, atMax: {} };
    const min = get(animal, "social.min"), max = get(animal, "social.max");
    AREA_KEYS.forEach(k => {
      res.inc[k] = increment(animal, k);
      res.atMin[k] = isNum(min) ? need(animal, min, k) : null;
      res.atMax[k] = isNum(max) ? need(animal, max, k) : null;
    });
    return res;
  }

  /* Wert einer Spalte (für Anzeige-unabhängige Sortierung) */
  function cellValue(animal, col) {
    if (col.calc) {
      const c = animal.__calc || (animal.__calc = calc(animal));
      return get(c, col.calc);
    }
    switch (col.type) {
      case "name": return animal.name; // Anzeige-Name kommt über ctx.nameOf
      case "status": return animal.status;
      case "dlc": return animal.dlc;
      case "temp": return [animal.tempMin, animal.tempMax];
      case "continents": return animal.continents;
      case "biomes": return animal.biomes;
      case "ratio": return [get(animal, "social.maxMales"), get(animal, "social.maxFemales")];
      default: return get(animal, col.path);
    }
  }

  /* Zahl zum Sortieren; null = kein Wert (kommt immer ans Ende) */
  function sortKey(animal, col, ctx) {
    const v = cellValue(animal, col);
    switch (col.type) {
      case "name": return String(nameFn(ctx)(animal));
      case "status": { const i = STATUS_ORDER.indexOf(v); return i < 0 ? null : i; }
      case "dlc": { const ids = (ctx && ctx.dlcOrder) || []; const i = ids.indexOf(v); return i < 0 ? null : i; }
      case "walk":
      case "bool": return v == null ? null : (v ? 1 : 0);
      case "time": return toDays(v);
      case "roles": return v && v.length ? v.length : null;
      case "temp": return isNum(v[0]) ? v[0] + (isNum(v[1]) ? v[1] / 1000 : 0) : null;
      case "moat": return v && isNum(v.width) ? v.width + (isNum(v.depth) ? v.depth / 1000 : 0) : null;
      case "rangeMinMax": return v && isNum(v.min) ? v.min + (isNum(v.max) ? v.max / 10000 : 0) : null;
      case "area": return isNum(v) && v !== 0 ? v : null;
      default:
        if (isNum(v)) return v;
        if (Array.isArray(v) && isNum(v[0])) return v[0] + (isNum(v[1]) ? v[1] / 10000 : 0);
        return null;
    }
  }

  /* Namen: ctx.nameOf liefert den Namen in der gewählten Sprache (sonst Deutsch), ctx.locale die Sortierregeln */
  const collators = {};
  function collator(locale) {
    const l = locale || "de";
    if (!collators[l]) { try { collators[l] = new Intl.Collator(l, { sensitivity: "base", numeric: true }); } catch (e) { collators[l] = new Intl.Collator("de", { sensitivity: "base" }); } }
    return collators[l];
  }
  function nameFn(ctx) { return (ctx && ctx.nameOf) || (a => a.name); }
  function compareNames(a, b, ctx) {
    const n = nameFn(ctx);
    return collator(ctx && ctx.locale).compare(String(n(a)), String(n(b)));
  }

  /* Temperatur-Umrechnung (Daten sind immer in °C gespeichert) */
  function cToF(c) { return isNum(c) ? round(c * 9 / 5 + 32, 1) : null; }
  function fToC(f) { return isNum(f) ? (f - 32) * 5 / 9 : null; }

  /* Sortierung wie Excel: auf-/absteigend, leere Werte immer unten, bei Gleichstand alphabetisch */
  function sortAnimals(list, col, dir, ctx) {
    const d = dir === "desc" ? -1 : 1;
    const out = list.slice();
    if (!col) return out.sort((a, b) => compareNames(a, b, ctx));
    out.sort((a, b) => {
      const ka = sortKey(a, col, ctx), kb = sortKey(b, col, ctx);
      if (ka == null && kb == null) return compareNames(a, b, ctx);
      if (ka == null) return 1;
      if (kb == null) return -1;
      let r;
      if (typeof ka === "string" || typeof kb === "string") r = collator(ctx && ctx.locale).compare(String(ka), String(kb));
      else r = ka - kb;
      return r !== 0 ? r * d : compareNames(a, b, ctx);
    });
    return out;
  }

  /* ---------- Filter ---------- */
  /* Temperatur: ohne "exakt" → Toleranzbereich überlappt die Spanne;
     mit "exakt" → Toleranzbereich liegt komplett in der Spanne.
     Leeres von/bis = offen. */
  function tempMatch(aMin, aMax, from, to, exact) {
    const hasFrom = isNum(from), hasTo = isNum(to);
    if (!hasFrom && !hasTo) return true;
    if (!isNum(aMin) || !isNum(aMax)) return false;
    if (exact) return (!hasFrom || aMin >= from) && (!hasTo || aMax <= to);
    return (!hasFrom || aMax >= from) && (!hasTo || aMin <= to);
  }

  function emptyFilter() {
    return { search: "", status: [], continents: [], biomes: [], roles: [], tempFrom: null, tempTo: null, tempExact: false,
             sizeMax: null, sizeOp: "le", climbProof: "any", walk: "any", gift: false, owned: "any" };
  }

  function isFilterActive(f) {
    if (!f) return false;
    return !!(f.search && f.search.trim()) || (f.status && f.status.length) || (f.continents && f.continents.length) ||
      (f.biomes && f.biomes.length) || (f.roles && f.roles.length) || isNum(f.tempFrom) || isNum(f.tempTo) || isNum(f.sizeMax) ||
      (f.climbProof && f.climbProof !== "any") || (f.walk && f.walk !== "any") || !!f.gift || (f.owned && f.owned !== "any");
  }

  /* Suche: im Namen der gewählten Sprache und im deutschen Namen.
     opts.sizeKey: Fläche für den Filter "≤ m²" (z. B. land, flight); opts.owned: Set der Tier-IDs im gewählten Zoo */
  function matchAnimal(a, f, dlcs, nameOf, opts) {
    opts = opts || {};
    if (dlcs && dlcs.indexOf(a.dlc) < 0) return false;
    if (!f) return true;
    if (f.search && f.search.trim()) {
      const q = norm(f.search.trim());
      const local = nameOf ? nameOf(a) : a.name;
      if (norm(a.name).indexOf(q) < 0 && norm(local).indexOf(q) < 0 && norm(a.sci).indexOf(q) < 0) return false;
    }
    if (f.status && f.status.length && f.status.indexOf(a.status) < 0) return false;
    if (f.continents && f.continents.length && !(a.continents || []).some(c => f.continents.indexOf(c) >= 0)) return false;
    if (f.biomes && f.biomes.length && !(a.biomes || []).some(b => f.biomes.indexOf(b) >= 0)) return false;
    if (f.roles && f.roles.length && !(a.roles || []).some(r => f.roles.indexOf(r) >= 0)) return false;
    if (!tempMatch(a.tempMin, a.tempMax, f.tempFrom, f.tempTo, f.tempExact)) return false;
    if (isNum(f.sizeMax) && opts.sizeKey) {
      const s = get(a, "area1." + opts.sizeKey);
      if (!isNum(s) || s === 0) return false;
      const op = f.sizeOp || "le";
      if (op === "le" && s > f.sizeMax) return false;
      if (op === "ge" && s < f.sizeMax) return false;
      if (op === "eq" && s !== f.sizeMax) return false;
    }
    if (f.climbProof === "yes" && get(a, "fence.climbProof") !== true) return false;
    if (f.climbProof === "no" && get(a, "fence.climbProof") !== false) return false;
    if (f.walk === "yes" && a.walkthrough !== true) return false;
    if (f.walk === "no" && a.walkthrough !== false) return false;
    if (f.gift && !a.gift) return false;
    if (opts.owned && f.owned === "yes" && !opts.owned.has(a.id)) return false;
    if (opts.owned && f.owned === "no" && opts.owned.has(a.id)) return false;
    return true;
  }

  function filterAnimals(list, f, dlcs, nameOf, opts) { return list.filter(a => matchAnimal(a, f, dlcs, nameOf, opts)); }

  /* ---------- Gruppenprüfung ----------
     Gemischte Gruppe: Gesamt zwischen Gruppe min./max., ♂ ≤ max. ♂, ♀ ≤ max. ♀.
     Reine ♂-/♀-Gruppe: Spalten "Nur ♂" / "Nur ♀" (falls vorhanden), sonst Gruppe min./max.
     Ergebnis wird nur markiert, nie gesperrt. */
  function checkGroup(animal, males, females) {
    const m = Math.max(0, Math.round(+males || 0)), f = Math.max(0, Math.round(+females || 0));
    const total = m + f;
    const s = animal.social || {};
    const issues = [];
    let scope = "mixed";
    if (total === 0) return { scope: null, total, ok: false, issues: [{ key: "plan.warnEmpty", level: "warn" }] };

    let min = s.min, max = s.max;
    if (m > 0 && f === 0 && Array.isArray(s.maleOnly)) { scope = "male"; min = s.maleOnly[0]; max = s.maleOnly[1]; }
    else if (f > 0 && m === 0 && Array.isArray(s.femaleOnly)) { scope = "female"; min = s.femaleOnly[0]; max = s.femaleOnly[1]; }

    if (isNum(min) && total < min) issues.push({ key: "plan.warnBelowMin", params: { min }, level: "warn" });
    if (isNum(max) && total > max) issues.push({ key: "plan.warnAboveMax", params: { max }, level: "bad" });
    if (scope === "mixed") {
      if (isNum(s.maxMales) && m > s.maxMales) issues.push({ key: "plan.warnMaxM", params: { max: s.maxMales }, level: "bad" });
      if (isNum(s.maxFemales) && f > s.maxFemales) issues.push({ key: "plan.warnMaxF", params: { max: s.maxFemales }, level: "bad" });
    }
    return { scope, total, ok: issues.length === 0, issues };
  }

  /* ---------- Planer ---------- */
  function intersectRange(ranges) {
    let lo = -Infinity, hi = Infinity, any = false;
    ranges.forEach(r => { if (isNum(r[0]) && isNum(r[1])) { any = true; lo = Math.max(lo, r[0]); hi = Math.min(hi, r[1]); } });
    if (!any) return null;
    return lo <= hi ? [lo, hi] : false;
  }
  function intersectSets(sets) {
    if (!sets.length) return [];
    return sets.reduce((acc, s) => acc.filter(x => (s || []).indexOf(x) >= 0));
  }

  /* entries: [{ animal, males, females }]; mode: "sum" | "max"; compat: { pairs:[{a,b,type,note}] } */
  function plan(entries, mode, compat) {
    const rows = entries.filter(e => e && e.animal).map(e => {
      const total = Math.max(0, Math.round(+e.males || 0)) + Math.max(0, Math.round(+e.females || 0));
      const needs = {};
      AREA_KEYS.forEach(k => { needs[k] = total > 0 ? need(e.animal, total, k) : null; });
      return { animal: e.animal, males: +e.males || 0, females: +e.females || 0, total, needs, group: checkGroup(e.animal, e.males, e.females) };
    });

    const totals = {};
    AREA_KEYS.forEach(k => {
      const vals = rows.map(r => r.needs[k]).filter(isNum);
      totals[k] = vals.length ? round(mode === "max" ? Math.max.apply(null, vals) : vals.reduce((a, b) => a + b, 0), 2) : null;
    });

    const temp = intersectRange(rows.map(r => [r.animal.tempMin, r.animal.tempMax]));
    const biomes = rows.length ? intersectSets(rows.map(r => r.animal.biomes || [])) : [];

    /* Zaun: strengste Anforderung zählt. Wassergraben nur, wenn alle Arten einen erlauben. */
    const fences = rows.map(r => r.animal.fence).filter(Boolean);
    let fence = null;
    if (fences.length) {
      const nums = k => fences.map(f => f[k]).filter(isNum);
      const st = nums("strength"), h = nums("height");
      const allMoat = fences.length === rows.length && fences.every(f => f.moat && isNum(f.moat.width));
      fence = {
        strength: st.length ? Math.max.apply(null, st) : null,
        height: h.length ? Math.max.apply(null, h) : null,
        climbProof: fences.some(f => f.climbProof === true),
        moat: allMoat ? { width: Math.max.apply(null, fences.map(f => f.moat.width)), depth: Math.max.apply(null, fences.map(f => f.moat.depth || 0)) } : null
      };
    }

    /* Vergesellschaftung: für jedes Artenpaar im Gehege, wer von wem profitiert bzw. ob es unverträglich ist */
    const ids = [];
    rows.forEach(r => { if (ids.indexOf(r.animal.id) < 0) ids.push(r.animal.id); });
    const pairs = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push(relation(ids[i], ids[j], compat));

    return { rows, totals, temp, biomes, fence, pairs, mode: mode === "max" ? "max" : "sum" };
  }

  /* Beziehung zweier Arten aus compat.pairs (offizielle Zoopedia, Spalten "Zusammenleben"):
     type "benefit": a profitiert von b (einseitig; gegenseitig = zwei Einträge)
     type "neutral": a und b können sich ein Gehege teilen, ohne Bonus
     Nicht aufgeführte Paare können nicht zusammenleben (conflict). */
  function relation(a, b, compat) {
    const r = { a, b, aFromB: false, bFromA: false, neutral: false, conflict: false, notes: [] };
    ((compat && compat.pairs) || []).forEach(p => {
      const ab = p.a === a && p.b === b, ba = p.a === b && p.b === a;
      if (!ab && !ba) return;
      if (p.type === "neutral") r.neutral = true;
      else if (p.type === "benefit") { if (ab) r.aFromB = true; else r.bFromA = true; }
      else if (p.type === "conflict") r.conflict = true;
      else return;
      if (p.note) r.notes.push(p.note);
    });
    if (!r.aFromB && !r.bFromA && !r.neutral) r.conflict = true;
    if (r.aFromB || r.bFromA) r.neutral = false; // Bonus geht vor
    r.known = true;
    return r;
  }
  /* Für das Tierprofil: von wem profitiert die Art, wer profitiert von ihr, mit wem verträgt sie sich ohne Bonus */
  function relationsOf(id, compat) {
    const out = { benefitsFrom: [], benefitsOthers: [], neutral: [] };
    const add = (list, x) => { if (list.indexOf(x) < 0) list.push(x); };
    ((compat && compat.pairs) || []).forEach(p => {
      if (p.a !== id && p.b !== id) return;
      const other = p.a === id ? p.b : p.a;
      if (other === id) return;
      if (p.type === "benefit") { if (p.a === id) add(out.benefitsFrom, other); else add(out.benefitsOthers, other); }
      else if (p.type === "neutral") add(out.neutral, other);
    });
    out.neutral = out.neutral.filter(x => out.benefitsFrom.indexOf(x) < 0 && out.benefitsOthers.indexOf(x) < 0);
    return out;
  }

  return { relation, relationsOf, toDays, AREA_KEYS, STATUS_ORDER, get, isNum, round, norm, increment, need, calc, cellValue, sortKey, sortAnimals,
           tempMatch, cToF, fToC, compareNames, emptyFilter, isFilterActive, matchAnimal, filterAnimals, checkGroup, plan, intersectRange };
});
