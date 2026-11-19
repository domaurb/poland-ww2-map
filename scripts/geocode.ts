/**
 * Resolves entries in src/data/places.json via OpenStreetMap Nominatim and caches
 * them in src/data/gazetteer.json. Only uncached keys are queried (pass --refresh to
 * re-query all). Honours the Nominatim usage policy: max 1 request/second, an
 * identifying User-Agent, results cached and attributed (© OpenStreetMap contributors, ODbL).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const PLACES = "src/data/places.json";
const GAZ = "src/data/gazetteer.json";
const UA = "ww2-poland-map/0.1 (open-source educational map; data build script)";

type Place = { key: string; query: string; events: string[] };
type Entry = {
  query: string; lat: number; lng: number; displayName: string;
  osmType: string; osmId: number; class: string; type: string; resolved: string;
};

const places: Place[] = JSON.parse(readFileSync(PLACES, "utf8")).places;
const gaz: Record<string, Entry> = existsSync(GAZ) ? JSON.parse(readFileSync(GAZ, "utf8")).entries : {};
const refresh = process.argv.includes("--refresh");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// curl is used (not fetch) so the request goes through the environment's HTTPS proxy.
function lookup(q: string) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=pl&q=" + encodeURIComponent(q);
  const out = execFileSync("curl", ["-sS", "-m", "30", "-A", UA, url], { encoding: "utf8" });
  return JSON.parse(out) as Array<Record<string, string>>;
}

let changed = 0;
for (const p of places) {
  if (gaz[p.key] && gaz[p.key].query === p.query && !refresh) continue;
  const res = lookup(p.query);
  await sleep(1100);
  if (!res.length) { console.error(`NOT FOUND: ${p.key} (${p.query})`); continue; }
  const r = res[0];
  gaz[p.key] = {
    query: p.query, lat: +(+r.lat).toFixed(5), lng: +(+r.lon).toFixed(5), displayName: r.display_name,
    osmType: r.osm_type, osmId: +r.osm_id, class: r.category ?? r.class, type: r.type,
    resolved: new Date().toISOString().slice(0, 10),
  };
  changed++;
  console.log(`${p.key}: ${gaz[p.key].lat}, ${gaz[p.key].lng}  ${r.display_name}`);
}
writeFileSync(GAZ, JSON.stringify({
  _attribution: "Coordinates from OpenStreetMap Nominatim. © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).",
  entries: Object.fromEntries(Object.entries(gaz).sort(([a], [b]) => a.localeCompare(b))),
}, null, 2) + "\n");
console.log(`${changed} place(s) resolved; ${Object.keys(gaz).length} cached.`);

// Copy resolved coordinates into the events listed for each place.
const EVENTS_DIR = "src/data/events";
const coordsFor = new Map<string, Entry>();
for (const p of places) for (const id of p.events) if (gaz[p.key]) coordsFor.set(id, gaz[p.key]);
let synced = 0;
for (const f of readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".json"))) {
  const path = `${EVENTS_DIR}/${f}`;
  const events = JSON.parse(readFileSync(path, "utf8")) as Array<{ id: string; location: { lat: number; lng: number } }>;
  let dirty = false;
  for (const e of events) {
    const g = coordsFor.get(e.id);
    if (g && (e.location.lat !== g.lat || e.location.lng !== g.lng)) {
      e.location.lat = g.lat; e.location.lng = g.lng; dirty = true; synced++;
    }
  }
  if (dirty) writeFileSync(path, JSON.stringify(events, null, 2) + "\n");
}
console.log(`${synced} event coordinate(s) updated from the gazetteer.`);
