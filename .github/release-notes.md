Test build of the interactive WWII map of Poland (300 verified events, 1939–1945).

**Downloads**
- `poland-ww2-map.html`: the whole app in one file. Download it and double-click to open it in your browser.
- `poland-ww2-map-site.zip`: the regular website build. Unzip it, then run `start.bat` (Windows) or `start.sh` (macOS/Linux) to serve it locally; it needs Python 3 or Node.js.

Both need an internet connection for the OpenStreetMap base map; the event data is bundled.

**New since v0.3.2**
- Fixed areas wrongly shown as German-held at the end of the war: Klaipėda, eastern Masuria (Biała Piska, Ełk, Gołdap), the Piła–Krajenka area and parts of Lower Silesia now turn red on their capture dates (IPN maps by T. Ginter, Polish Army Museum, IPN Review, Przystanek Historia).
- Courland (Liepāja, Ventspils), the Hel Peninsula, Żuławy, the Vistula Spit and the Lower Silesian mountains correctly stay German until the capitulation.

**Earlier (v0.3.2)**
- Western Europe: Denmark, Norway, the Netherlands, Belgium, Luxembourg and France are green while German-occupied (from April–June 1940; the Vichy zone from November 1942) and purple once liberated by the Western Allies.
- German land taken by the Western Allies in 1944–45 is shown in purple (new legend switch); land taken by the Red Army stays red.
- The Soviet tint no longer stops at a hard edge when the map is fully zoomed out on a large screen.
- Every anchor town, date and source is listed in the `scripts/*-anchors.json` files.

**Earlier (v0.3.1)**
- German control is now shown in green (instead of brown), so it stands out from the Soviet red; checked for red–green colour blindness.
- Poland's neighbours on 31 August 1939 are drawn (lighter lines), and the German Reich and the Soviet Union are tinted within their borders on the selected date.
- Soviet land held by Germany or Romania in 1941–44 turns green, and German land taken by the Red Army in 1945 turns red, both approximated from documented occupation and capture dates of nearby towns.
- The 1944 front in eastern Poland is now fully tinted, using dated towns in Polesie, the Nowogródek region, Kowel, Brześć, Stanisławów and Antopol.
- Every anchor town, date and source is listed in `scripts/front-anchors.json`, `scripts/soviet-occupation-anchors.json` and `scripts/reich-capture-anchors.json`.
