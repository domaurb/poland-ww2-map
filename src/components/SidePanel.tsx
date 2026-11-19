import type { ReactNode } from "react";
import type { HistEvent } from "../data/schema";
import { STRINGS, type Lang } from "../i18n";
import { formatDate } from "../lib/dates";
import type { Mode } from "../lib/urlState";
import EventDetail from "./EventDetail";
import EventList from "./EventList";

type Props = {
  lang: Lang;
  mode: Mode;
  date: string;
  began: HistEvent[];
  ongoing: HistEvent[];
  ranked: HistEvent[];
  selected: HistEvent | null;
  selectedId: string | null;
  expanded: boolean;
  hasNextEvent: boolean;
  legend: ReactNode;
  onOpen: (id: string) => void;
  onBack: () => void;
  onShowOnMap: () => void;
  onNextEvent: () => void;
  onToggleExpanded: () => void;
};

export default function SidePanel(p: Props) {
  const t = STRINGS[p.lang];
  const total = p.mode === "overview" ? p.ranked.length : p.began.length + p.ongoing.length;
  const heading = p.mode === "overview" ? t.overviewOn : formatDate(p.date, p.lang);

  return (
    <aside id="panel" className={`panel${p.expanded ? " is-expanded" : ""}`} aria-label={heading}>
      <button type="button" className="sheet-handle" onClick={p.onToggleExpanded} aria-expanded={p.expanded} aria-controls="panel-body">
        <span className="sheet-grip" aria-hidden="true" />
        <span>
          {p.selected ? p.selected.title[p.lang] : heading} · {t.eventsCount(total)}
        </span>
      </button>
      <div id="panel-body" className="panel-body">
        {p.selected ? (
          <EventDetail event={p.selected} lang={p.lang} onBack={p.onBack} onShowOnMap={p.onShowOnMap} />
        ) : p.mode === "overview" ? (
          <section>
            <h2 className="panel-heading">{t.rankedList}</h2>
            {p.ranked.length ? (
              <EventList events={p.ranked} lang={p.lang} variant="began" selectedId={p.selectedId} onOpen={p.onOpen} />
            ) : (
              <p className="empty">{t.noRanking}</p>
            )}
          </section>
        ) : (
          <>
            <h2 className="panel-heading">
              {heading} <span className="muted">· {t.eventsCount(total)}</span>
            </h2>
            {p.began.length > 0 && (
              <section>
                <h3 className="list-heading">{t.beganToday}</h3>
                <EventList events={p.began} lang={p.lang} variant="began" selectedId={p.selectedId} onOpen={p.onOpen} />
              </section>
            )}
            {p.ongoing.length > 0 && (
              <section>
                <h3 className="list-heading">{t.ongoing}</h3>
                <EventList events={p.ongoing} lang={p.lang} variant="ongoing" selectedId={p.selectedId} onOpen={p.onOpen} />
              </section>
            )}
            {total === 0 && (
              <div className="empty">
                <p>{t.noEventsOnDate}</p>
                {p.hasNextEvent && (
                  <button type="button" className="text-btn" onClick={p.onNextEvent}>
                    {t.goToNext} →
                  </button>
                )}
              </div>
            )}
          </>
        )}
        {!p.selected && p.legend}
      </div>
    </aside>
  );
}
