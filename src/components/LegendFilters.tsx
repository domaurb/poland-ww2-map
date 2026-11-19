import { EVENT_TYPES, TYPE_STYLE, type EventType, type Family } from "../data/constants";
import { FAMILY_LABELS, STRINGS, TYPE_LABELS, type Lang } from "../i18n";
import { markerSvg } from "./markerIcon";

type Props = {
  lang: Lang;
  types: Set<EventType>;
  verifiedOnly: boolean;
  counts: Partial<Record<EventType, number>>;
  onTypes: (types: Set<EventType>) => void;
  onVerifiedOnly: (v: boolean) => void;
};

const FAMILIES: Family[] = ["military", "civilian", "resistance", "other"];

export default function LegendFilters({ lang, types, verifiedOnly, counts, onTypes, onVerifiedOnly }: Props) {
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
      <label className="legend-item verified-toggle">
        <input type="checkbox" checked={verifiedOnly} onChange={(e) => onVerifiedOnly(e.target.checked)} />
        <span>{t.verifiedOnly}</span>
      </label>
      <ul className="legend-key" aria-label={t.legendAndFilters}>
        <li>
          <span dangerouslySetInnerHTML={{ __html: markerSvg("battle", "began", { size: 20 }) }} /> {t.markerBegan}
        </li>
        <li>
          <span dangerouslySetInnerHTML={{ __html: markerSvg("battle", "ongoing", { size: 18 }) }} /> {t.markerOngoing}
        </li>
        <li>
          <span dangerouslySetInnerHTML={{ __html: markerSvg("battle", "began", { size: 20, unverified: true }) }} /> {t.markerUnverified}
        </li>
      </ul>
    </details>
  );
}
