import { events } from '@dropins/tools/event-bus.js';
import { getMetadata } from '../../scripts/aem.js';

// Catalog-driven product pages (/products/<url-key>) are all served by one template, so neither the
// "products" folder nor the template's own title describes the page: the trail is Home > product
// name, filled in once the product data loads.
const PRODUCT_PATH = /^\/products\/[a-z0-9][a-z0-9-]*\/?$/;

function titleCase(segment) {
  let text = segment;
  try {
    text = decodeURIComponent(segment);
  } catch (e) {
    // keep the raw segment
  }
  return text
    .replace(/\.html?$/i, '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function currentPageTitle(lastSegment) {
  const h1 = document.querySelector('main h1');
  if (h1?.textContent.trim()) return h1.textContent.trim();
  const title = getMetadata('og:title') || document.title;
  if (title) return title.split('|')[0].trim();
  return titleCase(lastSegment);
}

function crumb(label, href) {
  const li = document.createElement('li');
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    li.append(a);
  } else {
    const span = document.createElement('span');
    span.setAttribute('aria-current', 'page');
    span.textContent = label;
    li.append(span);
  }
  return li;
}

/**
 * Breadcrumb trail generated from the page URL (auto-blocked, not authored).
 * Home > each ancestor path segment (title-cased, linked) > current page (h1 or title).
 * If authors place a breadcrumb block with links, those links are used instead.
 * @param {Element} block
 */
export default function decorate(block) {
  const ol = document.createElement('ol');
  const authoredLinks = [...block.querySelectorAll('a[href]')];

  if (authoredLinks.length) {
    authoredLinks.forEach((a) => ol.append(crumb(a.textContent.trim(), a.href)));
    const last = [...block.querySelectorAll(':scope > div > div')].pop();
    const trailing = last && !last.querySelector('a') ? last.textContent.trim() : '';
    ol.append(crumb(trailing || currentPageTitle(''), null));
  } else {
    const segments = window.location.pathname.split('/').filter(Boolean);
    // Local preview serves pages under /content; that folder is not part of the site path.
    const base = window.location.hostname === 'localhost' && segments[0] === 'content' ? `/${segments.shift()}` : '';
    if (segments[segments.length - 1] === 'index') segments.pop();
    ol.append(crumb(getMetadata('breadcrumb-home') || 'Home', `${base}/`));
    if (PRODUCT_PATH.test(`/${segments.join('/')}`)) {
      const current = crumb('', null);
      ol.append(current);
      events.on('pdp/data', (product) => {
        if (product?.name) current.querySelector('span').textContent = product.name;
      }, { eager: true });
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Breadcrumb');
      nav.append(ol);
      block.replaceChildren(nav);
      return;
    }
    let path = base;
    segments.forEach((segment, i) => {
      path += `/${segment}`;
      if (i === segments.length - 1) {
        ol.append(crumb(currentPageTitle(segment), null));
      } else {
        ol.append(crumb(titleCase(segment), `${path.replace(/\.html?$/i, '')}`));
      }
    });
  }

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.append(ol);
  block.replaceChildren(nav);
}
