# Poland 1939–1945 — an interactive map

A static, bilingual (English/Polish) web map of significant Second World War events on Polish lands,
explorable day by day from 1 September 1939 to 8 May 1945, with an Overview of the 100 most significant events.

**Status:** test build. Data phases 2a–2d are done (190 events, 1939–1944, all checked against Polish institutional
sources). Still to come: the 1945 batch, the top-100 Overview ranking, historical borders and the density strip.

## Try it

- **Online:** https://domaurb.github.io/poland-ww2-map/ (redeployed on every push to `main`).
- **Download:** see [Releases](https://github.com/domaurb/poland-ww2-map/releases).
  - `poland-ww2-map.html` is the whole app in one file: download it and double-click it.
  - `poland-ww2-map-site.zip` is the regular site; run its `start.bat` / `start.sh` to serve it locally (Python 3 or Node.js needed).

Both need an internet connection for the OpenStreetMap base map; the event data is bundled.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run validate   # check all event data (add --final once ranks 1–100 are assigned)
npm test           # unit tests
npm run build      # static build in dist/
npm run build:portable  # single self-contained HTML file in dist-portable/
```

## Releases

Pushing a tag such as `v0.2.0` runs `.github/workflows/release.yml`, which builds both downloads and attaches them
to a GitHub Release. `.github/workflows/pages.yml` validates, tests and deploys the site to GitHub Pages.

## Data

- `src/data/events/<year>.json` — events, one file per start year, validated against `src/data/schema.ts`.
- `src/data/places.json` → `npm run geocode` → `src/data/gazetteer.json` — every event coordinate comes from a
  recorded OpenStreetMap Nominatim lookup and is copied into the events by the script.
- `src/data/exceptions.json` — documented exceptions (e.g. events outside the Poland bounding box).

Code: MIT (see `LICENSE`). Data: CC BY 4.0, gazetteer ODbL (see `src/data/LICENSE.md`).
