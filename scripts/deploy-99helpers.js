// Publishes a built site folder to 99helpers as a new version of an existing site.
//   HELPERS99_TOKEN=... HELPERS99_SITE=my-site node scripts/deploy-99helpers.js dist/site
// DRY_RUN=1 prints what would be sent without calling the API.
'use strict';
const fs = require('fs');
const path = require('path');

const API = 'https://99helpers.com/api/hosting/v1/publish';
const TEXT = new Set(['.html', '.css', '.js', '.json', '.txt', '.svg', '.xml', '.md']);

const dir = path.resolve(process.argv[2] || 'dist/site');
const token = process.env.HELPERS99_TOKEN;
const name = process.env.HELPERS99_SITE;
const dryRun = process.env.DRY_RUN === '1';

function fail(msg) { console.error('Deploy failed: ' + msg); process.exit(1); }

if (!name) fail('HELPERS99_SITE (the 99helpers site name) is not set.');
if (!token && !dryRun) fail('HELPERS99_TOKEN is not set.');
if (!fs.existsSync(path.join(dir, 'index.html'))) fail('no index.html in ' + dir + '. Run the build first.');

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(dir).map((p) => {
  const rel = '/' + path.relative(dir, p).split(path.sep).join('/');
  const buf = fs.readFileSync(p);
  return TEXT.has(path.extname(p).toLowerCase())
    ? { path: rel, content: buf.toString('utf8') }
    : { path: rel, content: buf.toString('base64'), encoding: 'base64' };
});

const body = JSON.stringify({ name, files });
console.log(`Publishing ${files.length} files (${(body.length / 1024).toFixed(1)} KB) to 99helpers site "${name}":`);
for (const f of files) console.log('  ' + f.path + (f.encoding ? ' (base64)' : ''));

if (dryRun) { console.log('DRY_RUN=1, not sending.'); process.exit(0); }

(async () => {
  let res;
  try {
    res = await fetch(API, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body,
    });
  } catch (e) {
    fail('could not reach 99helpers: ' + e.message);
  }
  const text = await res.text();
  if (!res.ok) fail(`HTTP ${res.status} ${res.statusText}\n${text.slice(0, 2000)}`);
  let url = '';
  try { const j = JSON.parse(text); url = j.url || (j.site && j.site.url) || ''; } catch (e) { /* not JSON */ }
  console.log('Published.' + (url ? ' Live at ' + url : ''));
  console.log(text.slice(0, 2000));
})();
