@echo off
rem Serves this folder at http://localhost:8000 and opens it in the browser.
cd /d "%~dp0"
start "" http://localhost:8000/
where py >nul 2>nul && (py -3 -m http.server 8000 & goto :eof)
where python >nul 2>nul && (python -m http.server 8000 & goto :eof)
where npx >nul 2>nul && (npx --yes serve -l 8000 . & goto :eof)
echo Python 3 or Node.js is needed. Or just open index.html directly.
pause
