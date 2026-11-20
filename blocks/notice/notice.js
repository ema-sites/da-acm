import { decorateIcons } from '../../scripts/aem.js';

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

/** A paragraph holding only a picture/image (an authored badge or logo). */
function isImageParagraph(el) {
  return el?.tagName === 'P'
    && el.querySelector('picture, img')
    && !el.textContent.trim();
}

/** A paragraph holding only one link (a call-to-action). */
function actionLink(el) {
  if (el?.tagName !== 'P') return null;
  const links = el.querySelectorAll('a');
  if (links.length !== 1) return null;
  return links[0].textContent.trim() === el.textContent.trim() ? links[0] : null;
}

/**
 * Leading badge image of a default notice, shown above the box as on the source.
 * A following paragraph repeating the image's alt text is kept as a hidden label.
 * @param {Element} body
 * @returns {Element|null}
 */
function extractBadge(body) {
  const first = body.firstElementChild;
  if (!isImageParagraph(first) || !first.nextElementSibling) return null;
  const badge = document.createElement('div');
  badge.className = 'notice-badge';
  badge.append(first);
  const next = body.firstElementChild;
  const alt = badge.querySelector('img')?.getAttribute('alt')?.trim();
  if (next?.tagName === 'P' && !next.querySelector('a, picture, img')
    && alt && next.textContent.trim() === alt) {
    next.classList.add('notice-badge-label');
    badge.append(next);
  }
  return badge;
}

/**
 * Bordered notice box holding text and links.
 * Option `warning`: yellow warning variant with a leading warning icon.
 * All authored rows and cells are merged into one body, in order.
 * A leading heading becomes a header band; a leading badge image is placed above the box;
 * a paragraph holding a single link is rendered as an outline button.
 * @param {Element} block
 */
export default function decorate(block) {
  const body = document.createElement('div');
  body.className = 'notice-body';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture, img')) return;
      // Wrap bare text so it is laid out like a paragraph.
      if (!cell.querySelector(`p, ul, ol, ${HEADINGS}`)) {
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        body.append(p);
      } else {
        body.append(...cell.childNodes);
      }
    });
  });

  [...body.children].forEach((el) => {
    actionLink(el)?.classList.add('notice-action');
  });

  const children = [body];
  if (block.classList.contains('warning')) {
    block.setAttribute('role', 'alert');
    const icon = document.createElement('span');
    icon.className = 'notice-icon icon icon-warning';
    icon.setAttribute('aria-hidden', 'true');
    children.unshift(icon);
  } else {
    block.setAttribute('role', 'note');
    const first = body.firstElementChild;
    if (first?.matches(HEADINGS)) {
      const head = document.createElement('div');
      head.className = 'notice-head';
      head.append(first);
      children.unshift(head);
      block.classList.add('notice-titled');
    }
    const badge = extractBadge(body);
    if (badge) block.before(badge);
  }
  block.replaceChildren(...children);
  decorateIcons(block);
}
