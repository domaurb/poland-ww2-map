import { useMemo } from "react";
import { RANGE_END, RANGE_START } from "../data/constants";
import { STRINGS, type Lang } from "../i18n";
import { formatDate, formatWeekday, fromDay, LAST_DAY, monthTicks, toDay } from "../lib/dates";
import type { EventIndex } from "../data/schema";
import type { Speed } from "../lib/urlState";
import DensityStrip from "./DensityStrip";

type Props = {
  lang: Lang;
  date: string;
  disabled: boolean;
  playing: boolean;
  speed: Speed;
  hasPrevEvent: boolean;
  hasNextEvent: boolean;
  onDate: (iso: string) => void;
  onStep: (days: number) => void;
  onPrevEvent: () => void;
  onNextEvent: () => void;
  onTogglePlay: () => void;
  onSpeed: (s: Speed) => void;
  events: EventIndex[];
};

const Icon = ({ d, label }: { d: string; label?: string }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden={label ? undefined : true} role={label ? "img" : undefined}>
    <path d={d} fill="currentColor" />
  </svg>
);
const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M7 5h4v14H7zM13 5h4v14h-4z",
  prev: "M15.5 5.5 9 12l6.5 6.5-1.4 1.4L6.2 12l7.9-7.9z",
  next: "M8.5 5.5 15 12l-6.5 6.5 1.4 1.4 7.9-7.9-7.9-7.9z",
  prevEvent: "M6 5h2v14H6zM18.5 5.5 12 12l6.5 6.5-1.4 1.4L9.2 12l7.9-7.9z",
  nextEvent: "M16 5h2v14h-2zM5.5 5.5 12 12l-6.5 6.5 1.4 1.4 7.9-7.9-7.9-7.9z",
};

export default function TimelineBar(p: Props) {
  const t = STRINGS[p.lang];
  const day = toDay(p.date);
  const ticks = useMemo(() => monthTicks(), []);
  const pct = (d: number) => `${(d / LAST_DAY) * 100}%`;
  const monthName = (iso: string) => formatDate(iso, p.lang, { month: "short" });

  return (
    <footer className={`timeline${p.disabled ? " is-disabled" : ""}`} aria-label={t.timeline}>
      {p.disabled && <p className="timeline-disabled-note">{t.dateControlsDisabled}</p>}
      <div className="timeline-controls" inert={p.disabled}>
        <div className="current-date" aria-live="polite" aria-atomic="true">
          <span className="current-date-main">{formatDate(p.date, p.lang)}</span>
          <span className="current-date-weekday">{formatWeekday(p.date, p.lang)}</span>
        </div>
        <div className="button-row" role="group" aria-label={t.date}>
          <button type="button" className="icon-btn" onClick={p.onPrevEvent} disabled={!p.hasPrevEvent} title={t.prevEventDate} aria-label={t.prevEventDate}>
            <Icon d={ICONS.prevEvent} />
          </button>
          <button type="button" className="icon-btn" onClick={() => p.onStep(-1)} disabled={day <= 0} title={t.prevDay} aria-label={t.prevDay}>
            <Icon d={ICONS.prev} />
          </button>
          <button type="button" className="icon-btn play-btn" onClick={p.onTogglePlay} aria-pressed={p.playing} title={p.playing ? t.pause : t.play} aria-label={p.playing ? t.pause : t.play}>
            <Icon d={p.playing ? ICONS.pause : ICONS.play} />
          </button>
          <button type="button" className="icon-btn" onClick={() => p.onStep(1)} disabled={day >= LAST_DAY} title={t.nextDay} aria-label={t.nextDay}>
            <Icon d={ICONS.next} />
          </button>
          <button type="button" className="icon-btn" onClick={p.onNextEvent} disabled={!p.hasNextEvent} title={t.nextEventDate} aria-label={t.nextEventDate}>
            <Icon d={ICONS.nextEvent} />
          </button>
        </div>
        <label className="speed">
          <span>{t.speed}</span>
          <select value={p.speed} onChange={(e) => p.onSpeed(e.target.value as Speed)}>
            <option value="day">{t.speedDay}</option>
            <option value="week">{t.speedWeek}</option>
            <option value="month">{t.speedMonth}</option>
          </select>
        </label>
        <label className="date-picker">
          <span>{t.chooseDate}</span>
          <input
            type="date"
            min={RANGE_START}
            max={RANGE_END}
            value={p.date}
            onChange={(e) => e.target.value && p.onDate(e.target.value)}
          />
        </label>
      </div>

      <div className="density-wrap" inert={p.disabled}>
        <DensityStrip events={p.events} date={p.date} lang={p.lang} onDate={p.onDate} />
      </div>
      <div className="slider" inert={p.disabled}>
        <input
          type="range"
          min={0}
          max={LAST_DAY}
          step={1}
          value={day}
          onChange={(e) => p.onDate(fromDay(Number(e.target.value)))}
          aria-label={t.timeline}
          aria-valuetext={formatDate(p.date, p.lang)}
        />
        <div className="ticks" aria-hidden="true">
          {ticks.map((tk) => {
            const isYear = tk.month === 0 || tk.day === 0;
            // Skip quarter labels that would collide with the opening "1939" label.
            const quarter = tk.month % 3 === 0 && tk.day > 45;
            return (
              <span key={tk.iso} className={`tick${isYear ? " tick-year" : quarter ? " tick-quarter" : ""}${tk.day === 0 ? " tick-start" : ""}`} style={{ left: pct(tk.day) }}>
                {isYear ? <b>{tk.year}</b> : quarter ? <i>{monthName(tk.iso)}</i> : null}
              </span>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
