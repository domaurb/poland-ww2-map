import type { EventIndex } from "../data/schema";
import type { EventType } from "../data/constants";

export type Filters = { types: Set<EventType>; verifiedOnly: boolean };

export const applyFilters = (events: EventIndex[], f: Filters) =>
  events.filter((e) => f.types.has(e.type) && (!f.verifiedOnly || e.verified));

/** Events active on `date`, split into those that begin that day and ongoing ones. */
export function eventsOnDate(events: EventIndex[], date: string) {
  const began: EventIndex[] = [];
  const ongoing: EventIndex[] = [];
  for (const e of events) {
    if (e.startDate > date || e.endDate < date) continue;
    (e.startDate === date ? began : ongoing).push(e);
  }
  const byStart = (a: EventIndex, b: EventIndex) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id);
  return { began: began.sort(byStart), ongoing: ongoing.sort(byStart) };
}

/** Sorted unique start dates — the "dates with events" used by next/previous navigation. */
export const startDates = (events: EventIndex[]) => [...new Set(events.map((e) => e.startDate))].sort();

export function nextDate(dates: string[], current: string) {
  return dates.find((d) => d > current) ?? null;
}
export function prevDate(dates: string[], current: string) {
  for (let i = dates.length - 1; i >= 0; i--) if (dates[i] < current) return dates[i];
  return null;
}

/** The selection of most significant events, in date order (the internal order is never shown). */
export const significantEvents = (events: EventIndex[]) =>
  events
    .filter((e) => e.significanceRank !== undefined)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
