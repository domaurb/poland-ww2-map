import { useMemo, useState } from "react";
import type { EventIndex } from "../data/schema";
import { STRINGS, type Lang } from "../i18n";
import { addDays, formatDate, fromDay, LAST_DAY, toDay } from "../lib/dates";

type Props = { events: EventIndex[]; date: string; lang: Lang; onDate: (iso: string) => void };

const WEEK = 7;
const H = 26; // px, chart height
const MIN_BAR = 2; // px, so a single event stays visible

/**
 * A single-series column strip: how many events (in the current filter) begin in each week.
 * Aligned with the slider track below it; hover shows the week and count, click jumps there.
 */
export default function DensityStrip({ events, date, lang, onDate }: Props) {
  const t = STRINGS[lang];
  const bins = useMemo(() => {
    const n = Math.floor(LAST_DAY / WEEK) + 1;
    const counts = new Array<number>(n).fill(0);
    const first = new Array<string | null>(n).fill(null);
    for (const e of events) {
      const d = toDay(e.startDate);
      if (d < 0 || d > LAST_DAY) continue;
      const b = Math.floor(d / WEEK);
      counts[b]++;
      if (!first[b] || e.startDate < first[b]!) first[b] = e.startDate;
    }
    return { counts, first, max: Math.max(1, ...counts) };
  }, [events]);
  const [hover, setHover] = useState<number | null>(null);
  const n = bins.counts.length;
  const current = Math.floor(toDay(date) / WEEK);
  const peak = bins.counts.indexOf(bins.max);
  const weekStart = (b: number) => fromDay(b * WEEK);
  const summary = t.densitySummary(formatDate(weekStart(peak), lang), bins.max);

  const binAt = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * n)));
  };
  const hb = hover ?? -1;
  return (
    <div className="density" onMouseLeave={() => setHover(null)}>
      <svg
        className="density-svg"
        viewBox={`0 0 ${n} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${t.densityLabel}. ${summary}`}
        onMouseMove={(e) => setHover(binAt(e.clientX, e.currentTarget))}
        onClick={(e) => {
          const b = binAt(e.clientX, e.currentTarget);
          onDate(bins.first[b] ?? weekStart(b));
        }}
      >
        {bins.counts.map((c, b) =>
          c ? (
            <rect
              key={b}
              x={b + 0.12}
              width={0.76}
              y={H - Math.max(MIN_BAR, (c / bins.max) * H)}
              height={Math.max(MIN_BAR, (c / bins.max) * H)}
              className={b === current ? "density-bar is-current" : b === hb ? "density-bar is-hover" : "density-bar"}
            />
          ) : null,
        )}
      </svg>
      {hover !== null && (
        <div
          className={`density-tip${hover / n < 0.15 ? " is-start" : hover / n > 0.85 ? " is-end" : ""}`}
          style={{ left: `${((hover + 0.5) / n) * 100}%` }}
          aria-hidden="true"
        >
          {t.densityTip(formatDate(weekStart(hover), lang), formatDate(addDays(weekStart(hover), WEEK - 1), lang), bins.counts[hover])}
        </div>
      )}
    </div>
  );
}
