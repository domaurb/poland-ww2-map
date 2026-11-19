import { EVENT_TYPES, RANGE_START, type EventType } from "../data/constants";
import type { Lang } from "../i18n";
import { clampIso, isIsoDate } from "./dates";

export type Mode = "date" | "overview";
export type Page = "map" | "about";
export type Speed = "day" | "week" | "month";
export type BorderKey = "1939" | "today" | "occupation";
export const BORDER_KEYS: BorderKey[] = ["1939", "today", "occupation"];
export const DEFAULT_BORDERS: BorderKey[] = ["1939", "occupation"];

export type UrlState = {
  date: string;
  lang: Lang;
  mode: Mode;
  page: Page;
  event: string | null;
  types: Set<EventType>;
  verifiedOnly: boolean;
  speed: Speed;
  borders: Set<BorderKey>;
};

const browserLang = (): Lang =>
  typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pl") ? "pl" : "en";

export function parseUrl(search: string, eventStart?: (id: string) => string | undefined): UrlState {
  const q = new URLSearchParams(search);
  const event = q.get("event");
  const rawDate = q.get("date");
  const date = isIsoDate(rawDate) ? clampIso(rawDate) : (event && eventStart?.(event)) || RANGE_START;
  const typesParam = q.get("types");
  const types = new Set<EventType>(
    typesParam === null
      ? EVENT_TYPES
      : typesParam.split(",").filter((t): t is EventType => (EVENT_TYPES as readonly string[]).includes(t)),
  );
  const bordersParam = q.get("borders");
  const borders = new Set<BorderKey>(
    bordersParam === null ? DEFAULT_BORDERS : bordersParam.split(",").filter((b): b is BorderKey => (BORDER_KEYS as string[]).includes(b)),
  );
  const lang = q.get("lang");
  const speed = q.get("speed");
  return {
    date,
    lang: lang === "pl" || lang === "en" ? lang : browserLang(),
    mode: q.get("mode") === "overview" ? "overview" : "date",
    page: q.get("page") === "about" ? "about" : "map",
    event,
    types,
    verifiedOnly: q.get("verified") === "1",
    speed: speed === "week" || speed === "month" ? speed : "day",
    borders,
  };
}

/** Serialises only non-default values, keeping shared URLs short (e.g. ?date=1944-08-01&lang=pl). */
export function toSearch(s: UrlState) {
  const q = new URLSearchParams();
  if (s.page === "about") q.set("page", "about");
  if (s.mode === "overview") q.set("mode", "overview");
  else q.set("date", s.date);
  q.set("lang", s.lang);
  if (s.event) q.set("event", s.event);
  if (s.types.size !== EVENT_TYPES.length) q.set("types", EVENT_TYPES.filter((t) => s.types.has(t)).join(","));
  if (s.verifiedOnly) q.set("verified", "1");
  if (s.speed !== "day") q.set("speed", s.speed);
  const isDefaultBorders = s.borders.size === DEFAULT_BORDERS.length && DEFAULT_BORDERS.every((b) => s.borders.has(b));
  if (!isDefaultBorders) q.set("borders", s.borders.size ? BORDER_KEYS.filter((b) => s.borders.has(b)).join(",") : "none");
  return "?" + q.toString().replace(/%2C/g, ",");
}
