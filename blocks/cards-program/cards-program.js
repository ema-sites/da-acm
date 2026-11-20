import { createOptimizedPicture } from '../../scripts/aem.js';

function optimizeImages(block) {
  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });
}

/**
 * Turns icon tokens authored as text (":icon-name:") into icon images from /icons.
 * @param {Element} block
 */
function decorateIconTokens(block) {
  block.querySelectorAll('p, div').forEach((el) => {
    if (el.children.length) return;
    const match = el.textContent.trim().match(/^:([a-z0-9-]+):$/);
    if (!match) return;
    const img = document.createElement('img');
    img.src = `${window.hlx?.codeBasePath || ''}/icons/${match[1]}.svg`;
    img.alt = '';
    img.loading = 'lazy';
    const span = document.createElement('span');
    span.className = `icon icon-${match[1]}`;
    span.append(img);
    el.replaceChildren(span);
  });
}

/**
 * Program cards: title, icon, description and a "Learn more" call to action.
 * One row per card. Content may be in one cell or split across cells; authored order is kept.
 * @param {Element} block
 */
export default function decorate(block) {
  decorateIconTokens(block);
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-program-card';

    [...row.children].forEach((cell) => {
      const onlyImage = cell.querySelector('picture, img') && !cell.textContent.trim();
      cell.className = onlyImage ? 'cards-program-card-image' : 'cards-program-card-body';
      li.append(cell);
    });

    // The last paragraph holding only a link is the card's call to action.
    const ctaCandidates = [...li.querySelectorAll('p')].filter((p) => {
      const a = p.querySelector('a');
      return a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim();
    });
    const cta = ctaCandidates[ctaCandidates.length - 1];
    if (cta) {
      cta.classList.add('cards-program-card-cta');
      li.append(cta);
    }
    ul.append(li);
  });
  optimizeImages(ul);
  block.replaceChildren(ul);
}
