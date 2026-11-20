# Poland 1939–1945 — an interactive map

A static, bilingual (English/Polish) web map of significant Second World War events on Polish lands, explorable day
by day from 1 September 1939 to 8 May 1945. It contains **300 events**, each checked against at least one Polish
institutional source, and a view of the **most significant events** – a selection of 100, shown in date order.

## Try it

- **Online:** https://domaurb.github.io/poland-ww2-map/ (redeployed on every push to `main`).
- **Download:** see [Releases](https://github.com/domaurb/poland-ww2-map/releases).
  - `poland-ww2-map.html` is the whole app in one file: download it and double-click it.
  - `poland-ww2-map-site.zip` is the regular site; run its `start.bat` / `start.sh` to serve it locally (Python 3 or Node.js needed).

Both need an internet connection for the OpenStreetMap base map; the event data is bundled.

## What the map does

- **Timeline:** date picker, a slider across the whole war, play/pause at three speeds, previous/next day and
  previous/next date on which an event began. Above the slider, a **density strip** shows how many events begin in
  each week (hover for the count, click to jump there).
- **Markers:** colour by family (military, crimes and repression, resistance, other), a glyph per event type, filled
  for events beginning on the selected day and outlined for ongoing ones; clustered where they overlap.
- **Neighbouring states:** the land borders between Poland's neighbours on 31 August 1939, drawn lighter than
  Poland's; on the selected date the **German Reich is tinted green and the Soviet Union red** within their borders
  that day (OpenHistoricalMap; Bessarabia and Northern Bukovina are counted as Romanian until 28 June 1940, which
  OpenHistoricalMap's Soviet boundary gets wrong). From 22 June 1941, Soviet land held by Germany or Romania is
  **green**, approximated like the 1944 front in Poland from the occupation and liberation dates of about 90 towns
  (`scripts/soviet-occupation-anchors.json`: Yad Vashem community histories, the Belarusian Encyclopedia, Ukrainian
  academic encyclopedias, the USHMM, and for a few Russian cities the Great Russian Encyclopedia as quoted in search
  results). Each place takes the dates of its nearest anchor town within 150 km; Moscow and Leningrad are fixed as never
  taken, and Courland stays German until the surrender. Estonia follows the Estonian Institute of Historical
  Memory (Tallinn, Narva, and the western islands, where fighting lasted until the end of November 1944). Areas held by Finland, and short changes of hands such as
  Kharkov's in February–March 1943, are not shown.
  From 12 January 1945, German territory taken by the Red Army turns **red** on the capture date of its nearest
  anchor town within 100 km (`scripts/reich-capture-anchors.json`: dzieje.pl, the IPN map of Upper Silesia in 1945,
  Przystanek Historia on Lower Silesia, T. Ginter's maps in an IPN exhibition for Warmia, Masuria and the Vistula
  Lagoon, the Polish Army Museum for the Pomeranian Wall, the USHMM for Vienna, the Imperial War Museum for Insterburg). Wrocław, the
  Vistula delta and the Vistula Spit are pockets that held out longer; the Lower Silesian mountains south of the front
  that stabilised in February stay German to the end. German land taken by the **Western Allies** turns **purple**
  the same way, from Aachen in October 1944 (USHMM articles on the US divisions and the camps they liberated;
  dzieje.pl for the Polish 1st Armoured Division and the capitulation in north-west Germany). Mecklenburg and parts
  of Brandenburg and Saxony have no dated towns and stay green until the end.
  **Western Europe** is green from its occupation (Denmark and Norway 9 April 1940, the Netherlands, Belgium and
  Luxembourg 10 May, France's occupied zone 22 June 1940 and the Vichy zone 11 November 1942; USHMM) and purple from its
  liberation, taken from the nearest dated town (`scripts/west-occupation-anchors.json`: USHMM, CegeSoma, dzieje.pl,
  and Chemins de mémoire as quoted in search results). The 1940–42 demarcation line in France is approximated from
  towns on each side; Norway and the Atlantic and Dunkirk pockets stay German until the end. Annexed Alsace-Lorraine
  and Luxembourg follow the German-territory file.
- **Borders and occupation zones:** Poland on 31 August 1939 and present-day Poland as lines; on the selected date,
  the part of 1939 Poland under **German control is tinted green** (dotted green line: the General Government) and
  the part under **Soviet control is tinted red** (dashed red line: the Soviet zone's edge). The zones follow the
  partition from 6 October 1939, Wilno's Lithuanian interlude, and full German control from 22 June 1941 until
  Soviet forces re-entered pre-war Poland on 3–4 January 1944. From then until 8 May 1945 there is no open data on
  the front lines, so control is **approximated** from the documented capture dates of about 80 towns
  (`scripts/front-anchors.json`, each with its source): every place takes the date of its nearest anchor town, with
  pockets for the Vistula bridgeheads, the Poznań fortress and the Hel Peninsula. Edges are therefore rough, and
  places that held out longer than their surroundings (e.g. Grudziądz) or fell earlier (e.g. Kołomyja in March 1944)
  are not shown separately. Dates come from Polish institutional sources (IPN, Przystanek Historia, dzieje.pl)
  wherever they give one; for Polesie, the Nowogródek region, Kowel, Brześć and Stanisławów, where none does, they
  come from Yad Vashem's community histories, the USHMM Holocaust Encyclopedia and, for Antopol, the
  Belarusian Encyclopedia (marked `tier: 3`).
  Each layer can be switched off.
- **Most significant events:** a selection of 100 events, listed in date order without numbers. How it was chosen is
  explained on the About page and in `docs/most-significant-events.md`.
- **Event details:** dates and their precision, location and its precision, parties involved, summary, casualty
  figures (with differing figures noted), notes and uncertainties, and the sources with their tier.
- **Filters:** by event type. Every view is a **shareable URL**
  (e.g. `?date=1944-08-01&lang=pl&event=warsaw-uprising-1944`).
- **Accessible:** keyboard-operable, skip links, live date announcements, labelled controls, colour never the only
  cue, respects "reduce motion"; checked with axe (no violations on the main views). On phones the panel becomes a
  bottom sheet.

## Development

```bash
npm install
npm run dev             # local dev server
npm run validate        # check all event data (schema, dates, coordinates, sources, the 1–100 selection)
npm test                # unit tests
npm run lint            # oxlint
npm run build           # static build in dist/
npm run build:portable  # single self-contained HTML file in dist-portable/
```

Stack: Vite, React, TypeScript, react-leaflet with marker clustering; zod for data validation (build-time only).
The first page load contains only a slim index of the events; full texts are loaded per year when an event or the
About page is opened, and the border geometry is loaded when a border layer is shown.

## Data

| Path | What it is |
|---|---|
| `src/data/events/<year>.json` | Events, one file per start year, validated against `src/data/schema.ts` |
| `src/data/places.json` → `src/data/gazetteer.json` | Place lookups; `npm run geocode` resolves new places with OpenStreetMap Nominatim (1 request/s) and copies coordinates into the events |
| `src/data/exceptions.json` | Documented exceptions, e.g. events outside the map area (Katyń) |
| `src/data/borders.json` | Border lines from OpenHistoricalMap, rebuilt with `python3 scripts/build-borders.py` (needs `shapely`) |
| `scripts/significant-events.py` | The selection of most significant events; `--apply` writes `significanceRank` into the events |

### Adding or correcting an event

1. Add or edit the event in the file for its start year (see the schema for every field; both `en` and `pl` texts
   are required).
2. Cite at least one source you actually opened. Only verified events are published: each needs `verified: true` and
   at least one tier-1 or tier-2 source confirming it (the validator rejects anything else).
3. For a new place, add an entry to `places.json` and run `npm run geocode`.
4. Run `npm run validate` and `npm test`.

### Source policy

Polish state institutions are preferred: **tier 1** – IPN and its portals, the Pilecki Institute, the Museum of the
Second World War, the Warsaw Rising Museum, the Auschwitz-Birkenau Museum, the Jewish Historical Institute, the
Polish Army Museum and others; **tier 2** – Polish academic institutions and dzieje.pl; **tier 3** – USHMM,
Yad Vashem, IWM. Wikipedia is not cited. Summaries are in our own words; casualty figures appear only as a cited
source gives them, with differing figures recorded.

Found a mistake? [Report a correction](https://github.com/domaurb/poland-ww2-map/issues/new).

## Deployment

- `.github/workflows/pages.yml` lints, validates, tests and deploys `main` to GitHub Pages.
- `.github/workflows/ci.yml` runs the same checks on pull requests and other branches.
- `.github/workflows/release.yml` builds the two downloads and publishes a GitHub Release, either when a `v*` tag is
  pushed or when run manually from the Actions tab with a tag name.

## Licences and credits

- Code: MIT (`LICENSE`). Event data: CC BY 4.0. Gazetteer: ODbL. Borders: CC0 (see `src/data/LICENSE.md`).
- Base map © OpenStreetMap contributors; borders © OpenHistoricalMap contributors (CC0).
- The event data was compiled with the assistance of an AI system and reviewed in stages; it may contain errors.
