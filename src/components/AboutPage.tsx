import { useMemo } from "react";
import { CORRECTIONS_URL } from "../config";
import { ALL_EVENTS } from "../data/loadEvents";
import type { Lang } from "../i18n";

type Institution = { publisher: string; tier: number; host: string; citations: number };

function useInstitutions(): Institution[] {
  return useMemo(() => {
    const map = new Map<string, Institution>();
    for (const e of ALL_EVENTS)
      for (const s of e.sources) {
        const key = `${s.publisher}|${s.tier}`;
        const host = new URL(s.url).host;
        const cur = map.get(key);
        if (cur) cur.citations++;
        else map.set(key, { publisher: s.publisher, tier: s.tier, host, citations: 1 });
      }
    return [...map.values()].sort((a, b) => a.tier - b.tier || b.citations - a.citations || a.publisher.localeCompare(b.publisher));
  }, []);
}

const TEXT = {
  en: {
    title: "About this map & its sources",
    intro:
      "This map presents significant battles, crimes, acts of resistance and other events of the Second World War that took place on Polish lands between 1 September 1939 and 8 May 1945. Use the timeline to explore day by day, or open “Most significant events” to see a selection of 100 events at once. That selection is listed in date order and is not a ranking: events were chosen for the scale of human loss, their consequences for the course of the war and the Polish state, their place in Polish, Jewish and international memory, and so that every year and every major group of victims is represented.",
    geoTitle: "What counts as “Poland” here",
    geo: "The map covers the union of Polish territory as of 31 August 1939 (including Lwów, Wilno and Grodno) and present-day Poland (including areas that were German in 1939, such as Gdańsk/Danzig, Wrocław/Breslau and Szczecin/Stettin). Place names are given in Polish, with the historical German name or the present-day name in parentheses where relevant. A small number of events outside this area are included as documented exceptions — for example the Katyń massacre, whose victims were Polish prisoners of war.",
    policyTitle: "Source policy",
    policy:
      "Every event cites at least one source that was actually opened and read when the entry was compiled. Polish state institutions are preferred. Wikipedia is not cited. Summaries are written in our own words; casualty figures are given only as stated by a cited source, with differing figures noted.",
    tiers: [
      ["Tier 1", "Polish state institutions — e.g. the Institute of National Remembrance (IPN) and its portals, the Pilecki Institute, the Museum of the Second World War in Gdańsk, the Warsaw Rising Museum, the Auschwitz-Birkenau State Museum, the Jewish Historical Institute, the Polish Army Museum, the Katyń Museum, the State Archives."],
      ["Tier 2", "Polish academic and other established institutions — e.g. the Polish Academy of Sciences, Polish universities, dzieje.pl (Museum of Polish History / PAP)."],
      ["Tier 3", "Reputable international institutions — e.g. USHMM, Yad Vashem, Imperial War Museums — used to fill gaps or note differing figures."],
    ],
    verifyTitle: "Verified and unverified events",
    verify:
      "An event is marked verified only if its facts were checked against at least one tier-1 or tier-2 source. Unverified events carry a “?” badge on the map and a notice in their description; you can hide them with the “Verified events only” filter.",
    instTitle: "Institutions cited",
    instCols: ["Institution", "Tier", "Citations"],
    aiTitle: "How this data was compiled",
    ai: "The event data was compiled with the assistance of an AI system working from the sources listed for each event, and reviewed in stages by the project's author. Despite these checks it may contain errors in dates, locations, figures or wording.",
    correctionsWith: "If you spot a mistake, please report it:",
    correctionsLink: "open a correction request on GitHub",
    correctionsWithout: "A public link for reporting corrections will be added when the project's repository is published.",
    creditsTitle: "Map data & licences",
    credits: [
      "Base map: © OpenStreetMap contributors (standard tile layer, displayed in muted tones).",
      "Event coordinates: looked up with OpenStreetMap Nominatim (© OpenStreetMap contributors, ODbL); each lookup is recorded in the project's gazetteer file.",
      "Code: MIT licence. Event data: Creative Commons Attribution 4.0 (CC BY 4.0). Quoted institutions retain the rights to their own publications.",
    ],
  },
  pl: {
    title: "O mapie i jej źródłach",
    intro:
      "Mapa przedstawia najważniejsze bitwy, zbrodnie, akty oporu i inne wydarzenia II wojny światowej, które rozegrały się na ziemiach polskich od 1 września 1939 r. do 8 maja 1945 r. Oś czasu pozwala przeglądać je dzień po dniu, a widok „Najważniejsze wydarzenia” pokazuje od razu wybór 100 wydarzeń. Wybór ten jest uporządkowany chronologicznie i nie stanowi rankingu: o włączeniu wydarzenia decydowały skala strat ludzkich, jego konsekwencje dla przebiegu wojny i losów państwa polskiego, miejsce w pamięci polskiej, żydowskiej i międzynarodowej, a także to, by reprezentowany był każdy rok wojny i każda większa grupa ofiar.",
    geoTitle: "Co rozumiemy przez „Polskę”",
    geo: "Mapa obejmuje sumę terytorium Polski według stanu na 31 sierpnia 1939 r. (w tym Lwów, Wilno i Grodno) oraz obszaru dzisiejszej Polski (w tym terenów należących w 1939 r. do Niemiec lub Wolnego Miasta Gdańska, np. Gdańska, Wrocławia i Szczecina). Nazwy miejscowości podajemy po polsku, w nawiasie – tam, gdzie to istotne – nazwę historyczną niemiecką lub obecną. Nieliczne wydarzenia spoza tego obszaru uwzględniono jako udokumentowane wyjątki – np. zbrodnię katyńską, której ofiarami byli polscy jeńcy wojenni.",
    policyTitle: "Zasady doboru źródeł",
    policy:
      "Każde wydarzenie ma co najmniej jedno źródło, które zostało faktycznie otwarte i przeczytane przy opracowywaniu wpisu. Pierwszeństwo mają polskie instytucje państwowe. Nie powołujemy się na Wikipedię. Opisy są sformułowane własnymi słowami; liczby ofiar podajemy wyłącznie za cytowanym źródłem, a rozbieżne dane odnotowujemy.",
    tiers: [
      ["Kategoria 1", "Polskie instytucje państwowe – m.in. Instytut Pamięci Narodowej i jego portale, Instytut Pileckiego, Muzeum II Wojny Światowej w Gdańsku, Muzeum Powstania Warszawskiego, Państwowe Muzeum Auschwitz-Birkenau, Żydowski Instytut Historyczny, Muzeum Wojska Polskiego, Muzeum Katyńskie, archiwa państwowe."],
      ["Kategoria 2", "Polskie instytucje naukowe i inne uznane instytucje – m.in. Polska Akademia Nauk, polskie uczelnie, dzieje.pl (Muzeum Historii Polski / PAP)."],
      ["Kategoria 3", "Renomowane instytucje międzynarodowe – m.in. USHMM, Yad Vashem, Imperial War Museums – wykorzystywane do uzupełniania luk lub odnotowania rozbieżnych danych."],
    ],
    verifyTitle: "Wydarzenia zweryfikowane i niezweryfikowane",
    verify:
      "Wydarzenie oznaczamy jako zweryfikowane tylko wtedy, gdy jego fakty sprawdzono w co najmniej jednym źródle 1. lub 2. kategorii. Wydarzenia niezweryfikowane mają na mapie znaczek „?” i stosowną informację w opisie; filtr „Tylko zweryfikowane” pozwala je ukryć.",
    instTitle: "Cytowane instytucje",
    instCols: ["Instytucja", "Kategoria", "Cytowania"],
    aiTitle: "Jak opracowano dane",
    ai: "Dane o wydarzeniach opracowano z pomocą systemu sztucznej inteligencji na podstawie źródeł wskazanych przy każdym wydarzeniu, a autor projektu sprawdzał je etapami. Mimo tych kontroli mogą zawierać błędy w datach, lokalizacjach, liczbach lub sformułowaniach.",
    correctionsWith: "Jeśli zauważysz błąd, zgłoś go:",
    correctionsLink: "otwórz zgłoszenie poprawki na GitHubie",
    correctionsWithout: "Publiczny link do zgłaszania poprawek zostanie dodany po opublikowaniu repozytorium projektu.",
    creditsTitle: "Dane mapy i licencje",
    credits: [
      "Mapa podkładowa: © współtwórcy OpenStreetMap (standardowa warstwa kafelków, w stonowanych barwach).",
      "Współrzędne wydarzeń: ustalone za pomocą OpenStreetMap Nominatim (© współtwórcy OpenStreetMap, ODbL); każde wyszukiwanie zapisano w pliku gazetera projektu.",
      "Kod: licencja MIT. Dane o wydarzeniach: Creative Commons Uznanie autorstwa 4.0 (CC BY 4.0). Prawa do własnych publikacji zachowują cytowane instytucje.",
    ],
  },
} as const;

