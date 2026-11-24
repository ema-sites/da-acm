/* eslint-disable */
/* global WebImporter */

/**
 * Link rewriting, applied at afterTransform to the final page.
 *
 * Links to the source site (absolute https://commercemarketplace.adobe.com/... or relative) whose
 * target is a migrated page become site-relative links in Edge Delivery form: no host, no .html,
 * no trailing slash ('/' for the homepage); query strings and #fragments are kept.
 * Product pages (old /<url-key>) become /products/<url-key>, where the new site serves them.
 * Documents the new site hosts (the legal terms and the Marketplace info sheet PDFs) are linked
 * directly, whether the source links the /legal/terms/... page or its static PDF.
 * Links to source pages that were not migrated (e.g. /contact-us, which needs a Magento account
 * sign-in, /partner/<name>, files under /media) and links to other hosts are left unchanged.
 */
import MIGRATED_PATHS, { PRODUCT_PATHS } from './migrated-paths.js';

const SOURCE_HOSTS = ['commercemarketplace.adobe.com', 'www.commercemarketplace.adobe.com'];
const SOURCE_ORIGIN = 'https://commercemarketplace.adobe.com';
const STATIC_PDF = '/static/version1794834731/frontend/Aheadworks/marketplace/en_US/pdf';

// Old address (page or static file, without .html) -> document on the new site.
export const DOCUMENT_LINKS = {
  '/legal/terms/master-terms': '/legal/terms/master-terms.pdf',
  '/legal/terms/development-terms': '/legal/terms/development-terms.pdf',
  '/legal/terms/customer-agreement': '/legal/terms/customer-agreement.pdf',
  [`${STATIC_PDF}/legal/master-terms.pdf`]: '/legal/terms/master-terms.pdf',
  [`${STATIC_PDF}/legal/development-terms.pdf`]: '/legal/terms/development-terms.pdf',
  [`${STATIC_PDF}/legal/customer-agreement.pdf`]: '/legal/terms/customer-agreement.pdf',
  [`${STATIC_PDF}/footer/Marketplace-Infosheet.pdf`]: '/documents/marketplace-infosheet.pdf',
};

function normalizePath(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch (e) { p = pathname; }
  p = p.replace(/\.html?$/i, '').replace(/\/+$/, '');
  return (p === '' || p === '/index') ? '/' : p;
}

/** Returns the rewritten href, or null when the link should stay as it is. */
export function rewriteHref(href) {
  if (!href || /^(#|mailto:|tel:|javascript:|data:)/i.test(href.trim())) return null;
  let url;
  try { url = new URL(href.trim(), `${SOURCE_ORIGIN}/`); } catch (e) { return null; }
  if (!/^https?:$/.test(url.protocol) || !SOURCE_HOSTS.includes(url.hostname)) return null;
  const doc = DOCUMENT_LINKS[url.pathname] || DOCUMENT_LINKS[url.pathname.replace(/\/+$/, '')];
  if (doc) return `${doc}${url.hash}`;
  const path = normalizePath(url.pathname);
  if (!MIGRATED_PATHS.has(path)) return null;
  // Product pages live at /products/<url-key> on the new site (the old root path redirects there).
  const target = PRODUCT_PATHS.has(path) ? `/products${path}` : path;
  const rewritten = `${target}${url.search}${url.hash}`;
  return rewritten === href ? null : rewritten;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  element.querySelectorAll('a[href]').forEach((a) => {
    const original = a.getAttribute('href');
    const next = rewriteHref(original);
    if (!next) return;
    // A link whose text is its own URL should show the new URL too.
    if (a.textContent.trim() === original) a.textContent = `${SOURCE_ORIGIN}${next}`;
    a.setAttribute('href', next);
  });
}
