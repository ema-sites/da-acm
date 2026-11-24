/* eslint-disable no-console */
/**
 * Builds the "partner profiles" sheet from saved old-site seller profile pages
 * (tools/importer/bd-snapshots/commercemarketplace.adobe.com/partner/<old-slug>.html).
 *
 * The old site renders these profiles on the server from its seller accounts; no API it exposes
 * returns the website, social links, contact email, address or biography. This script is the
 * one-off seed: after it, authors edit the sheet in DA.
 *
 * Usage (jsdom from the content-import scripts):
 *   NODE_PATH=<dir with jsdom> node tools/importer/build-partner-profiles.js
 *     [--out content/partner/profiles.json]
 *     [--redirects migration-work/partner-profiles/redirects.json]
 *     [--metadata migration-work/partner-profiles/metadata.json]
 *
 * Outputs: the profiles workbook (sheets `data` and `ids`), redirect rows (old address -> new) for
 * /redirects.json, and bulk-metadata rows (URL, Title, Description, Image) for /metadata.json.
 *
 * Sheet columns:
 *   path      new address, /partner/<slug> (lowercase, see normalizeSlug)
 *   old-path  the old site's address, when it differs
 *   id        seller ID (Catalog Service ext_developer_id)
 *   name, logo, website, social (one URL per line), level, level-image, email,
 *   address (one line per line), about (paragraphs separated by a blank line)
 */
const fs = require('fs');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'tools/importer/bd-snapshots/commercemarketplace.adobe.com/partner');
const ORIGIN = 'https://commercemarketplace.adobe.com';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const OUT = path.resolve(ROOT, arg('--out', 'content/partner/profiles.json'));
const WORK = 'migration-work/partner-profiles';
const REDIRECTS = path.resolve(ROOT, arg('--redirects', `${WORK}/redirects.json`));
const METADATA = path.resolve(ROOT, arg('--metadata', `${WORK}/metadata.json`));

/** Old address -> Edge Delivery path segment: lowercase letters, digits and single hyphens. */
function normalizeSlug(oldSlug) {
  let s = oldSlug;
  try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { /* keep as is */ }
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();

/**
 * A copy of an element whose text reads as the browser shows it: raw line breaks and runs of
 * whitespace in the source are single spaces, so only markup (<br>, blocks) breaks lines.
 */
function collapsedCopy(el) {
  const copy = el.cloneNode(true);
  const walker = el.ownerDocument.createTreeWalker(copy, 4 /* NodeFilter.SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) n.nodeValue = n.nodeValue.replace(/\s+/g, ' ');
  return copy;
}

/** Text of an element with <br> and block boundaries as line breaks. */
function lines(el) {
  if (!el) return [];
  const doc = el.ownerDocument;
  const copy = collapsedCopy(el);
  copy.querySelectorAll('br').forEach((br) => br.replaceWith(doc.createTextNode('\n')));
  copy.querySelectorAll('p, div, li').forEach((b) => b.append(doc.createTextNode('\n')));
  return copy.textContent.split('\n').map(clean).filter(Boolean);
}

/** Biography: paragraphs (blank-line separated), keeping list items as their own lines. */
function biography(el) {
  if (!el) return '';
  const doc = el.ownerDocument;
  const copy = collapsedCopy(el);
  copy.querySelectorAll('script, style').forEach((n) => n.remove());
  copy.querySelectorAll('br').forEach((br) => br.replaceWith(doc.createTextNode('\n')));
  copy.querySelectorAll('li').forEach((li) => { li.prepend(doc.createTextNode('\n• ')); li.append(doc.createTextNode('\n')); });
  copy.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, ul, ol').forEach((b) => {
    b.prepend(doc.createTextNode('\n\n'));
    b.append(doc.createTextNode('\n\n'));
  });
  return copy.textContent.replace(/\u00a0/g, ' ')
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').map(clean).filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n');
}

const absolute = (src) => {
  if (!src) return '';
  try { return new URL(src, ORIGIN).href; } catch (e) { return ''; }
};

/**
 * Only the page's main content, without scripts and styles: saved pages are ~500 KB, mostly
 * inline scripts, and 800+ full documents don't fit in memory.
 */
function mainContent(html) {
  const start = html.search(/<main\b/i);
  const end = html.search(/<\/main>/i);
  const main = start > -1 && end > start ? html.slice(start, end + 7) : html;
  return main.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
}

function parseProfile(html, oldSlug) {
  const { window } = new JSDOM(`<!DOCTYPE html><body>${mainContent(html)}</body>`);
  try {
    return readProfile(window.document, oldSlug);
  } finally {
    window.close();
  }
}

