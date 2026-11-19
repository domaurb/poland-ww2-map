import type { HistEvent } from "../data/schema";
import { STRINGS, TYPE_LABELS, belligerentLabel, type Lang } from "../i18n";
import { formatDate, formatEventDates } from "../lib/dates";
import { markerSvg } from "./markerIcon";

type Props = { event: HistEvent; lang: Lang; onBack: () => void; onShowOnMap: () => void };

export default function EventDetail({ event: e, lang, onBack, onShowOnMap }: Props) {
  const t = STRINGS[lang];
  return (
    <article className="detail" aria-labelledby="detail-title">
      <div className="detail-nav">
        <button type="button" className="text-btn" onClick={onBack}>
          ← {t.back}
        </button>
        <button type="button" className="text-btn" onClick={onShowOnMap}>
          {t.showOnMap}
        </button>
      </div>

      <header className="detail-head">
        <span className="detail-icon" dangerouslySetInnerHTML={{ __html: markerSvg(e.type, "began", { size: 30 }) }} />
        <div>
          <p className="detail-type">
            {TYPE_LABELS[lang][e.type]}
            {e.significanceRank !== undefined && <span className="rank-pill">{t.significant}</span>}
          </p>
          <h2 id="detail-title" tabIndex={-1}>
            {e.title[lang]}
          </h2>
        </div>
      </header>

      <p className={`verify-flag ${e.verified ? "is-verified" : "is-unverified"}`}>
        <strong>{e.verified ? t.verified : t.unverified}</strong> — {e.verified ? t.verifiedExplain : t.unverifiedExplain}
      </p>

      <dl className="facts">
        <dt>{t.dates}</dt>
        <dd>
          {formatEventDates(e, lang)}
          {e.datePrecision === "approximate" && <span className="muted"> ({t.datePrecisionApprox})</span>}
          {e.datePrecision === "month" && <span className="muted"> ({t.datePrecisionMonth})</span>}
        </dd>
        <dt>{t.location}</dt>
        <dd>
          {e.location.name[lang]} <span className="muted">({t.precision[e.location.precision]})</span>
        </dd>
        {e.belligerents && e.belligerents.length > 0 && (
          <>
            <dt>{t.belligerents}</dt>
            <dd>{e.belligerents.map((b) => belligerentLabel(b, lang)).join(" · ")}</dd>
          </>
        )}
      </dl>

      <section>
        <h3>{t.summary}</h3>
        <p>{e.summary[lang]}</p>
      </section>

      {e.casualties && (
        <section>
          <h3>{t.casualties}</h3>
          <p>{e.casualties[lang]}</p>
        </section>
      )}

      {e.notes && (
        <section className="notes">
          <h3>{t.notes}</h3>
          <p>{e.notes[lang]}</p>
        </section>
      )}

      <section>
        <h3>{t.sources}</h3>
        <ol className="sources">
          {e.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>
              <div className="source-meta">
                <span className={`tier tier-${s.tier}`}>{t.tier(s.tier)}</span> {s.publisher}
                <span className="muted">
                  {" "}
                  · {t.accessed} {formatDate(s.accessed, lang)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
