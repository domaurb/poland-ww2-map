import { EVENT_TYPES, TYPE_STYLE, type EventType, type Family } from "../data/constants";
import { FAMILY_LABELS, STRINGS, TYPE_LABELS, type Lang } from "../i18n";
import { BORDER_KEYS, type BorderKey } from "../lib/urlState";
import { BORDER_STYLE } from "./borderStyle";
import { markerSvg } from "./markerIcon";

type Props = {
  lang: Lang;
  types: Set<EventType>;
  counts: Partial<Record<EventType, number>>;
  onTypes: (types: Set<EventType>) => void;
  borders: Set<BorderKey>;
  onBorders: (b: Set<BorderKey>) => void;
};

const FAMILIES: Family[] = ["military", "civilian", "resistance", "other"];

export default function LegendFilters({ lang, types, counts, onTypes, borders, onBorders }: Props) {
  const t = STRINGS[lang];
  const toggle = (type: EventType) => {
    const next = new Set(types);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    onTypes(next);
  };
  return (
    <details className="legend" open>
      <summary>{t.legendAndFilters}</summary>
      <div className="legend-actions">
        <button type="button" className="text-btn" onClick={() => onTypes(new Set(EVENT_TYPES))}>
          {t.showAll}
        </button>
        <button type="button" className="text-btn" onClick={() => onTypes(new Set())}>
          {t.showNone}
        </button>
      </div>
      {FAMILIES.map((fam) => (
        <fieldset key={fam} className="legend-family">
          <legend>{FAMILY_LABELS[lang][fam]}</legend>
          {EVENT_TYPES.filter((ty) => TYPE_STYLE[ty].family === fam).map((ty) => (
            <label key={ty} className="legend-item">
              <input type="checkbox" checked={types.has(ty)} onChange={() => toggle(ty)} />
              <span className="legend-icon" dangerouslySetInnerHTML={{ __html: markerSvg(ty, "began", { size: 20 }) }} />
              <span>{TYPE_LABELS[lang][ty]}</span>
              <span className="legend-count">{counts[ty] ?? 0}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <fieldset className="legend-family">
        <legend>{t.borders}</legend>
        {BORDER_KEYS.map((b) => {
          const st = BORDER_STYLE[b];
          return (
            <label key={b} className="legend-item">
              <input
                type="checkbox"
                checked={borders.has(b)}
                onChange={() => {
                  const next = new Set(borders);
                  if (next.has(b)) next.delete(b);
                  else next.add(b);
                  onBorders(next);
                }}
              />
              {st.fill ? (
                <svg className="legend-line" width="28" height="14" aria-hidden="true">
                  <rect x="2" y="2" width="24" height="10" rx="2" fill={st.fillColor ?? st.color} fillOpacity={st.fill * 2} stroke={st.color} strokeWidth={1.6} strokeDasharray={st.dashArray} />
                </svg>
              ) : (
                <svg className="legend-line" width="28" height="14" aria-hidden="true">
                  <line x1="2" y1="7" x2="26" y2="7" stroke={st.color} strokeWidth={st.weight} strokeDasharray={st.dashArray} strokeLinecap="round" />
                </svg>
              )}
              <span>{t.borderLabels[b]}</span>
            </label>
          );
        })}
        <p className="legend-note">{t.bordersNote}</p>
      </fieldset>
      <ul className="legend-key" aria-label={t.legendAndFilters}>
        <li>
          <span dangerouslySetInnerHTML={{ __html: markerSvg("battle", "began", { size: 20 }) }} /> {t.markerBegan}
        </li>
        <li>
          <span dangerouslySetInnerHTML={{ __html: markerSvg("battle", "ongoing", { size: 18 }) }} /> {t.markerOngoing}
        </li>
      </ul>
    </details>
  );
}
