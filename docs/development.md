# Development

Plain HTML, CSS and vanilla JS: no framework, no bundler, no runtime dependencies. The only external request is Google Fonts. The page uses classic `<script>` tags so it works opened straight from disk (`file://`), on 99helpers, and inside an itch.io iframe.

## Previewing locally

Open `index.html` in a browser. No server needed.

## Building

```powershell
.\build.ps1
```

(macOS, Linux or Git Bash: `./build.sh`.) The build:

1. runs the tests and stops if they fail;
2. copies the site files into `dist/site/`;
3. stamps `updatedAt` into `dist/site/data.js` if it's empty (your `data.js` stays untouched), and makes the link-preview URLs absolute from `SITE_URL`;
4. creates `dist/casualty-report.zip` with `index.html` at its root.

## Tests

```powershell
node tests/parse.test.js
```

No dependencies. Exact numbers are checked against the frozen `tests/fixtures/sample-data.js`, never against `data.js` (which changes daily). `data.js` only gets sanity checks: it loads, the day keys are whole numbers, `liveDay` is one of the days, `updatedAt` is empty or a date, and the totals agree. Unparsed lines and unknown units are printed but don't fail.

## Link-preview image

`og-image.png` (1200×630) is rendered from `scripts/og-image.html`. To regenerate it, do this once (PowerShell):

```powershell
npm i -g playwright
npx playwright install chromium
```

Then, each time:

```powershell
$env:NODE_PATH = (npm root -g); node scripts/render-og.js
```

## Files

| File | What it is |
| --- | --- |
| `data.js` | The pasted logs. See [data-format.md](data-format.md). |
| `index.html`, `styles.css`, `app.js` | The page. |
| `parse.js` | Log parser and stats (pure; runs in the browser and Node). |
| `icons.js` | The 34 unit icons, ported from the design. |
| `og-image.png` | Link-preview image. |
| `tests/` | `parse.test.js` and its frozen fixture. |
| `build.ps1`, `build.sh` | Build to `dist/`. |
| `.github/workflows/` | CI on pull requests, deploy on merge. See [deployment.md](deployment.md). |
| `scripts/` | `deploy-99helpers.js`, plus the og-image template and renderer. |
| `design/` | The original Claude Design export. Reference only, never shipped. |
