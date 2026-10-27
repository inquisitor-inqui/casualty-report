# Casualty Report

A static scoreboard of enemy units destroyed in our Call of War match. It lists only the enemy's losses.
Plain HTML, CSS and vanilla JS: no framework, no bundler, nothing to install. It works opened straight from disk, hosted on 99helpers, and inside an itch.io iframe.

## Daily workflow

1. Open `data.js`. It's the only file you edit day to day.
2. Paste the raw game log, unchanged, under its game day number:

   ```js
   window.CASUALTY_DATA = {
     liveDay: 10,       // the day in progress, or null once it's final
     updatedAt: "",     // leave "" and the build stamps it
     days: {
       9: `
   ...Day 9 log...
   `,
       10: `
   ...Day 10 log...
   `
     }
   };
   ```

   - **Updating a day that's still in progress: replace that day's whole block with the full latest log. Don't append.** Identical lines can be real events, so the site never de-duplicates them. Appending a fresh copy of the log would count everything twice.
   - Game days roll over at about 14:30 IST. When a new day starts, add a new block and set `liveDay` to it.
   - Set `liveDay: null` when the latest day is final.
3. Commit on a branch and open a pull request into `main`. The **CI** workflow runs the tests and the build on the PR; it shows a red cross if something is wrong (for example, `liveDay` isn't one of your days).
4. Merge the PR. The **Deploy** workflow tests, builds and publishes the site to 99helpers. It takes about a minute; watch it under the repo's **Actions** tab.

   To check locally before pushing, run `.\build.ps1` (macOS, Linux or Git Bash: `./build.sh`). It runs the tests and stops if they fail, copies the site into `dist/site/`, stamps `updatedAt` into `dist/site/data.js` only (your `data.js` stays untouched), and creates `dist/casualty-report.zip`.

If a line can't be read, it isn't counted and shows up in a small "unparsed lines" box at the bottom of the page. An unknown unit name still counts: it appears under "Other" with a generic icon.

## Previewing locally

Just open `index.html` in a browser. No server needed.

## Deploying (GitHub Actions → 99helpers)

Two workflows live in `.github/workflows/`:

- **CI** (`ci.yml`) runs on every pull request into `main`: tests, build, and a check that the zip has `index.html` at its root. The built site is attached to the run (Artifacts) if you want to download and preview it.
- **Deploy** (`deploy.yml`) runs on every push to `main`, which includes every merged PR: tests, build, then `scripts/deploy-99helpers.js` publishes `dist/site` to 99helpers as a new version at the same address. You can also start it by hand from **Actions → Deploy → Run workflow**.

**One-time setup** (repo **Settings → Secrets and variables → Actions**):

1. Under **Secrets**, add `HELPERS99_TOKEN` with your 99helpers API token.
2. Under **Variables**, add `HELPERS99_SITE` with your 99helpers site name (the part before `.99helpers.site`).
3. Put the site's URL into `SITE_URL` at the top of `index.html`, so link previews show `og-image.png`.
4. Optional: add a branch protection rule on `main` that requires the CI **build** check, so a PR can't be merged while tests fail.

If a token leaks or you rotate it, revoke it in 99helpers and update the secret.

**Manual fallback:** run `.\build.ps1`, open your site in the 99helpers dashboard and drop `dist/casualty-report.zip` (or the `dist/site` folder) on it. Dropping on the same site keeps the address and adds a new version.

To publish from your own machine instead of GitHub (PowerShell):

```powershell
$env:HELPERS99_TOKEN = "hst_..."; $env:HELPERS99_SITE = "your-site"; node scripts/deploy-99helpers.js dist/site
```

Add `$env:DRY_RUN = "1"` first to see what would be sent without publishing.

## itch.io backup

1. Run `.\build.ps1`.
2. On itch.io, create a new project with **Kind of project: HTML**.
3. Upload `dist/casualty-report.zip` and tick **This file will be played in the browser**.
4. Embed options: viewport about **1280 × 900**, tick **Mobile friendly**, **Enable scrollbars** and **Fullscreen button**.

## Files

| File | What it is |
| --- | --- |
| `data.js` | Your pasted logs. The only file you edit. |
| `index.html`, `styles.css`, `app.js` | The page. |
| `parse.js` | Log parser and stats (pure; runs in the browser and Node). |
| `icons.js` | The 34 unit icons, ported from the design. |
| `og-image.png` | Link-preview image, rendered from `scripts/og-image.html`. To regenerate, see the setup steps at the top of `scripts/render-og.js`. |
| `tests/parse.test.js` | `node tests/parse.test.js`, no dependencies. Exact numbers are checked against the frozen `tests/fixtures/sample-data.js`. Your `data.js` only gets sanity checks (it loads, `liveDay` is one of the days, totals agree), and any unparsed lines are listed. |
| `build.ps1`, `build.sh` | Build to `dist/`. |
| `.github/workflows/` | CI on pull requests, deploy to 99helpers on merge. |
| `scripts/deploy-99helpers.js` | Publishes `dist/site` through the 99helpers API. |
| `design/` | The original Claude Design export. Reference only, not shipped. |
