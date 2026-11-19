#!/bin/sh
# Serves this folder at http://localhost:8000 and opens it in the browser.
cd "$(dirname "$0")"
URL="http://localhost:8000/"
( sleep 1; (command -v xdg-open >/dev/null && xdg-open "$URL") || (command -v open >/dev/null && open "$URL") ) >/dev/null 2>&1 &
if command -v python3 >/dev/null; then exec python3 -m http.server 8000
elif command -v npx >/dev/null; then exec npx --yes serve -l 8000 .
else echo "Python 3 or Node.js is needed. Or just open index.html directly."; fi
