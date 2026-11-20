Test build of the interactive WWII map of Poland (300 verified events, 1939–1945).

**Downloads**
- `poland-ww2-map.html`: the whole app in one file. Download it and double-click to open it in your browser.
- `poland-ww2-map-site.zip`: the regular website build. Unzip it, then run `start.bat` (Windows) or `start.sh` (macOS/Linux) to serve it locally; it needs Python 3 or Node.js.

Both need an internet connection for the OpenStreetMap base map; the event data is bundled.

**New since v0.3.0**
- German control is now shown in green (instead of brown), so it stands out from the Soviet red; checked for red–green colour blindness.
- Poland's neighbours on 31 August 1939 are drawn (lighter lines), and the German Reich and the Soviet Union are tinted within their borders on the selected date.
- Soviet land held by Germany or Romania in 1941–44 turns green, and German land taken by the Red Army in 1945 turns red, both approximated from documented occupation and capture dates of nearby towns.
- The 1944 front in eastern Poland is now fully tinted, using dated towns in Polesie, the Nowogródek region, Kowel, Brześć, Stanisławów and Antopol.
- Every anchor town, date and source is listed in `scripts/front-anchors.json`, `scripts/soviet-occupation-anchors.json` and `scripts/reich-capture-anchors.json`.
