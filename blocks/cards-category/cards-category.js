import { createOptimizedPicture } from '../../scripts/aem.js';

function optimizeImages(block) {
  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]));
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
 * Category tiles: an icon over a linked category label.
 * Each row is one tile; the icon and the link may share a cell or sit in two cells.
 * @param {Element} block
 */
export default function decorate(block) {
  decorateIconTokens(block);
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-category-item';

    const picture = row.querySelector('picture') || row.querySelector('img');
    const link = row.querySelector('a[href]');
    const labelText = (link ? link.textContent : row.textContent).trim();
    if (!picture && !labelText) return;

    const icon = document.createElement('div');
    icon.className = 'cards-category-icon';
    if (picture) icon.append(picture);

    const label = document.createElement('span');
    label.className = 'cards-category-label';
    label.textContent = labelText;

    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      if (link.title) a.title = link.title;
      a.className = 'cards-category-link';
      a.append(icon, label);
      li.append(a);
    } else {
      li.append(icon, label);
    }
    ul.append(li);
  });
  optimizeImages(ul);
  block.replaceChildren(ul);
}
