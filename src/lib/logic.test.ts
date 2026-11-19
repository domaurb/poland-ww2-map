import { describe, expect, it } from "vitest";
import { EVENT_TYPES } from "../data/constants";
import type { HistEvent } from "../data/schema";
import { addDays, formatEventDates, fromDay, LAST_DAY, monthTicks, toDay } from "./dates";
import { applyFilters, eventsOnDate, nextDate, prevDate, significantEvents, startDates } from "./events";
import { parseUrl, toSearch } from "./urlState";

const ev = (id: string, startDate: string, endDate: string, extra: Partial<HistEvent> = {}): HistEvent => ({
  id,
  title: { en: id, pl: id },
  startDate,
  endDate,
  datePrecision: "day",
  location: { lat: 52, lng: 21, name: { en: "X", pl: "X" }, precision: "town" },
  type: "battle",
  summary: { en: "s", pl: "s" },
  sources: [{ title: "t", publisher: "p", url: "https://example.org", tier: 1, accessed: "2026-11-18" }],
  verified: true,
  ...extra,
});

describe("dates", () => {
  it("maps the range to day indices", () => {
    expect(toDay("1939-09-01")).toBe(0);
    expect(fromDay(LAST_DAY)).toBe("1945-05-08");
    expect(fromDay(toDay("1944-08-01"))).toBe("1944-08-01");
  });
  it("handles leap years (1940, 1944)", () => {
    expect(addDays("1940-02-28", 1)).toBe("1940-02-29");
    expect(addDays("1944-02-28", 2)).toBe("1944-03-01");
  });
  it("clamps navigation to the range", () => {
    expect(addDays("1939-09-01", -5)).toBe("1939-09-01");
    expect(addDays("1945-05-07", 10)).toBe("1945-05-08");
  });
  it("produces one tick per month, starting at the range start", () => {
    const ticks = monthTicks();
    expect(ticks[0].iso).toBe("1939-09-01");
    expect(ticks.at(-1)!.iso).toBe("1945-05-01");
    expect(ticks).toHaveLength(69);
  });
  it("formats approximate and month-precision ranges", () => {
    expect(formatEventDates({ startDate: "1939-11-01", endDate: "1940-04-30", datePrecision: "approximate" }, "en")).toBe(
      "c. 1 November 1939 – 30 April 1940",
    );
    expect(formatEventDates({ startDate: "1943-07-01", endDate: "1943-07-31", datePrecision: "month" }, "pl")).toBe("lipiec 1943");
  });
});

describe("event queries", () => {
  const events = [
    ev("uprising", "1944-08-01", "1944-10-02", { type: "uprising" }),
    ev("wola", "1944-08-05", "1944-08-06", { type: "massacre" }),
    ev("other-day", "1944-08-05", "1944-08-05"),
  ];
  it("splits began vs ongoing, inclusive of both ends", () => {
    const d = eventsOnDate(events, "1944-08-05");
    expect(d.began.map((e) => e.id)).toEqual(["other-day", "wola"]);
    expect(d.ongoing.map((e) => e.id)).toEqual(["uprising"]);
    expect(eventsOnDate(events, "1944-10-02").ongoing.map((e) => e.id)).toEqual(["uprising"]);
    expect(eventsOnDate(events, "1944-10-03").began).toHaveLength(0);
  });
  it("navigates between start dates", () => {
    const dates = startDates(events);
    expect(dates).toEqual(["1944-08-01", "1944-08-05"]);
    expect(nextDate(dates, "1944-08-01")).toBe("1944-08-05");
    expect(nextDate(dates, "1944-08-05")).toBeNull();
    expect(prevDate(dates, "1944-08-05")).toBe("1944-08-01");
    expect(prevDate(dates, "1944-08-01")).toBeNull();
  });
  it("filters by type", () => {
    expect(applyFilters(events, { types: new Set(["massacre"]) }).map((e) => e.id)).toEqual(["wola"]);
    expect(applyFilters(events, { types: new Set(EVENT_TYPES) })).toHaveLength(3);
  });
});

describe("URL state", () => {
  it("round-trips a shared date link", () => {
    const s = parseUrl("?date=1944-08-01&lang=pl");
    expect(s).toMatchObject({ date: "1944-08-01", lang: "pl", mode: "date", page: "map", event: null });
    expect(toSearch(s)).toBe("?date=1944-08-01&lang=pl");
  });
  it("supports overview mode and filters", () => {
    const s = parseUrl("?mode=overview&lang=en&types=battle,siege&verified=1"); // old links: `verified` is ignored
    expect(s.mode).toBe("overview");
    expect([...s.types].sort()).toEqual(["battle", "siege"]);
    expect(toSearch(s)).toBe("?mode=overview&lang=en&types=battle,siege");
  });
  it("rejects invalid or out-of-range dates", () => {
    expect(parseUrl("?date=1944-02-30").date).toBe("1939-09-01");
    expect(parseUrl("?date=1950-01-01").date).toBe("1945-05-08");
    expect(parseUrl("?date=1930-01-01").date).toBe("1939-09-01");
  });
  it("derives the date from a linked event when no date is given", () => {
    expect(parseUrl("?event=x", () => "1943-04-19").date).toBe("1943-04-19");
  });
});

describe("most significant events", () => {
  it("lists only selected events, in date order regardless of internal order", () => {
    const list = significantEvents([
      ev("b", "1944-08-01", "1944-10-02", { significanceRank: 1 }),
      ev("a", "1939-09-01", "1939-09-07", { significanceRank: 7 }),
      ev("c", "1940-01-01", "1940-01-01"),
    ]);
    expect(list.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("border layers in the URL", () => {
  it("defaults to the 1939 border and both occupation zones and keeps them out of the URL", () => {
    const s = parseUrl("?date=1940-01-01&lang=en");
    expect([...s.borders].sort()).toEqual(["1939", "german", "neighbours", "soviet"]);
    expect(toSearch(s)).not.toContain("borders");
  });
  it("round-trips a custom selection and 'none'", () => {
    const s = parseUrl("?date=1940-01-01&lang=en&borders=today");
    expect([...s.borders]).toEqual(["today"]);
    expect(toSearch(s)).toContain("borders=today");
    expect(toSearch({ ...s, borders: new Set() })).toContain("borders=none");
    expect(parseUrl("?borders=none").borders.size).toBe(0);
  });
  it("reads the old single 'occupation' switch as both zones", () => {
    expect([...parseUrl("?borders=1939,occupation").borders].sort()).toEqual(["1939", "german", "soviet"]);
  });
});
