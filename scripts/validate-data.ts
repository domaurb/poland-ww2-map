/**
 * Validates all event data. Run with `npm run validate` (add `--final` once the
 * selection of most significant events is assigned, to require significanceRank to cover exactly 1–100).
 * Exits non-zero on any error; prints warnings and a summary report.
 */
import { readFileSync, readdirSync } from "node:fs";
import { EventSchema, type HistEvent } from "../src/data/schema";
import { RANGE_START, RANGE_END, POLAND_BBOX, EVENT_TYPES } from "../src/data/constants";

const EVENTS_DIR = "src/data/events";
const FINAL = process.argv.includes("--final");
const errors: string[] = [];
const warnings: string[] = [];
const err = (id: string, msg: string) => errors.push(`${id}: ${msg}`);
const warn = (id: string, msg: string) => warnings.push(`${id}: ${msg}`);

const isRealDate = (s: string) => {
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

// ---- load & schema ---------------------------------------------------------
const events: HistEvent[] = [];
const files = readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(`${EVENTS_DIR}/${f}`, "utf8"));
  } catch (e) {
    err(f, `invalid JSON: ${(e as Error).message}`);
    continue;
  }
  if (!Array.isArray(raw)) { err(f, "file must contain a JSON array of events"); continue; }
  raw.forEach((item, i) => {
    const parsed = EventSchema.safeParse(item);
    const label = `${f}[${i}]${(item as { id?: string })?.id ? ` (${(item as { id: string }).id})` : ""}`;
    if (!parsed.success) {
      for (const issue of parsed.error.issues) err(label, `schema: ${issue.path.join(".") || "(root)"} – ${issue.message}`);
      return;
    }
    const e = parsed.data;
    const fileYear = f.replace(/\.json$/, "");
    if (/^\d{4}$/.test(fileYear) && e.startDate.slice(0, 4) !== fileYear)
      err(e.id, `is in ${f} but starts in ${e.startDate.slice(0, 4)}`);
    events.push(e);
  });
}

// ---- per-event rules -------------------------------------------------------
const exceptions = JSON.parse(readFileSync("src/data/exceptions.json", "utf8")) as { outOfArea: Record<string, string> };
const ids = new Map<string, number>();
for (const e of events) {
  ids.set(e.id, (ids.get(e.id) ?? 0) + 1);
  for (const [k, v] of [["startDate", e.startDate], ["endDate", e.endDate]] as const) {
    if (!isRealDate(v)) err(e.id, `${k} ${v} is not a real calendar date`);
    else if (v < RANGE_START || v > RANGE_END) err(e.id, `${k} ${v} is outside ${RANGE_START}…${RANGE_END}`);
  }
  if (e.startDate > e.endDate) err(e.id, `startDate ${e.startDate} is after endDate ${e.endDate}`);

  const { lat, lng } = e.location;
  const inBox = lat >= POLAND_BBOX.minLat && lat <= POLAND_BBOX.maxLat && lng >= POLAND_BBOX.minLng && lng <= POLAND_BBOX.maxLng;
  if (lat === 0 && lng === 0) err(e.id, "coordinates are 0,0 (not geocoded? run `npm run geocode`)");
  else if (!inBox && !exceptions.outOfArea[e.id]) err(e.id, `coordinates ${lat},${lng} are outside the Poland bounding box`);
  else if (!inBox) warn(e.id, `outside bounding box (documented exception: ${exceptions.outOfArea[e.id]})`);

  const urls = new Set<string>();
  for (const s of e.sources) {
    if (urls.has(s.url)) err(e.id, `duplicate source URL ${s.url}`);
    urls.add(s.url);
    if (/wikipedia\.org|wikimedia\.org/i.test(s.url)) err(e.id, `Wikipedia may not be cited (${s.url})`);
    if (!isRealDate(s.accessed)) err(e.id, `source accessed date ${s.accessed} invalid`);
  }
  const bestTier = Math.min(...e.sources.map((s) => s.tier));
  if (e.verified && bestTier > 2) err(e.id, "verified=true requires at least one tier-1 or tier-2 source");
  if (!e.verified && !e.notes) err(e.id, "unverified events must explain why in notes");
  if (e.significanceRank !== undefined && (e.significanceRank < 1 || e.significanceRank > 100))
    err(e.id, `significanceRank ${e.significanceRank} outside 1–100`);
}
for (const [id, n] of ids) if (n > 1) err(id, `duplicate id (${n} occurrences)`);
for (const id of Object.keys(exceptions.outOfArea))
  if (!ids.has(id)) warn(id, "listed in exceptions.json but no such event exists");

