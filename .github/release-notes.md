Test build of the interactive WWII map of Poland (300 verified events, 1939–1945).

**Downloads**
- `poland-ww2-map.html`: the whole app in one file. Download it and double-click to open it in your browser.
- `poland-ww2-map-site.zip`: the regular website build. Unzip it, then run `start.bat` (Windows) or `start.sh` (macOS/Linux) to serve it locally; it needs Python 3 or Node.js.

Both need an internet connection for the OpenStreetMap base map; the event data is bundled.

**New since v0.2**
- Borders: Poland in 1939 and today, and the General Government.
- Occupation zones, tinted brown (German) and red (Soviet) for the selected date: the 1939–41 partition, full German control from June 1941, and from January 1944 an approximate front built from confirmed capture dates of Polish towns. Areas with no confirmed date are left untinted.
- Timeline density strip above the slider (events per week; click to jump).
- Only verified events are shown; the "Verified events only" filter and the "unverified" markers are gone.
- Polish translation review, accessibility and performance improvements.
