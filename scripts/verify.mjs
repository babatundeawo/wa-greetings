/**
 * Checks the built site in ./_site and stops with a readable message if anything would ship broken.
 *   node scripts/verify.mjs               checks structure, manifest, service worker, pages
 *   node scripts/verify.mjs --production  also refuses placeholder settings
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '_site');
const production = process.argv.includes('--production');
const problems = [];
const fail = (msg) => problems.push(msg);
const read = (rel) => readFileSync(join(SITE, rel), 'utf8');
const has = (rel) => existsSync(join(SITE, rel));

for (const f of ['index.html', '404.html', 'offline.html', 'sw.js', 'manifest.webmanifest', 'robots.txt', 'theme-init.js', 'favicon.ico']) {
  if (!has(f)) fail(`Missing file in the built site: ${f}`);
}
if (problems.length) finish();

// ---- manifest
let manifest = {};
try { manifest = JSON.parse(read('manifest.webmanifest')); } catch (e) { fail(`manifest.webmanifest is not valid JSON: ${e.message}`); }
for (const key of ['name', 'short_name', 'id', 'start_url', 'scope', 'display', 'theme_color', 'background_color', 'icons']) {
  if (!manifest[key]) fail(`manifest.webmanifest is missing "${key}"`);
}
for (const icon of manifest.icons || []) if (!has(icon.src)) fail(`Manifest icon not found: ${icon.src}`);
const purposes = (manifest.icons || []).map((i) => `${i.sizes}:${i.purpose}`);
for (const need of ['192x192:any', '512x512:any', '512x512:maskable']) {
  if (!purposes.includes(need)) fail(`Manifest needs an icon with sizes:purpose ${need}`);
}
for (const s of manifest.shortcuts || []) for (const i of s.icons || []) if (!has(i.src)) fail(`Shortcut icon not found: ${i.src}`);

// ---- service worker
const sw = read('sw.js');
try { new vm.Script(sw); } catch (e) { fail(`sw.js has a syntax error: ${e.message}`); }
if (sw.includes('__VERSION__') || sw.includes('__PRECACHE__')) fail('sw.js still has unfilled placeholders');
const list = sw.match(/const PRECACHE = (\[[\s\S]*?\]);/);
if (!list) fail('sw.js has no PRECACHE list');
else {
  try {
    for (const entry of JSON.parse(list[1])) {
      const rel = entry.replace(/^\.\//, '');
      if (rel && !has(rel)) fail(`Service worker precaches a missing file: ${entry}`);
    }
  } catch (e) { fail(`PRECACHE list is not valid: ${e.message}`); }
}

// ---- pages
for (const page of ['index.html', '404.html', 'offline.html']) {
  const html = read(page);
  if (html.includes('%%')) fail(`${page} still has unfilled placeholders`);
  if (!/http-equiv="Content-Security-Policy"/.test(html)) fail(`${page} has no Content Security Policy`);
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail(`${page} has an inline script (the policy forbids it)`);
  if (/\son[a-z]+\s*=\s*["']/i.test(html.replace(/<svg[\s\S]*?<\/svg>/g, ''))) fail(`${page} has an inline event handler`);
  const withoutBase = html.replace(/<base [^>]*>/g, '');
  for (const m of withoutBase.matchAll(/(?:src|href)="([^"#?:]+)"/g)) {
    const ref = m[1];
    if (ref.startsWith('http') || ref.startsWith('//') || ref === './') continue;
    if (ref.startsWith('/')) { fail(`${page} uses an absolute path (${ref}), which breaks under /repository-name/`); continue; }
    if (!has(ref)) fail(`${page} points to a file that does not exist: ${ref}`);
  }
  if (page !== 'index.html' && !/<base href="[^"]*\/">/.test(html)) fail(`${page} needs a base address`);
}

// ---- bundle
const assets = readdirSync(join(SITE, 'assets'));
const js = assets.find((f) => /^app-.*\.js$/.test(f));
if (!js) fail('The JavaScript bundle is missing');
else {
  const code = read(`assets/${js}`);
  if (production && code.includes('placeholder-for-checks')) fail('The bundle was built with placeholder Firebase settings. Check the GitHub secrets.');
  if (/https?:\/\/www\.gstatic\.com\/firebasejs/.test(code)) fail('The bundle still loads Firebase from a third-party address.');
}
const size = assets.reduce((n, f) => n + statSync(join(SITE, 'assets', f)).size, 0);
console.log(`Assets total ${(size / 1024).toFixed(0)} KB (uncompressed).`);

finish();

function finish() {
  if (problems.length) {
    console.error('\nSITE CHECK FAILED:\n');
    problems.forEach((p) => console.error(`  - ${p}`));
    console.error('');
    process.exit(1);
  }
  console.log('Site check passed.');
}