// ---- gazetteer consistency -------------------------------------------------
const places = JSON.parse(readFileSync("src/data/places.json", "utf8")).places as Array<{ key: string; events: string[] }>;
const gaz = JSON.parse(readFileSync("src/data/gazetteer.json", "utf8")).entries as Record<string, { lat: number; lng: number }>;
const placeOf = new Map<string, string>();
for (const p of places) for (const id of p.events) placeOf.set(id, p.key);
for (const e of events) {
  const key = placeOf.get(e.id);
  if (!key) { warn(e.id, "no entry in places.json (coordinates not traceable to the gazetteer)"); continue; }
  const g = gaz[key];
  if (!g) err(e.id, `place "${key}" not resolved in gazetteer.json (run \`npm run geocode\`)`);
  else if (g.lat !== e.location.lat || g.lng !== e.location.lng) err(e.id, `coordinates differ from gazetteer "${key}" (run \`npm run geocode\`)`);
}
for (const id of placeOf.keys()) if (!ids.has(id)) warn(id, "listed in places.json but no such event exists");

// ---- significance ranks ----------------------------------------------------
const ranked = events.filter((e) => e.significanceRank !== undefined);
const rankCount = new Map<number, string[]>();
for (const e of ranked) rankCount.set(e.significanceRank!, [...(rankCount.get(e.significanceRank!) ?? []), e.id]);
for (const [r, list] of rankCount) if (list.length > 1) err(list.join(", "), `share significanceRank ${r}`);
const missingRanks = Array.from({ length: 100 }, (_, i) => i + 1).filter((r) => !rankCount.has(r));
if (missingRanks.length) {
  const msg = `significanceRank must cover exactly 1–100; ${ranked.length} ranked, ${missingRanks.length} rank(s) unassigned`;
  if (FINAL) errors.push(`significance order: ${msg}`);
  else warnings.push(`significance order: ${msg} (run with --final to enforce)`);
}

// ---- report ----------------------------------------------------------------
const count = <T,>(xs: T[], key: (x: T) => string) =>
  xs.reduce<Record<string, number>>((acc, x) => ((acc[key(x)] = (acc[key(x)] ?? 0) + 1), acc), {});
const unverified = events.filter((e) => !e.verified);
const noTier1 = events.filter((e) => !e.sources.some((s) => s.tier === 1));
const publishers = count(events.flatMap((e) => e.sources), (s) => `${s.publisher} (tier ${s.tier})`);

console.log(`\nEvents: ${events.length} in ${files.length} file(s)`);
console.log("By start year:", count(events, (e) => e.startDate.slice(0, 4)));
console.log("By type:", Object.fromEntries(EVENT_TYPES.map((t) => [t, events.filter((e) => e.type === t).length]).filter(([, n]) => n)));
console.log(`Verified: ${events.length - unverified.length}/${events.length} (${events.length ? Math.round((100 * (events.length - unverified.length)) / events.length) : 0}%)`);
console.log(`Unverified events: ${unverified.length}${unverified.length ? " – " + unverified.map((e) => e.id).join(", ") : ""}`);
console.log(`Events lacking a tier-1 source: ${noTier1.length}${noTier1.length ? " – " + noTier1.map((e) => e.id).join(", ") : ""}`);
console.log("Source citations by publisher:");
for (const [p, n] of Object.entries(publishers).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${p}`);

if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  ` + warnings.join("\n  "));
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log("\n✔ Data valid.");
