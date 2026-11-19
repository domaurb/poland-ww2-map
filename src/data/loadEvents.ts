import type { HistEvent } from "./schema";

// Validated at build time by `npm run validate`; loaded eagerly so the app is fully static.
const modules = import.meta.glob<HistEvent[]>("./events/*.json", { eager: true, import: "default" });

export const ALL_EVENTS: HistEvent[] = Object.values(modules)
  .flat()
  .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));

export const EVENTS_BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]));