export default function AboutPage({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const institutions = useInstitutions();
  return (
    <main className="about" id="main">
      <article>
        <h2>{t.title}</h2>
        <p className="lede">{t.intro}</p>

        <h3>{t.geoTitle}</h3>
        <p>{t.geo}</p>

        <h3>{t.policyTitle}</h3>
        <p>{t.policy}</p>
        <dl className="tiers">
          {t.tiers.map(([name, desc]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>

        <h3>{t.verifyTitle}</h3>
        <p>{t.verify}</p>

        <h3>{t.instTitle}</h3>
        <table className="institutions">
          <thead>
            <tr>
              {t.instCols.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {institutions.map((i) => (
              <tr key={i.publisher + i.tier}>
                <td>
                  {i.publisher} <span className="muted">({i.host})</span>
                </td>
                <td>
                  <span className={`tier tier-${i.tier}`}>{i.tier}</span>
                </td>
                <td className="num">{i.citations}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>{t.aiTitle}</h3>
        <p>{t.ai}</p>
        <p>
          {CORRECTIONS_URL ? (
            <>
              {t.correctionsWith}{" "}
              <a href={CORRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                {t.correctionsLink}
              </a>
              .
            </>
          ) : (
            t.correctionsWithout
          )}
        </p>

        <h3>{t.creditsTitle}</h3>
        <ul>
          {t.credits.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </article>
    </main>
  );
}
