# Casualty Report

A static scoreboard of enemy units destroyed in our Call of War match. It lists only the enemy's losses.
Plain HTML, CSS and vanilla JS: no framework, no bundler, nothing to install. It works opened straight from disk, on Netlify, and inside an itch.io iframe.

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
3. Run the build:

   ```powershell
   .\build.ps1
   ```

   (macOS, Linux or Git Bash: `./build.sh`.) The build runs the tests and stops if they fail, copies the site into `dist/site/`, stamps `updatedAt` into `dist/site/data.js` only (your `data.js` stays untouched), and creates `dist/casualty-report.zip`.
4. Deploy (see below): upload `dist/casualty-report.zip` to tiiny.site, or `dist/site` to Netlify.

If a line can't be read, it isn't counted and shows up in a small "unparsed lines" box at the bottom of the page. An unknown unit name still counts: it appears under "Other" with a generic icon.

## Previewing locally

Just open `index.html` in a browser. No server needed.

## Deploying with tiiny.site (current host)

tiiny.site takes the same zip as itch.io: `dist/casualty-report.zip`, with `index.html` at its root.

**First time**

1. Run `.\build.ps1`.
2. On <https://tiiny.site>, sign in (so the site is tied to your account and you can update it later), choose a link name, and upload `dist/casualty-report.zip`.
3. Copy the site URL into `SITE_URL` at the top of `index.html`, rebuild, and upload again as below. This makes link previews show `og-image.png`.

**Every update**

1. Run `.\build.ps1`.
2. In your tiiny.site dashboard, use the site's update/edit option and upload the new `dist/casualty-report.zip`. This keeps the same link. Uploading from the home page instead creates a new site.

## Deploying with Netlify Drop (alternative)

**First time**

1. Run `.\build.ps1`.
2. Go to <https://app.netlify.com/drop> and drag the `dist/site` folder onto the page.
3. **Claim the site straight away** with a free Netlify account (the page prompts you). Unclaimed Drop sites are deleted after a short while.
4. Copy the site URL (for example `https://something.netlify.app`) into `SITE_URL` at the top of `index.html`, rebuild and redeploy as below. This makes link previews (Discord, WhatsApp, X…) show `og-image.png`.

**Every update**

1. Run `.\build.ps1`.
2. In the Netlify dashboard, open your site, go to **Deploys**, and drag `dist/site` onto the drop zone at the bottom of that page.

This keeps the same URL. Don't use the public netlify.com/drop page again: that creates a brand-new site with a new URL.

### Alternative: auto-deploy from GitHub

Connect this repo to Netlify (Add new site → Import an existing project). There's no build step: leave the build command empty and set the publish directory to the repo root (`/`). Every push then deploys.

On this path the build script doesn't run, so:
- fill `updatedAt` in `data.js` by hand (e.g. `"2026-10-27T09:00:00Z"`), or the "Updated …" line stays hidden;
- the `og:`/`twitter:` tags keep relative URLs. Make them absolute by hand in `index.html` if link previews matter.
- `design/`, `tests/` and `scripts/` are published too. They're harmless, but Drop is the cleaner option.

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
| `icons.html` | The icon set and design tokens (linked from the footer). |
| `og-image.png` | Link-preview image. Regenerate with `node scripts/render-og.js` (needs Playwright). |
| `tests/parse.test.js` | `node tests/parse.test.js`, no dependencies. Exact numbers are checked against the frozen `tests/fixtures/sample-data.js`. Your `data.js` only gets sanity checks (it loads, `liveDay` is one of the days, totals agree), and any unparsed lines are listed. |
| `build.ps1`, `build.sh` | Build to `dist/`. |
| `design/` | The original Claude Design export. Reference only, not shipped. |