function readProfile(document, oldSlug) {
  const root = document.querySelector('.partner.product-info-details-container');
  const id = document.querySelector('[data-partner-id]')?.getAttribute('data-partner-id') || '';
  if (!root || !id) return null;

  const name = clean(root.querySelector('h1.page-title')?.textContent);
  const logoImg = root.querySelector('.ico-product img');
  const website = root.querySelector('.by-company a[href]')?.getAttribute('href') || '';
  const social = [...root.querySelectorAll('.social-list a[href]')].map((a) => a.getAttribute('href').trim()).filter(Boolean);
  const levelImg = root.querySelector('.product-info-main > .text-center img');
  const email = (root.querySelector('.box-profile a[href^="mailto:"]')?.getAttribute('href') || '').replace(/^mailto:/i, '').trim();
  const addressBox = root.querySelector('.case-specifications .box-produce');
  const address = lines(addressBox).filter((l) => !/^address$/i.test(l));
  const bioBox = document.getElementById('partner.biography.info')?.parentElement?.querySelector('[data-role="content"]');

  const path_ = `/partner/${normalizeSlug(oldSlug)}`;
  const oldPath = `/partner/${oldSlug}`;
  return {
    path: path_,
    'old-path': oldPath === path_ ? '' : oldPath,
    id,
    name,
    logo: /placeholder|default/i.test(logoImg?.getAttribute('src') || '') ? '' : absolute(logoImg?.getAttribute('src')),
    website,
    social: social.join('\n'),
    level: clean(levelImg?.getAttribute('alt')),
    'level-image': levelImg ? path.basename(new URL(absolute(levelImg.getAttribute('src'))).pathname) : '',
    email,
    address: address.join('\n'),
    about: biography(bioBox),
  };
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.html')).sort();
const rows = [];
const skipped = [];
files.forEach((f) => {
  const oldSlug = f.slice(0, -'.html'.length);
  const row = parseProfile(fs.readFileSync(path.join(SRC, f), 'utf8'), oldSlug);
  if (row) rows.push(row);
  else skipped.push(oldSlug);
});

// Two old addresses must not share a new one.
const byPath = new Map();
rows.forEach((r) => byPath.set(r.path, [...(byPath.get(r.path) || []), r]));
const collisions = [...byPath.entries()].filter(([, rs]) => rs.length > 1);
collisions.forEach(([, rs]) => rs.slice(1).forEach((r) => { r.path = `${r.path}-${r.id}`; }));

rows.sort((a, b) => a.path.localeCompare(b.path));
// Workbook: `data` (full profiles, for the profile page) and `ids` (id -> path, for profile links).
const columns = ['path', 'old-path', 'id', 'name', 'logo', 'website', 'social', 'level',
  'level-image', 'email', 'address', 'about'];
const sheetOf = (data, cols) => ({
  total: data.length, offset: 0, limit: data.length, data, columns: cols,
});
const ids = rows.map((r) => ({ id: r.id, name: r.name, path: r.path }));
const workbook = {
  data: sheetOf(rows, columns),
  ids: sheetOf(ids, ['id', 'name', 'path']),
  ':version': 3,
  ':names': ['data', 'ids'],
  ':type': 'multi-sheet',
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(workbook, null, 1)}\n`);

const redirects = rows.filter((r) => r['old-path'])
  .map((r) => ({ Source: r['old-path'], Destination: r.path }));
fs.mkdirSync(path.dirname(REDIRECTS), { recursive: true });
fs.writeFileSync(REDIRECTS, `${JSON.stringify(redirects, null, 1)}\n`);

// Bulk-metadata rows: server-side title and description for each profile (the template draws the
// page in the browser). The old site's title is the seller name.
const describe = (about) => {
  const text = about.replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).replace(/\s+\S*$/, '')}...`;
};
const metadata = rows.map((r) => ({
  URL: r.path, Title: r.name, Description: describe(r.about || ''), Image: r.logo || '',
}));
fs.writeFileSync(METADATA, `${JSON.stringify(metadata, null, 1)}\n`);

const filled = (k) => rows.filter((r) => r[k]).length;
console.log(JSON.stringify({
  files: files.length,
  rows: rows.length,
  skipped,
  collisions: collisions.map(([p, rs]) => `${p}: ${rs.map((r) => r['old-path'] || r.path).join(', ')}`),
  redirects: redirects.length,
  withLogo: filled('logo'),
  withWebsite: filled('website'),
  withSocial: filled('social'),
  withLevel: filled('level'),
  withEmail: filled('email'),
  withAddress: filled('address'),
  withAbout: filled('about'),
  out: path.relative(ROOT, OUT),
}, null, 1));
