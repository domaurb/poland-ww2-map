import INDEX from "virtual:events-index";
import type { EventIndex, HistEvent } from "./schema";

/** The slim index (validated at build time by `npm run validate`), sorted by start date. */
export const ALL_EVENTS: EventIndex[] = [...INDEX].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
export const EVENTS_BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]));

// Full event texts, one lazily loaded chunk per start year.
const years = import.meta.glob<HistEvent[]>("./events/*.json", { import: "default" });
const cache = new Map<string, Promise<Map<string, HistEvent>>>();

function loadYear(year: string) {
  let p = cache.get(year);
  if (!p) {
    const loader = years[`./events/${year}.json`];
    p = loader ? loader().then((arr) => new Map(arr.map((e) => [e.id, e]))) : Promise.resolve(new Map());
    cache.set(year, p);
  }
  return p;
}

export const loadEventDetail = (e: EventIndex) => loadYear(e.startDate.slice(0, 4)).then((m) => m.get(e.id) ?? null);

export const loadAllEvents = () =>
  Promise.all(Object.keys(years).map((k) => loadYear(k.slice(-9, -5)))).then((maps) => maps.flatMap((m) => [...m.values()]));
