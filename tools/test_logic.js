// Tests für js/logic.js  –  Aufruf: node tools/test_logic.js
const assert = require("assert");
const path = require("path");
const ZL = require(path.join(__dirname, "..", "js", "logic.js"));
const all = require(path.join(__dirname, "..", "data", "tiere.json")).animals;
const enc = all.filter(a => a.types.includes("land"));
const meta = require(path.join(__dirname, "..", "data", "meta.json"));
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("Temperatur ohne Exakt: Überlappung", () => {
  assert.strictEqual(ZL.tempMatch(28, 45, 30, 40, false), true);
  assert.strictEqual(ZL.tempMatch(10, 29, 30, 40, false), false);
  assert.strictEqual(ZL.tempMatch(41, 50, 30, 40, false), false);
});
t("Temperatur mit Exakt: komplett in Spanne", () => {
  assert.strictEqual(ZL.tempMatch(32, 35, 30, 40, true), true);
  assert.strictEqual(ZL.tempMatch(28, 45, 30, 40, true), false);
});
t("Temperatur offene Grenzen", () => {
  assert.strictEqual(ZL.tempMatch(5, 20, null, 10, false), true);
  assert.strictEqual(ZL.tempMatch(5, 20, 25, null, false), false);
});
t("Berechner: Basis + (n-1) × Mehrbedarf", () => {
  const a = { area1: { land: 705, climb: 45, water: 0, deep: 0, shelter: 20 }, area2: { land: 815, climb: 60, water: 0, deep: 0, shelter: 40 }, social: { min: 1, max: 4 } };
  assert.strictEqual(ZL.increment(a, "land"), 110);
  assert.strictEqual(ZL.need(a, 1, "land"), 705);
  assert.strictEqual(ZL.need(a, 4, "land"), 705 + 3 * 110);
  const c = ZL.calc(a);
  assert.strictEqual(c.atMax.climb, 45 + 3 * 15);
  assert.strictEqual(c.atMax.shelter, 80);
  assert.strictEqual(c.atMin.land, 705);
});
t("Sortierung: alphabetisch, auf/ab, leere Werte unten", () => {
  const list = [{ name: "Zebra", x: 3 }, { name: "Äffchen", x: null }, { name: "Bär", x: 1 }];
  const col = { type: "num", path: "x" };
  assert.deepStrictEqual(ZL.sortAnimals(list, col, "asc").map(a => a.name), ["Bär", "Zebra", "Äffchen"]);
  assert.deepStrictEqual(ZL.sortAnimals(list, col, "desc").map(a => a.name), ["Zebra", "Bär", "Äffchen"]);
  assert.deepStrictEqual(ZL.sortAnimals(list, null).map(a => a.name), ["Äffchen", "Bär", "Zebra"]);
});
t("Filter: Quellen, Suche mit Umlauten, Biome", () => {
  const base = ZL.filterAnimals(enc, ZL.emptyFilter(), ["base"]);
  assert.ok(base.length > 0 && base.every(a => a.dlc === "base"));
  const f = ZL.emptyFilter(); f.search = "LOEWE";
  assert.ok(ZL.filterAnimals(enc, f, ["base", "deluxe"]).some(a => a.name.indexOf("Löwe") >= 0));
  const g = ZL.emptyFilter(); g.biomes = ["tundra"];
  assert.ok(ZL.filterAnimals(enc, g, null).every(a => a.biomes.includes("tundra")));
  const r = ZL.emptyFilter(); r.roles = ["predator"];
  const preds = ZL.filterAnimals(all, r, null);
  assert.ok(preds.length > 0 && preds.every(a => a.roles.includes("predator")));
  const w = ZL.emptyFilter(); w.walk = "yes";
  assert.ok(ZL.filterAnimals(all, w, null).every(a => a.walkthrough === true));
});
t("Gruppenprüfung gemischt / nur ♂ / zu viele", () => {
  const a = { social: { min: 3, max: 15, maxMales: 1, maxFemales: 14, maleOnly: [2, 6], femaleOnly: [3, 15] } };
  assert.strictEqual(ZL.checkGroup(a, 1, 5).ok, true);
  const r = ZL.checkGroup(a, 2, 5); assert.strictEqual(r.ok, false); assert.ok(r.issues.some(i => i.key === "plan.warnMaxM"));
  assert.strictEqual(ZL.checkGroup(a, 1, 1).issues[0].key, "plan.warnBelowMin");
  assert.strictEqual(ZL.checkGroup(a, 4, 0).scope, "male");
  assert.strictEqual(ZL.checkGroup(a, 4, 0).ok, true);
  assert.strictEqual(ZL.checkGroup(a, 7, 0).issues[0].key, "plan.warnAboveMax");
  assert.strictEqual(ZL.checkGroup(a, 0, 0).issues[0].key, "plan.warnEmpty");
});
t("Planer: Summe / Größter Wert / Temperatur / Zaun", () => {
  const A = { id: "a", tempMin: 10, tempMax: 30, biomes: ["grassland", "tropical"], area1: { land: 100 }, area2: { land: 150 }, social: { min: 1, max: 5 }, fence: { strength: 2, height: 2, climbProof: false, moat: { width: 3, depth: 1 } } };
  const B = { id: "b", tempMin: 20, tempMax: 40, biomes: ["tropical"], area1: { land: 200 }, area2: { land: 220 }, social: { min: 1, max: 5 }, fence: { strength: 4, height: 1.5, climbProof: true, moat: null } };
  const compat = { pairs: [{ a: "b", b: "a", type: "benefit" }] };
  const s = ZL.plan([{ animal: A, males: 1, females: 1 }, { animal: B, males: 0, females: 1 }], "sum", compat);
  assert.strictEqual(s.totals.land, 150 + 200);
  assert.deepStrictEqual(s.temp, [20, 30]);
  assert.deepStrictEqual(s.biomes, ["tropical"]);
  assert.strictEqual(s.fence.strength, 4); assert.strictEqual(s.fence.height, 2); assert.strictEqual(s.fence.moat, null);
  assert.strictEqual(s.pairs.length, 1);
  assert.strictEqual(s.pairs[0].bFromA, true); assert.strictEqual(s.pairs[0].aFromB, false); assert.strictEqual(s.pairs[0].known, true);
  const m = ZL.plan([{ animal: A, males: 1, females: 1 }, { animal: B, males: 0, females: 1 }], "max", compat);
  assert.strictEqual(m.totals.land, 200);
});
t("°C/°F-Umrechnung", () => {
  assert.strictEqual(ZL.cToF(0), 32); assert.strictEqual(ZL.cToF(100), 212); assert.strictEqual(ZL.cToF(-40), -40);
  assert.strictEqual(ZL.cToF(13), 55.4);
  assert.ok(Math.abs(ZL.fToC(ZL.cToF(37.5)) - 37.5) < 0.06);
  assert.strictEqual(ZL.fToC(212), 100);
});
t("Übersetzte Namen: Sortierung und Suche", () => {
  const list = [{ name: "Löwe", names: { en: "Lion" } }, { name: "Affe", names: { en: "Monkey" } }, { name: "Zebra", names: { en: "Asian Zebra" } }];
  const nameOf = a => a.names.en;
  assert.deepStrictEqual(ZL.sortAnimals(list, { type: "name" }, "asc", { nameOf, locale: "en" }).map(nameOf), ["Asian Zebra", "Lion", "Monkey"]);
  const f = ZL.emptyFilter(); f.search = "lion";
  assert.strictEqual(ZL.filterAnimals(list, f, null, nameOf).length, 1);
  f.search = "loewe";
  assert.strictEqual(ZL.filterAnimals(list, f, null, nameOf).length, 1);
});
t("Zusammenleben: profitiert, neutral, nicht möglich", () => {
  const compat = { pairs: [
    { a: "giraffe", b: "zebra", type: "benefit" },
    { a: "zebra", b: "gnu", type: "benefit" }, { a: "gnu", b: "zebra", type: "benefit" },
    { a: "gnu", b: "strauss", type: "neutral" }, { a: "giraffe", b: "zebra", type: "neutral" }] };
  const r1 = ZL.relation("zebra", "giraffe", compat);
  assert.deepStrictEqual([r1.aFromB, r1.bFromA, r1.neutral, r1.conflict], [false, true, false, false]);
  const r2 = ZL.relation("gnu", "zebra", compat);
  assert.deepStrictEqual([r2.aFromB, r2.bFromA], [true, true]);
  const r3 = ZL.relation("strauss", "gnu", compat);
  assert.deepStrictEqual([r3.neutral, r3.conflict], [true, false]);
  assert.strictEqual(ZL.relation("zebra", "loewe", compat).conflict, true);
  const z = ZL.relationsOf("zebra", compat);
  assert.deepStrictEqual(z.benefitsFrom, ["gnu"]);
  assert.deepStrictEqual(z.benefitsOthers.sort(), ["giraffe", "gnu"]);
  assert.deepStrictEqual(z.neutral, []);
  assert.deepStrictEqual(ZL.relationsOf("strauss", compat).neutral, ["gnu"]);
});
t("Echte Daten: Beziehungen symmetrisch verträglich", () => {
  const compat = require(path.join(__dirname, "..", "data", "compat.json"));
  const ids = new Set(all.map(a => a.id));
  compat.pairs.forEach(p => { assert.ok(ids.has(p.a) && ids.has(p.b), p.a + "/" + p.b); });
  compat.pairs.forEach(p => assert.strictEqual(ZL.relation(p.b, p.a, compat).conflict, false));
});
t("Zeitangaben in Tage", () => {
  assert.strictEqual(ZL.toDays([2, "years"]), 730);
  assert.strictEqual(ZL.toDays([3, "weeks"]), 21);
  assert.strictEqual(ZL.toDays(null), null);
});
t("Alle Spalten aus meta.json lassen sich sortieren", () => {
  meta.categories.forEach(cat => cat.columns.filter(c => c.sortable).forEach(col => {
    ZL.sortAnimals(all.filter(a => a.types.includes(cat.type)), col, "asc", { dlcOrder: ["base", "deluxe"] });
  }));
});
console.log(`\n${n} Tests bestanden.`);
