/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for commercemarketplace.adobe.com.
 *
 * beforeTransform: catalog removals only (selectors were captured with chrome in place).
 *   1. Replay payload.template.pageCleanup for the current page (matched by origin + path).
 *   2. For a page not listed in pageCleanup, remove what matches the catalog
 *      cleanup.rules[] (migration-work/catalog-template.json) outside <main>.
 * afterTransform: strip site chrome and non-authorable leftovers.
 */

// From migration-work/catalog-template.json cleanup.rules[]
const CATALOG_CLEANUP_RULES = [
  '[id*="onetrust"]', // cookie-banner
  '[role="dialog"]', // popup
];

// Site chrome removed after parsing (all observed in migration-work/cleaned.html).
const CHROME_SELECTORS = [
  'header.page-header',
  'footer',
  'footer.page-footer',
  'div.after-header-container',
  'div.breadcrumbs',
  'a.action.skip',
  'a.skip-link',
  '.skip-link',
  '#ot-cookie-button',
  '#ot-cookie-settings',
  // Magento hidden UI: cookie-status message and the sign-in popup template
  '#cookie-status',
  '.cookie-status-message',
  '#authenticationPopup',
  '.block-authentication',
  // In-page tab links and "Back to top" anchors point at source-only ids
  '.product-info-nav',
  'a.box-back-top',
  '[id*="onetrust"]',
  'script',
  'style',
  'noscript',
  'link',
  'template',
];

function pageKey(u) {
  try {
    const { origin, pathname } = new URL(u);
    return `${origin}${pathname.replace(/\/$/, '')}`;
  } catch (e) {
    return u;
  }
}

function currentUrl(payload) {
  return (payload && payload.params && payload.params.originalURL) || (payload && payload.url) || '';
}

function removeAll(root, selectors) {
  selectors.forEach((selector) => {
    let found = [];
    try { found = root.querySelectorAll(selector); } catch (e) { return; }
    found.forEach((el) => el.remove());
  });
}

function isKnockoutComment(text) {
  const t = (text || '').trim();
  // <!-- ko ... -->, <!-- /ko -->, <!--/ko-->
  return /^\/?\s*ko(\s|$)/.test(t);
}

function removeKnockoutComments(doc, root) {
  const SHOW_COMMENT = 128;
  const walker = doc.createTreeWalker(root, SHOW_COMMENT);
  const comments = [];
  let node = walker.nextNode();
  while (node) {
    if (isKnockoutComment(node.nodeValue)) comments.push(node);
    node = walker.nextNode();
  }
  comments.forEach((c) => c.remove());
}

export default function transform(hookName, element, payload) {
  const doc = (payload && payload.document) || element.ownerDocument;

  if (hookName === 'beforeTransform') {
    const template = (payload && payload.template) || {};
    const pageCleanup = template.pageCleanup || {};
    const key = pageKey(currentUrl(payload));
    const entry = Object.entries(pageCleanup).find(([u]) => pageKey(u) === key);

    if (entry) {
      // Replay catalog removals in order: remove only a selector's single match.
      entry[1].forEach((selector) => {
        let found = [];
        try { found = doc.querySelectorAll(selector); } catch (e) { return; }
        if (found.length === 1) found[0].remove();
      });
    } else {
      // Page not listed in pageCleanup: apply the catalog rules outside <main>.
      const main = doc.querySelector('main');
      CATALOG_CLEANUP_RULES.forEach((rule) => {
        let found = [];
        try { found = doc.querySelectorAll(rule); } catch (e) { return; }
        found.forEach((el) => {
          if (main && (main === el || main.contains(el) || el.contains(main))) return;
          if (el === doc.body || el === doc.documentElement || el.tagName === 'HEAD') return;
          el.remove();
        });
      });
    }
  }

  if (hookName === 'afterTransform') {
    removeAll(element, CHROME_SELECTORS);

    // Knockout leftovers: binding comments and data-bind / Magento init attributes.
    removeKnockoutComments(doc, element);
    element.querySelectorAll('[data-bind], [data-mage-init], [x-magento-init]').forEach((el) => {
      el.removeAttribute('data-bind');
      el.removeAttribute('data-mage-init');
      el.removeAttribute('x-magento-init');
    });

    // Tracking attributes.
    element.querySelectorAll('[data-track], [data-analytics], [data-gtm], [onclick]').forEach((el) => {
      ['data-track', 'data-analytics', 'data-gtm', 'onclick'].forEach((a) => el.removeAttribute(a));
    });
  }
}
