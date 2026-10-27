#!/usr/bin/env bash
# Casualty Report build (macOS / Linux / Git Bash). Same steps as build.ps1.
set -euo pipefail
cd "$(dirname "$0")"

echo "Running tests..."
node tests/parse.test.js || { echo "Tests failed. Build stopped."; exit 1; }

rm -rf dist
mkdir -p dist/site
cp index.html styles.css icons.js parse.js app.js data.js og-image.png dist/site/

# Stamp updatedAt (dist copy only) and make og:/twitter: URLs absolute from SITE_URL.
node -e '
const fs = require("fs");
const d = "dist/site/data.js";
let data = fs.readFileSync(d, "utf8");
const re = /updatedAt\s*:\s*(""|\x27\x27)/;
if (re.test(data)) {
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  fs.writeFileSync(d, data.replace(re, "updatedAt: \"" + stamp + "\""));
  console.log("Stamped updatedAt = " + stamp);
}
const i = "dist/site/index.html";
let html = fs.readFileSync(i, "utf8");
const m = /var SITE_URL = "([^"]*)"/.exec(html);
if (m && m[1] && !/YOUR-SITE/.test(m[1])) {
  const base = m[1].replace(/\/+$/, "");
  html = html.split("content=\"og-image.png\"").join("content=\"" + base + "/og-image.png\"").split("content=\"./\"").join("content=\"" + base + "/\"");
  fs.writeFileSync(i, html);
} else {
  console.log("Note: SITE_URL in index.html is still the placeholder; link previews use relative URLs.");
}
'

# Zip with index.html at the root.
(
  cd dist/site
  if command -v zip >/dev/null 2>&1; then
    zip -q -r ../casualty-report.zip .
  elif python3 -c "" >/dev/null 2>&1; then
    python3 -m zipfile -c ../casualty-report.zip *
  elif python -c "" >/dev/null 2>&1; then
    python -m zipfile -c ../casualty-report.zip *
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Compress-Archive -Path * -DestinationPath ../casualty-report.zip -Force"
  else
    echo "No zip tool found (zip, python3, python or powershell.exe)."; exit 1
  fi
)

echo
echo "Built dist/site"
echo "Zipped dist/casualty-report.zip"
