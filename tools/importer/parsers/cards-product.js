/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the cards-product block (seller's product grid).
 * Source: #instant-search-results-container (products grid of .ais-hits--item tiles).
 *
 * Block structure (blocks/cards-product/cards-product.js): one row per product, cells:
 *   logo image | product name (h3 > a) | rating (percent, as on the source) | partner badge | price
 * (The tiles on the source don't show the vendor: on a seller page it is always the seller.)
 * Loading / empty / error placeholders and client-side templates are skipped.
 */

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function realSrc(img) {
  const src = img.getAttribute('src') || '';
  const dataSrc = img.getAttribute('data-src') || '';
  if ((!src || src.startsWith('data:')) && dataSrc) return dataSrc;
  return src || dataSrc;
}

function ratingOf(item) {
  const result = item.querySelector('.rating-result');
  if (!result) return '';
  let pct = (result.getAttribute('title') || '').match(/(\d+(?:\.\d+)?)\s*%/);
  if (!pct) {
    const span = result.querySelector('span[style*="width"]');
    pct = span && (span.getAttribute('style') || '').match(/width:\s*(\d+(?:\.\d+)?)%/);
  }
  if (!pct) {
    pct = clean(result.textContent).match(/(\d+(?:\.\d+)?)\s*%/);
  }
  if (!pct) return '';
  // Keep the source's percentage ("80%"); the block turns it into stars.
  return `${Math.round(Math.max(0, Math.min(100, parseFloat(pct[1]))))}%`;
}

export default function parse(element, { document }) {
  const grid = element.querySelector('.products-grid') || element;
  let items = [...grid.querySelectorAll(':scope > .ais-hits--item')];
  if (!items.length) items = [...grid.querySelectorAll('.ais-hits--item')];

  const cells = [];
  items.forEach((item) => {
    if (item.closest('.products-loading, .products-empty, .products-error')) return;
    const html = item.innerHTML;
    if (html.includes('<%')) return; // unrendered client template

    const titleEl = item.querySelector('.result-title, h3, h4');
    const title = clean(titleEl && titleEl.textContent);
    if (!title) return; // loading-state placeholder

    // Image
    const imgCell = [];
    const srcImg = item.querySelector('.result-thumbnail img, img.product-item-photo');
    if (srcImg) {
      const src = realSrc(srcImg);
      if (src && !src.startsWith('data:')) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = srcImg.getAttribute('alt') || title;
        imgCell.push(img);
      }
    }

    // Name linked to product URL
    const link = item.querySelector('a.result[href]') || item.querySelector('a[href]');
    const h3 = document.createElement('h3');
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = title;
      h3.append(a);
    } else {
      h3.textContent = title;
    }

    // Partner badge text (from badge image alt)
    const badgeImg = item.querySelector('.hit-partner-badge img, .partner-badge-icon img');
    const badge = clean(badgeImg && badgeImg.getAttribute('alt'))
      || clean(item.querySelector('.hit-partner-badge, .partner-badge-icon')?.textContent);

    // Price
    const priceEl = item.querySelector('.price-box .price, span.price, .price');
    const price = clean(priceEl && priceEl.textContent);

    cells.push([
      imgCell,
      h3,
      ratingOf(item),
      badge,
      price,
    ]);
  });

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
