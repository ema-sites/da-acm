/* eslint-disable */
/* global WebImporter */

/**
 * Import for the Partners directory (https://commercemarketplace.adobe.com/partners).
 *
 * The source renders its directory from `window.partnersData` (first page) and pages the rest
 * through /partners-search/search. The import snapshot carries every partner with an Adobe partner
 * level (111 on 2026-11-23); developers without a partner level ("Non-Partner", ~9,500) are left out.
 *
 * Output: the page title, then a `partner-directory` block:
 *   source | <partner search endpoint>   (the block uses it when it answers from the new domain)
 *   page-size | 36
 *   logo | name (link to the partner page) | partner level | country | solution types | certifications
 * Partner links point at the migrated profiles (/partner/<slug>, see the link transformer).
 */
import { rewriteHref } from './transformers/commercemarketplace-links.js';

const ORIGIN = 'https://commercemarketplace.adobe.com';
const SEARCH_ENDPOINT = `${ORIGIN}/partners-search/search`;

function readPartnersData(document) {
  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent || '';
    const m = text.match(/window\.partnersData\s*=\s*(\[[\s\S]*?\]);/);
    if (m) {
      try { return JSON.parse(m[1]); } catch (e) { /* fall through */ }
    }
  }
  return [];
}

const abs = (path) => (path ? new URL(path, ORIGIN).href : '');

export default {
  // <script> elements are removed before transform, so read the partner data here.
  preprocess: ({ document, params }) => {
    params.partners = readPartnersData(document);
  },

  transform: ({ document, url, params }) => {
    const main = document.body;
    const partners = params.partners || [];
    if (!partners.length) console.warn('import-partners: no window.partnersData found');

    // STEP 1: extract
    const h1Text = (document.querySelector('#maincontent h1, h1')?.textContent || 'Adobe Commerce Partners').replace(/\s+/g, ' ').trim();
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    const rows = [['Partner Directory'], ['source', SEARCH_ENDPOINT], ['page-size', '36']];
    partners.forEach((p) => {
      const href = abs(p.developer_page_url || (p.screen_name ? `/partner/${encodeURIComponent(p.screen_name)}` : ''));
      const logo = document.createElement('div');
      if (p.avatar) {
        const img = document.createElement('img');
        img.src = abs(p.avatar);
        img.alt = p.name || '';
        logo.append(img);
      }
      const name = document.createElement('a');
      name.href = rewriteHref(href) || href;
      name.textContent = p.name || p.screen_name || '';
      rows.push([
        logo,
        name,
        p.partner_level || '',
        p.country || '',
        (p.makes || []).join(', '),
        (p.certifications || []).join(', '),
      ]);
    });
    const block = WebImporter.DOMUtils.createTable(rows, document);
    const metadata = WebImporter.DOMUtils.createTable([
      ['Metadata'],
      ['Title', `${h1Text} | Marketplace`],
      // The old site's breadcrumb reads "Home > Partners".
      ['breadcrumb-title', 'Partners'],
      ...(description ? [['Description', description]] : []),
    ], document);

    // STEP 2: clear, STEP 3: rebuild
    main.innerHTML = '';
    const section = document.createElement('div');
    const h1 = document.createElement('h1');
    h1.textContent = h1Text;
    section.append(h1, block);
    main.append(section);
    const metaSection = document.createElement('div');
    metaSection.append(metadata);
    main.append(metaSection);

    const path = new URL(params.originalURL || url).pathname.replace(/\.html?$/i, '').replace(/\/+$/, '') || '/partners';
    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path),
      report: { partners: partners.length },
    }];
  },
};
