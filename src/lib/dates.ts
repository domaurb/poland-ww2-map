import { RANGE_START, RANGE_END } from "../data/constants";
import type { Lang } from "../i18n";

const DAY_MS = 86_400_000;
const parse = (iso: string) => Date.parse(iso + "T00:00:00Z");

/** Day index relative to RANGE_START (0 = 1 Sep 1939). */
export const toDay = (iso: string) => Math.round((parse(iso) - parse(RANGE_START)) / DAY_MS);
export const fromDay = (n: number) => new Date(parse(RANGE_START) + n * DAY_MS).toISOString().slice(0, 10);
export const LAST_DAY = toDay(RANGE_END);

export const isIsoDate = (s: string | null | undefined): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s)) && new Date(parse(s)).toISOString().startsWith(s);

export const clampDay = (n: number) => Math.min(LAST_DAY, Math.max(0, n));
export const clampIso = (iso: string) => fromDay(clampDay(toDay(iso)));
export const addDays = (iso: string, n: number) => fromDay(clampDay(toDay(iso) + n));

const locale = (lang: Lang) => (lang === "pl" ? "pl-PL" : "en-GB");

export function formatDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(locale(lang), { ...opts, timeZone: "UTC" }).format(new Date(parse(iso)));
}

export function formatWeekday(iso: string, lang: Lang) {
  return formatDate(iso, lang, { weekday: "long" });
}

/** Human-readable range honouring the event's date precision. */
export function formatEventDates(
  e: { startDate: string; endDate: string; datePrecision: "day" | "month" | "approximate" },
  lang: Lang,
) {
  const monthFmt: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  const fmt = (d: string) => (e.datePrecision === "month" ? formatDate(d, lang, monthFmt) : formatDate(d, lang));
  const same = e.datePrecision === "month" ? e.startDate.slice(0, 7) === e.endDate.slice(0, 7) : e.startDate === e.endDate;
  const range = same ? fmt(e.startDate) : `${fmt(e.startDate)} – ${fmt(e.endDate)}`;
  return e.datePrecision === "approximate" ? `${lang === "pl" ? "ok." : "c."} ${range}` : range;
}

/** Month starts within the range, for timeline ticks. */
export function monthTicks() {
  const ticks: { day: number; iso: string; month: number; year: number }[] = [];
  const end = parse(RANGE_END);
  const d = new Date(parse(RANGE_START));
  while (d.getTime() <= end) {
    const iso = d.toISOString().slice(0, 10);
    ticks.push({ day: toDay(iso), iso, month: d.getUTCMonth(), year: d.getUTCFullYear() });
    d.setUTCMonth(d.getUTCMonth() + 1, 1);
  }
  return ticks;
}
