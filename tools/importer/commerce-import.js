/* eslint-disable */
/* global WebImporter */

/**
 * Commerce import (Adobe Commerce Marketplace): writes thin shell pages for product pages.
 * Product data is NOT extracted: the commerce blocks load it at runtime from the Commerce
 * catalog (Catalog Service / Live Search).
 *
 * - PDP (catalog template product-detail): optional PCI notice block, then a product-details
 *   block configured with the page's SKU (JSON-LD Product.sku), plus page metadata (incl. sku).
 * - PLP (catalog template product-listing): the page title, then a product-list-page block
 *   filtered by the category path (the URL path without .html).
 *
 * Page type comes from the page: a JSON-LD Product (or og:type=product) means PDP; otherwise PLP.
 */

function readJsonLdProduct(document) {
  const found = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const data = JSON.parse(s.textContent);
      const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(walk); return; }
        const type = node['@type'];
        if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) found.push(node);
        Object.values(node).forEach(walk);
      };
      walk(data);
    } catch (e) { /* ignore malformed JSON-LD */ }
  });
  return found[0] || null;
}

function meta(document, name) {
  const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  return el ? (el.getAttribute('content') || '').trim() : '';
}

function pagePath(url) {
  const { pathname } = new URL(url);
  return pathname.replace(/\.html?$/i, '').replace(/\/+$/, '') || '/';
}

/** SKU priority: JSON-LD Product.sku, data attributes, visible "SKU:" text. */
function findSku(document, ldProduct) {
  if (ldProduct && ldProduct.sku) return String(ldProduct.sku).trim();
  const attr = document.querySelector('[data-sku], [data-product-sku]');
  if (attr) return (attr.getAttribute('data-sku') || attr.getAttribute('data-product-sku') || '').trim();
  const m = (document.body.textContent || '').match(/\bSKU:\s*([\w\-/.]+)/i);
  return m ? m[1] : '';
}

function buildNotice(document, el) {
  const p = document.createElement('p');
  [...el.childNodes].forEach((n) => p.append(n.cloneNode(true)));
  return WebImporter.DOMUtils.createTable([['notice'], [p]], document);
}

function buildMetadata(document, fields) {
  const rows = [['Metadata']];
  Object.entries(fields).forEach(([k, v]) => { if (v) rows.push([k, v]); });
  return WebImporter.DOMUtils.createTable(rows, document);
}

export default {
  // <script> elements are removed before transform, so read JSON-LD here.
  preprocess: ({ document, params }) => {
    const product = readJsonLdProduct(document);
    params.commerce = {
      isProduct: Boolean(product) || meta(document, 'og:type') === 'product',
      sku: findSku(document, product),
      productName: product && product.name ? String(product.name) : '',
    };
  },

  transform: ({ document, url, params }) => {
    const main = document.body;
    const info = params.commerce || { isProduct: false, sku: '' };
    const originalUrl = params.originalURL || url;
    const path = pagePath(originalUrl);

    // Product pages are not imported any more: every /products/<url-key> is served by the
    // /products/default template from the catalog, and the old /<url-key> addresses redirect there
    // (PRODUCT_PAGES_PLAN.md). Importing them would recreate thousands of documents at the root.
    if (info.isProduct) {
      throw new Error(`commerce-import: ${path} is a product page; product pages come from the /products/default template, not from import`);
    }

    // STEP 1: extract everything needed while the DOM is intact
    const title = meta(document, 'og:title') || (document.querySelector('title')?.textContent || '').trim();
    const description = meta(document, 'description');
    const ogImage = meta(document, 'og:image');
    const pciNotice = document.querySelector('.product-info-details-container .pci-notice, .pci-notice');
    const noticeBlock = info.isProduct && pciNotice && pciNotice.textContent.trim()
      ? buildNotice(document, pciNotice) : null;
    const h1Text = (document.querySelector('#maincontent h1, h1')?.textContent || '').replace(/\s+/g, ' ').trim();

    let commerceBlock;
    if (info.isProduct) {
      if (!info.sku) console.warn(`⚠️ commerce-import: no SKU found for ${originalUrl}`);
      commerceBlock = WebImporter.DOMUtils.createTable([
        ['product-details'],
        ['defaultSku', info.sku || ''],
      ], document);
    } else {
      commerceBlock = WebImporter.DOMUtils.createTable([
        ['product-list-page'],
        ['urlPath', path.replace(/^\//, '')],
        ['pageSize', '36'],
      ], document);
    }

    let image = null;
    if (ogImage) {
      image = document.createElement('img');
      image.src = ogImage;
      image.alt = info.productName || title;
    }
    const metadataBlock = buildMetadata(document, {
      Title: title,
      Description: description,
      Image: image,
      sku: info.isProduct ? info.sku : '',
    });

    // STEP 2: clear
    main.innerHTML = '';

    // STEP 3: rebuild sections
    if (!info.isProduct && h1Text) {
      const titleSection = document.createElement('div');
      const h1 = document.createElement('h1');
      h1.textContent = h1Text;
      titleSection.append(h1);
      main.append(titleSection);
    }
    if (noticeBlock) {
      const noticeSection = document.createElement('div');
      noticeSection.append(noticeBlock);
      main.append(noticeSection);
    }
    const commerceSection = document.createElement('div');
    commerceSection.append(commerceBlock);
    main.append(commerceSection);

    // STEP 4: metadata
    const metadataSection = document.createElement('div');
    metadataSection.append(metadataBlock);
    main.append(metadataSection);

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path === '/' ? '/index' : path),
      report: { pageType: info.isProduct ? 'PDP' : 'PLP', sku: info.sku || '' },
    }];
  },
};
