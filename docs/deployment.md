# Deployment

The site is hosted on 99helpers at <https://casualties.99helpers.site>. GitHub Actions tests, builds and publishes it.

## Workflows (`.github/workflows/`)

- **CI** (`ci.yml`) runs on every pull request into `main`: the tests, the build, and a check that the zip has `index.html` at its root. The built site is attached to the run (Artifacts) if you want to download and preview it.
- **Deploy** (`deploy.yml`) runs on every push to `main`, which includes every merged PR: the tests, the build, then `scripts/deploy-99helpers.js` publishes `dist/site` to 99helpers as a new version at the same address. Start it by hand from **Actions → Deploy → Run workflow**. Only one deploy runs at a time.

If the tests fail, nothing is published.

## Repository settings

Under **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `HELPERS99_TOKEN` | the 99helpers API token |
| Variable | `HELPERS99_SITE` | `casualties` (the part before `.99helpers.site`) |

If the token leaks or you rotate it, revoke it in 99helpers and update the secret.

`SITE_URL` at the top of `index.html` is `https://casualties.99helpers.site`. The build uses it to make the link-preview (`og:`/`twitter:`) URLs absolute.

### Branch ruleset "Protect main"

**Settings → Rules → Rulesets**, targeting the default branch (`main`):

- Restrict deletions
- Block force pushes
- Require a pull request before merging, with **0** required approvals (a solo owner can't approve their own PR)
- Require status checks to pass: **build** (the CI job)

So `main` only changes through PRs that pass the tests, and every merge deploys.

### Who can change the repo

The repo is public, so anyone can read it, fork it and open a pull request. Only collaborators with write access can push branches here or merge, so an outsider's PR just sits there until you close it. Specifically:

- Workflows on PRs from forks run without access to secrets, so they can't touch the 99helpers token. Deploy only runs on pushes to `main`.
- **Settings → Actions → General → Approval for running fork pull request workflows from contributors** decides whether a stranger's PR can run CI before you approve it. "Require approval for all external contributors" is the strictest setting.
- To stop strangers opening PRs or issues at all, use **Settings → Moderation options → Interaction limits** ("Limit to repository collaborators", up to 6 months at a time).

## Manual fallback

Run `.\build.ps1`, open the site in the 99helpers dashboard and drop `dist/casualty-report.zip` (or the `dist/site` folder) on it. Dropping on the same site keeps the address and adds a new version.

To publish from your own machine with the API (PowerShell):

```powershell
$env:HELPERS99_TOKEN = "hst_..."; $env:HELPERS99_SITE = "casualties"; node scripts/deploy-99helpers.js dist/site
```

Set `$env:DRY_RUN = "1"` first to see what would be sent without publishing.

### 99helpers API

`scripts/deploy-99helpers.js` calls `POST https://99helpers.com/api/hosting/v1/publish` with `Authorization: Bearer <token>` and a JSON body `{ "name": "<site>", "files": [{ "path": "/index.html", "content": "..." }] }`. Binary files (the PNG) go in as `"encoding": "base64"`. Publishing to a name you own creates a new version at the same address.

## itch.io backup

1. Run `.\build.ps1`.
2. On itch.io, create a new project with **Kind of project: HTML**.
3. Upload `dist/casualty-report.zip` and tick **This file will be played in the browser**.
4. Embed options: viewport about **1280 × 900**, tick **Mobile friendly**, **Enable scrollbars** and **Fullscreen button**.
