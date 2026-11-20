/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the cards-program block (commercemarketplace.adobe.com homepage).
 *
 * Source: #maincontent section.case-resources .col-box > .col
 *   (.box-header h2, span.icon-* icon font glyph, .txt p, .actions hr + a "Learn more").
 *
 * Block structure (library Cards + blocks/cards-program/cards-program.js): one row
 * per card, cells: [icon, body (heading, description, Learn more link)]. The icon
 * font is replaced by an EDS icon token (/icons/mp-*.svg); the decorative <hr> is dropped.
 */

const ICON_BY_CLASS = {
  'icon-assurance-program': 'mp-assurance-program',
  'icon-arm': 'mp-partner-program',
  'icon-Training': 'mp-training',
  'icon-certif': 'mp-certification',
};

// Fallback by heading when the empty icon <span> was stripped before parsing.
const ICON_BY_TITLE = {
  'assurance program': 'mp-assurance-program',
  'partner program': 'mp-partner-program',
  training: 'mp-training',
  certification: 'mp-certification',
};

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function iconName(card, title) {
  const spans = [...card.querySelectorAll('span[class*="icon-"]')];
  for (let i = 0; i < spans.length; i += 1) {
    const cls = [...spans[i].classList].find((c) => ICON_BY_CLASS[c]);
    if (cls) return ICON_BY_CLASS[cls];
  }
  return ICON_BY_TITLE[title.toLowerCase()] || '';
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll(':scope > .col').forEach((card) => {
    const headingEl = card.querySelector('h1, h2, h3, h4, h5, h6');
    const title = clean(headingEl && headingEl.textContent);
    const body = [];

    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }

    card.querySelectorAll('.txt p').forEach((src) => {
      const t = clean(src.textContent);
      if (!t) return;
      const p = document.createElement('p');
      p.textContent = t;
      body.push(p);
    });

    const link = card.querySelector('.actions a[href]') || card.querySelector('a[href]');
    if (link && clean(link.textContent)) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href').trim();
      a.textContent = clean(link.textContent);
      const p = document.createElement('p');
      p.append(a);
      body.push(p);
    }

    if (!body.length) return;

    const icon = iconName(card, title);
    const iconCell = [];
    if (icon) {
      const p = document.createElement('p');
      p.textContent = `:${icon}:`;
      iconCell.push(p);
    }

    cells.push([iconCell, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-program', cells });
  element.replaceWith(block);
}
