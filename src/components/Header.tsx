import { STRINGS, type Lang } from "../i18n";
import type { Mode, Page } from "../lib/urlState";

type Props = {
  lang: Lang;
  mode: Mode;
  page: Page;
  onLang: () => void;
  onMode: () => void;
  onPage: (p: Page) => void;
};

export default function Header({ lang, mode, page, onLang, onMode, onPage }: Props) {
  const t = STRINGS[lang];
  return (
    <header className="site-header">
      <a className="skip-link" href={page === "about" ? "#main" : "#panel"}>
        {page === "about" ? t.skipToContent : t.skipToPanel}
      </a>
      <div className="brand">
        <h1>{t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
      </div>
      <nav className="header-actions" aria-label={t.appTitle}>
        {page === "map" && (
          <button type="button" className={`btn${mode === "overview" ? " is-active" : ""}`} aria-pressed={mode === "overview"} onClick={onMode}>
            {mode === "overview" ? t.backToTimeline : t.overview}
          </button>
        )}
        <button type="button" className="btn btn-quiet" onClick={() => onPage(page === "about" ? "map" : "about")}>
          {page === "about" ? t.map : t.about}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onLang} lang={lang === "en" ? "pl" : "en"} title={t.language} aria-label={`${t.languageShort} – ${t.language}`}>
          {t.languageShort}
        </button>
      </nav>
    </header>
  );
}
