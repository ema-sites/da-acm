import { createOptimizedPicture } from '../../scripts/aem.js';

const RATING_RE = /^(?:rating[:\s]*)?([0-5](?:\.\d)?)(?:\s*(?:\/|out of)\s*5)?(?:\s*stars?)?$/i;
// A rating may also be authored as a percentage, as the source shows it ("80%").
const RATING_PCT_RE = /^(?:rating[:\s]*)?(\d{1,3}(?:\.\d+)?)\s*%$/i;
const PRICE_RE = /(?:[$€£¥]\s*\d|\d[\d.,]*\s*(?:usd|eur)|^free$|\/\s*(?:year|month|yr|mo)\b)/i;
const BADGE_RE = /\bpartner\b/i;

function optimizeImages(block) {
  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]));
  });
}

/** A row's parts: its cells, or the children of its only cell. */
function getParts(row) {
  const cells = [...row.children];
  if (cells.length === 1 && cells[0].children.length > 1) return [...cells[0].children];
  return cells;
}

function ratingValue(text) {
  const pct = text.match(RATING_PCT_RE);
  if (pct) return Math.round((parseFloat(pct[1]) / 20) * 10) / 10;
  return parseFloat(text.match(RATING_RE)?.[1] || text.replace(/[^★]/g, '').length || 0);
}

function buildRating(text) {
  const value = Math.max(0, Math.min(5, ratingValue(text)));
  const rating = document.createElement('div');
  rating.className = 'cards-product-rating';
  rating.setAttribute('role', 'img');
  rating.setAttribute('aria-label', `Rated ${value} out of 5`);
  rating.style.setProperty('--rating', value);
  const percent = document.createElement('span');
  percent.className = 'cards-product-rating-percent';
  percent.textContent = `${Math.round((value / 5) * 100)}%`;
  rating.append(percent);
  return rating;
}

const escapeXml = (s) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * The partner badge as a two-line lockup image ("Silver" over "Technology Partner"),
 * drawn from the authored badge text, which stays as the image's alt text.
 */
function buildBadge(text) {
  const [level, ...rest] = text.replace(/^adobe\s+/i, '').trim().split(/\s+/);
  const sub = rest.join(' ');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="28" viewBox="0 0 90 28">'
    + '<g font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-weight="700" fill="#000">'
    + `<text x="0" y="12" font-size="14">${escapeXml(level)}</text>`
    + (sub ? `<text x="0" y="24.5" font-size="10.5" textLength="90" lengthAdjust="spacingAndGlyphs">${escapeXml(sub)}</text>` : '')
    + '</g></svg>';
  const img = document.createElement('img');
  img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  img.alt = text;
  img.width = 90;
  img.height = 28;
  const div = document.createElement('div');
  div.className = 'cards-product-badge';
  div.append(img);
  return div;
}

const wrap = (el, cls) => {
  const div = document.createElement('div');
  div.className = cls;
  if (el.matches('div') && !el.className) div.append(...el.childNodes);
  else div.append(el);
  return div;
};

/** Append parts with a space between them, so the tile's text reads as separate words. */
const appendSpaced = (parent, parts) => parts.filter(Boolean).forEach((part, i) => {
  if (i) parent.append(' ');
  parent.append(part);
});

/**
 * Product / extension tiles: logo, name, vendor, star rating, partner badge, price.
 * One row per product. Cells are recognised by content, so authors may omit any of them.
 * The whole tile links to the product named in the name cell.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-product-card';
    const slots = {};
    const extra = [];

    getParts(row).forEach((part) => {
      const text = part.textContent.trim();
      const hasImage = part.querySelector('picture, img') || part.matches('picture, img');
      if (hasImage && !text && !slots.image) {
        slots.image = part;
      } else if (!slots.name && (part.matches('h1, h2, h3, h4, h5, h6') || part.querySelector('h1, h2, h3, h4, h5, h6, a[href]'))) {
        slots.name = part;
      } else if (!slots.rating && (RATING_RE.test(text) || RATING_PCT_RE.test(text) || /^[★☆]+$/.test(text))) {
        slots.rating = buildRating(text);
      } else if (!slots.price && PRICE_RE.test(text)) {
        slots.price = part;
      } else if (!slots.badge && BADGE_RE.test(text)) {
        slots.badge = buildBadge(text);
      } else if (!slots.vendor && text) {
        slots.vendor = part;
      } else if (text || hasImage) {
        extra.push(part);
      }
    });

    // The tile is one link; unwrap the name's own link so links don't nest.
    let name = null;
    let href = null;
    if (slots.name) {
      name = wrap(slots.name, 'cards-product-name');
      const link = name.querySelector('a[href]');
      if (link) {
        href = link.getAttribute('href');
        link.replaceWith(...link.childNodes);
      }
    }
    const tile = document.createElement(href ? 'a' : 'div');
    tile.className = 'cards-product-link';
    if (href) tile.href = href;

    const body = document.createElement('div');
    body.className = 'cards-product-body';
    let footer = null;
    if (slots.badge || slots.price) {
      footer = document.createElement('div');
      footer.className = 'cards-product-footer';
      appendSpaced(footer, [slots.badge, slots.price && wrap(slots.price, 'cards-product-price')]);
    }
    appendSpaced(body, [
      slots.image && wrap(slots.image, 'cards-product-image'),
      name,
      ...extra.map((el) => wrap(el, 'cards-product-extra')),
      slots.rating,
      footer,
    ]);
    tile.append(body);
    li.append(tile);
    if (slots.vendor) li.append(wrap(slots.vendor, 'cards-product-vendor'));
    ul.append(li);
  });
  optimizeImages(ul);
  block.replaceChildren(ul);
}
