import { useCallback, useEffect, useMemo, useState } from "react";
import { EVENT_TYPES, type EventType } from "./data/constants";
import { ALL_EVENTS, EVENTS_BY_ID } from "./data/loadEvents";
import { STRINGS } from "./i18n";
import { addDays, clampIso, fromDay, LAST_DAY, toDay } from "./lib/dates";
import { applyFilters, eventsOnDate, nextDate, prevDate, significantEvents, startDates } from "./lib/events";
import { parseUrl, toSearch, type Page, type Speed, type UrlState } from "./lib/urlState";
import AboutPage from "./components/AboutPage";
import type { MarkerItem } from "./components/ClusterLayer";
import Header from "./components/Header";
import LegendFilters from "./components/LegendFilters";
import MapView from "./components/MapView";
import SidePanel from "./components/SidePanel";
import TimelineBar from "./components/TimelineBar";

/** Playback cadence: how often to advance, and by how many days. */
const SPEEDS: Record<Speed, { intervalMs: number; stepDays: number }> = {
  day: { intervalMs: 1000, stepDays: 1 },
  week: { intervalMs: 1000 / 7, stepDays: 1 },
  month: { intervalMs: 100, stepDays: 3 },
};

const initialState = () => parseUrl(window.location.search, (id) => EVENTS_BY_ID.get(id)?.startDate);
const TYPE_COUNTS = Object.fromEntries(EVENT_TYPES.map((t) => [t, ALL_EVENTS.filter((e) => e.type === t).length]));

export default function App() {
  const [s, setS] = useState<UrlState>(initialState);
  const [playing, setPlaying] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [revealToken, setRevealToken] = useState(0);
  const update = useCallback((patch: Partial<UrlState>) => setS((prev) => ({ ...prev, ...patch })), []);
  const t = STRINGS[s.lang];

  // ---- URL & document sync -------------------------------------------------
  useEffect(() => {
    const search = toSearch(s);
    if (search === window.location.search) return;
    try {
      window.history.replaceState(null, "", search);
    } catch {
      // Some browsers block history updates for pages opened from file:// — the map still works.
    }
  }, [s]);
  useEffect(() => {
    const onPop = () => setS(initialState());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.title = `${t.appTitle} — ${t.appSubtitle}`;
  }, [s.lang, t]);

  // ---- derived data --------------------------------------------------------
  const filtered = useMemo(() => applyFilters(ALL_EVENTS, { types: s.types }), [s.types]);
  const dates = useMemo(() => startDates(filtered), [filtered]);
  const { began, ongoing } = useMemo(() => eventsOnDate(filtered, s.date), [filtered, s.date]);
  const ranked = useMemo(() => significantEvents(filtered), [filtered]);
  const prevEvent = prevDate(dates, s.date);
  const nextEvent = nextDate(dates, s.date);
  const selected = s.event ? (EVENTS_BY_ID.get(s.event) ?? null) : null;

  const markerItems = useMemo<MarkerItem[]>(() => {
    const label = (e: (typeof ALL_EVENTS)[number], extra = "") => `${e.title[s.lang]}${extra}`;
    if (s.mode === "overview")
      return ranked.map((e) => ({ event: e, variant: "began", label: label(e) }));
    return [
      ...began.map((e) => ({ event: e, variant: "began" as const, label: label(e) })),
      ...ongoing.map((e) => ({ event: e, variant: "ongoing" as const, label: label(e, ` — ${t.ongoing.toLowerCase()}`) })),
    ];
  }, [s.mode, s.lang, ranked, began, ongoing, t]);

  // ---- playback ------------------------------------------------------------
  useEffect(() => {
    if (!playing || s.mode !== "date") return;
    const { intervalMs, stepDays } = SPEEDS[s.speed];
    const handle = window.setInterval(() => {
      setS((prev) => {
        const day = toDay(prev.date) + stepDays;
        if (day >= LAST_DAY) {
          setPlaying(false);
          return { ...prev, date: fromDay(LAST_DAY) };
        }
        return { ...prev, date: fromDay(day) };
      });
    }, intervalMs);
    return () => window.clearInterval(handle);
  }, [playing, s.speed, s.mode]);

  const togglePlay = () => {
    if (!playing && toDay(s.date) >= LAST_DAY) update({ date: fromDay(0) });
    setPlaying((p) => !p);
  };

  // ---- actions -------------------------------------------------------------
  const setDate = (iso: string) => update({ date: clampIso(iso) });
  const openEvent = (id: string, reveal = true) => {
    update({ event: id });
    setSheetExpanded(true);
    if (reveal) setRevealToken((n) => n + 1);
    requestAnimationFrame(() => document.getElementById("detail-title")?.focus());
  };
  const closeEvent = () => update({ event: null });
  const toggleMode = () => {
    setPlaying(false);
    update({ mode: s.mode === "overview" ? "date" : "overview" });
  };
  const setPage = (page: Page) => {
    setPlaying(false);
    update({ page });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && s.event) closeEvent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const legend = (
    <LegendFilters
      lang={s.lang}
      types={s.types}
      counts={TYPE_COUNTS as Partial<Record<EventType, number>>}
      onTypes={(types) => update({ types })}
      borders={s.borders}
      onBorders={(borders) => update({ borders })}
    />
  );

  return (
    <div className={`app mode-${s.mode} page-${s.page}`}>
      <Header
        lang={s.lang}
        mode={s.mode}
        page={s.page}
        onLang={() => update({ lang: s.lang === "en" ? "pl" : "en" })}
        onMode={toggleMode}
        onPage={setPage}
      />
      {s.page === "about" ? (
        <AboutPage lang={s.lang} />
      ) : (
        <>
          <main className="main" id="main">
            <MapView
              items={markerItems}
              selectedId={s.event}
              onSelect={(id) => openEvent(id, false)}
              revealToken={revealToken}
              selectedPoint={selected ? [selected.location.lat, selected.location.lng] : null}
              label={t.map}
              borders={s.borders}
              borderDate={s.mode === "overview" ? null : s.date}
            />
            <SidePanel
              lang={s.lang}
              mode={s.mode}
              date={s.date}
              began={began}
              ongoing={ongoing}
              ranked={ranked}
              selected={selected}
              selectedId={s.event}
              expanded={sheetExpanded}
              hasNextEvent={!!nextEvent}
              legend={legend}
              onOpen={(id) => openEvent(id)}
              onBack={closeEvent}
              onShowOnMap={() => setRevealToken((n) => n + 1)}
              onNextEvent={() => nextEvent && setDate(nextEvent)}
              onToggleExpanded={() => setSheetExpanded((v) => !v)}
            />
          </main>
          <TimelineBar
            lang={s.lang}
            date={s.date}
            disabled={s.mode === "overview"}
            playing={playing}
            speed={s.speed}
            hasPrevEvent={!!prevEvent}
            hasNextEvent={!!nextEvent}
            onDate={setDate}
            onStep={(n) => setDate(addDays(s.date, n))}
            onPrevEvent={() => prevEvent && setDate(prevEvent)}
            onNextEvent={() => nextEvent && setDate(nextEvent)}
            onTogglePlay={togglePlay}
            onSpeed={(speed) => update({ speed })}
            events={filtered}
          />
        </>
      )}
    </div>
  );
}
