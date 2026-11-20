/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the cards-category block (commercemarketplace.adobe.com homepage).
 *
 * Source: #maincontent > .widget.block.block-static-block .fotorama > .col > a
 *   (span.icon.icon-* icon font glyph + span.text-link label).
 *
 * Block structure (library Cards + blocks/cards-category/cards-category.js): one row
 * per tile, cells: [icon, linked category name]. The icon font is replaced by an
 * EDS icon token (/icons/mp-*.svg).
 */

const ICON_BY_CLASS = {
  'icon-gar': 'mp-customer-support',
  'icon-lock': 'mp-payments-security',
  'icon-met': 'mp-marketing',
  'icon-cal': 'mp-accounting-finance',
  'icon-truck': 'mp-shipping-fulfillment',
  'icon-clock': 'mp-site-optimization',
};

// Fallback when the empty icon <span> was stripped before parsing.
const ICON_BY_SLUG = {
  'customer-support': 'mp-customer-support',
  'payments-security': 'mp-payments-security',
  'marketing-automation-email-marketing': 'mp-marketing',
  'accounting-finance': 'mp-accounting-finance',
  'shipping-fulfillment': 'mp-shipping-fulfillment',
  'site-optimization': 'mp-site-optimization',
};

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** https://commercemarketplace.adobe.com/extensions/x.html -> /extensions/x */
function toSiteRelative(href) {
  try {
    const url = new URL(href, 'https://commercemarketplace.adobe.com/');
    if (url.hostname !== 'commercemarketplace.adobe.com') return href;
    return `${url.pathname.replace(/\.html$/i, '')}${url.search}${url.hash}`;
  } catch (e) {
    return href;
  }
}

function iconName(link, path) {
  const span = link.querySelector('span[class*="icon-"]');
  if (span) {
    const cls = [...span.classList].find((c) => ICON_BY_CLASS[c]);
    if (cls) return ICON_BY_CLASS[cls];
  }
  const slug = (path.split(/[?#]/)[0].split('/').pop() || '').toLowerCase();
  return ICON_BY_SLUG[slug] || '';
}

export default function parse(element, { document }) {
  const cells = [];

  let links = [...element.querySelectorAll(':scope > .col a[href]')];
  if (!links.length) links = [...element.querySelectorAll('a[href]')];

  links.forEach((link) => {
    const labelEl = link.querySelector('.text-link');
    const label = clean(labelEl ? labelEl.textContent : link.textContent);
    if (!label) return;

    const href = toSiteRelative(link.getAttribute('href').trim());
    const icon = iconName(link, href);

    const iconCell = [];
    if (icon) {
      const p = document.createElement('p');
      p.textContent = `:${icon}:`;
      iconCell.push(p);
    }

    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    const p = document.createElement('p');
    p.append(a);

    cells.push([iconCell, [p]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });
  element.replaceWith(block);
}
