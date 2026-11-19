import type { EventIndex } from "../data/schema";
import { STRINGS, TYPE_LABELS, type Lang } from "../i18n";
import { formatEventDates } from "../lib/dates";
import { markerSvg, type MarkerVariant } from "./markerIcon";

type Props = {
  events: EventIndex[];
  lang: Lang;
  variant: MarkerVariant;
  selectedId: string | null;
  onOpen: (id: string) => void;
};

export default function EventList({ events, lang, variant, selectedId, onOpen }: Props) {
  const t = STRINGS[lang];
  return (
    <ul className="event-list">
      {events.map((e) => (
        <li key={e.id}>
          <button type="button" className={`event-item${e.id === selectedId ? " is-selected" : ""}`} onClick={() => onOpen(e.id)}>
            <span className="event-icon" dangerouslySetInnerHTML={{ __html: markerSvg(e.type, variant, { unverified: !e.verified, size: 24 }) }} />
            <span className="event-text">
              <span className="event-title">{e.title[lang]}</span>
              <span className="event-meta">
                {TYPE_LABELS[lang][e.type]} · {formatEventDates(e, lang)} · {e.location.name[lang]}
                {!e.verified && <span className="unverified-tag"> · {t.unverified}</span>}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
