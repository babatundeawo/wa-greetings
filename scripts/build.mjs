/**
 * Builds the site into ./_site. Runs inside GitHub Actions; nobody needs to run it by hand.
 *
 *   1. Reads the Firebase settings from environment variables (GitHub Secrets).
 *   2. Bundles the JavaScript (including the Firebase SDK) and CSS with esbuild.
 *   3. Fills the HTML templates, copies static files and writes the service worker.
 *
 * Flags:
 *   --allow-missing-config   use placeholder settings (pull-request checks only, never published)
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, '_site');
const allowMissing = process.argv.includes('--allow-missing-config');

// ------------------------------------------------------------ Settings
const REQUIRED = {
  FIREBASE_API_KEY: 'apiKey',
  FIREBASE_AUTH_DOMAIN: 'authDomain',
  FIREBASE_PROJECT_ID: 'projectId',
  FIREBASE_APP_ID: 'appId',
};
const missing = Object.keys(REQUIRED).filter((name) => !(process.env[name] || '').trim());
if (missing.length && !allowMissing) {
  console.error('\nBUILD STOPPED: these GitHub secrets are missing or empty:\n');
  missing.forEach((name) => console.error(`  - ${name}`));
  console.error('\nAdd them in GitHub: Settings > Secrets and variables > Actions > New repository secret.');
  console.error('Step-by-step help: docs/FIREBASE_SETUP.md, section "Add the secrets to GitHub".\n');
  process.exit(1);
}
const firebaseConfig = {};
for (const [name, key] of Object.entries(REQUIRED)) {
  firebaseConfig[key] = (process.env[name] || '').trim() || 'placeholder-for-checks';
}
const appCheckKey = (process.env.RECAPTCHA_SITE_KEY || '').trim();
const basePath = (process.env.BASE_PATH || '').replace(/\/+$/, '');
const baseHref = `${basePath}/`;

// ------------------------------------------------------------ Bundle
await rm(SITE, { recursive: true, force: true });
await mkdir(SITE, { recursive: true });

const result = await build({
  absWorkingDir: ROOT,
  entryPoints: { app: 'src/main.js', styles: 'src/styles/main.css' },
  outdir: '_site/assets',
  entryNames: '[name]-[hash]',
  assetNames: '[name]-[hash]',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2022', 'chrome100', 'safari15.4', 'firefox100'],
  loader: { '.woff2': 'file' },
  legalComments: 'none',
  metafile: true,
  logLevel: 'warning',
  define: {
    __FIREBASE_CONFIG__: JSON.stringify(firebaseConfig),
    __APP_CHECK_SITE_KEY__: JSON.stringify(appCheckKey),
  },
});

const outputs = Object.keys(result.metafile.outputs).map((p) => relative('_site', p).split('\\').join('/'));
const pick = (re) => outputs.filter((p) => re.test(p));
const [js] = pick(/^assets\/app-.*\.js$/);
const [css] = pick(/^assets\/styles-.*\.css$/);
const fonts = pick(/\.woff2$/);
if (!js || !css || fonts.length < 2) {
  console.error('BUILD STOPPED: the bundle is missing a script, a stylesheet or the fonts.');
  process.exit(1);
}

// ------------------------------------------------------------ Static files
await cp(join(ROOT, 'public'), SITE, { recursive: true });

// ------------------------------------------------------------ Templates
const csp = [
  "default-src 'none'",
  `script-src 'self'${appCheckKey ? ' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/' : ''}`,
  `style-src 'self'${appCheckKey ? " 'unsafe-inline'" : ''}`,
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' https://*.googleapis.com${appCheckKey ? ' https://www.google.com' : ''}`,
  appCheckKey ? 'frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/' : null,
  "manifest-src 'self'",
  "worker-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
].filter(Boolean).join('; ');

const preload = fonts
  .map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`)
  .join('\n');

async function fill(name) {
  let html = await readFile(join(ROOT, 'src', name), 'utf8');
  html = html
    .replaceAll('%%CSP%%', csp)
    .replaceAll('%%BASE%%', baseHref)
    .replaceAll('%%CSS%%', css)
    .replaceAll('%%JS%%', js)
    .replaceAll('%%PRELOAD%%', preload);
  await writeFile(join(SITE, name), html);
  return html;
}
const pages = [await fill('index.html'), await fill('404.html'), await fill('offline.html')];

// ------------------------------------------------------------ Service worker
const precache = [
  './', './index.html', './offline.html', './manifest.webmanifest', './theme-init.js',
  `./${css}`, `./${js}`, ...fonts.map((f) => `./${f}`),
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
];
const hash = createHash('sha256');
for (const page of pages) hash.update(page);
for (const file of [js, css, ...fonts]) hash.update(await readFile(join(SITE, file)));
const version = hash.digest('hex').slice(0, 12);

let sw = await readFile(join(ROOT, 'src', 'sw.js'), 'utf8');
sw = sw.replace("'__VERSION__'", JSON.stringify(version))
  .replace("['__PRECACHE__']", JSON.stringify(precache, null, 2));
await writeFile(join(SITE, 'sw.js'), sw);

console.log(`Built ${js}, ${css} and ${fonts.length} fonts. Service worker version ${version}.`);
console.log(appCheckKey ? 'App Check: on.' : 'App Check: off (RECAPTCHA_SITE_KEY not set).');
