import { events } from '@dropins/tools/event-bus.js';
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
import {
  decorateBlock, loadBlock, loadCSS, readBlockConfig, toClassName,
} from '../../scripts/aem.js';
import { getProductLink, loadErrorPage } from '../../scripts/commerce.js';
import { fetchProfileRows, PROFILES_SHEET } from '../../scripts/partner-profiles.js';
import { tileHeaderSlot, tileNameSlot, tileFooterSlot } from '../../scripts/marketplace-tiles.js';
import '../../scripts/initializers/search.js';

/*
 * Seller profile template for /partner/<slug> (served by /partner/default through folder mapping).
 * The profile (logo, website, social links, level, contact email, address, biography) comes from
 * the "partner profiles" sheet and is drawn with the authored seller pages' blocks
 * (partner-profile, notice). The product grid is the Product Discovery drop-in's SearchResults
 * container, searched by seller ID, with the category pages' tile slots (no vendor line, as on the
 * old profile tiles).
 */

const TEMPLATE_SLUG = 'default';
// The grid's own search scope, apart from the category page and the header search popover.
const SEARCH_SCOPE = 'partner';
// The old profile page asked for up to 500 products; the largest seller has 275.
const PAGE_SIZE = 500;
const MARKETPLACE_FILTERS = [
  { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
  { attribute: 'ext_attribute_set_id', eq: '12' },
  { attribute: 'ext_is_delisted_extension', eq: '0' },
];
// Partner level lockups kept on this site, keyed by the old site's file name.
const LEVEL_IMAGES = {
  'platinum-technology-partner.png': 'platinum-technology-partner.png',
  'gold-technology-partner.png': 'gold-technology-partner.png',
  'gold-solution-partner.png': 'gold-solution-partner.png',
  'silver-technology-partner.png': 'silver-technology-partner.png',
  'silver-solution-partner.png': 'silver-solution-partner.webp',
  'strategic-technology-partner.png': 'strategic-technology-partner.png',
};
const SOCIAL_LABELS = [
  [/facebook\.com|fb\.com/, 'Facebook'],
  [/twitter\.com|x\.com/, 'Twitter'],
  [/linkedin\.com/, 'LinkedIn'],
  [/youtube\.com|youtu\.be/, 'YouTube'],
  [/instagram\.com/, 'Instagram'],
];

const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  node.append(...children.filter(Boolean));
  return node;
};

/** Only web and mail links from the sheet become links. */
function safeHref(value, { mail = false } = {}) {
  const v = (value || '').trim();
  if (!v) return '';
  if (mail) return /^[^\s@<>"]+@[^\s@<>"]+$/.test(v) ? `mailto:${v}` : '';
  try {
    const url = new URL(v);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (e) {
    return '';
  }
}

const lines = (value) => (value || '').split('\n').map((l) => l.trim()).filter(Boolean);

/** The slug in /partner/<slug> (the local preview serves pages under /content). */
function currentSlug() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] === 'content' && window.location.hostname === 'localhost') segments.shift();
  let slug = segments[segments.length - 1] || '';
  try { slug = decodeURIComponent(slug); } catch (e) { /* keep */ }
  // The template itself can preview any profile: /partner/default?partner=<slug>.
  if (slug === TEMPLATE_SLUG) slug = new URLSearchParams(window.location.search).get('partner') || '';
  return slug.replace(/\.html?$/i, '');
}

function findProfile(rows, slug) {
  const want = slug.toLowerCase();
  return rows.find((r) => (r.path || '').split('/').pop().toLowerCase() === want)
    || rows.find((r) => r['old-path'] && r['old-path'].split('/').pop().toLowerCase() === want);
}

/**
 * The seller's listed products, as the old profile page searched them (its Live Search widget):
 * listed Marketplace extensions by seller ID, by name. Returns the drop-in's search result.
 */
function searchProducts(sellerId) {
  if (!sellerId) return Promise.resolve(null);
  return search({
    phrase: '',
    currentPage: 1,
    pageSize: PAGE_SIZE,
    sort: [{ attribute: 'name', direction: 'ASC' }],
    filter: [{ attribute: 'ext_developer_id', eq: String(sellerId) }, ...MARKETPLACE_FILTERS],
  }, { scope: SEARCH_SCOPE }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Partner products search failed', error);
    return null;
  });
}

/** The drop-in's product grid for this page's search scope, with the Marketplace tile slots. */
function productGrid() {
  const list = el('div', { class: 'partner-page-products marketplace-tiles' });
  const rendered = provider.render(SearchResults, {
    scope: SEARCH_SCOPE,
    routeProduct: (product) => getProductLink(product.urlKey, product.sku),
    skeletonCount: 8,
    slots: {
      ProductImage: tileHeaderSlot,
      ProductName: (ctx) => tileNameSlot(ctx, { vendor: false }),
      ProductPrice: tileFooterSlot,
    },
  })(list);
  // A second element of this block, so the grid's styles stay scoped to the block.
  const products = el('div', { class: 'partner-page partner-page--products' }, list);
  return { wrapper: el('div', { class: 'partner-page-wrapper' }, products), rendered };
}

/** A block element in authored form (rows of cells), wrapped as a decorated section child. */
function authoredBlock(name, rows) {
  const block = el('div', { class: name });
  rows.forEach((cells) => block.append(el('div', {}, ...cells.map((c) => el('div', {}, ...[].concat(c))))));
  const wrapper = el('div', { class: `${name}-wrapper` }, block);
  return { wrapper, block };
}

function defaultContent(...children) {
  return el('div', { class: 'default-content-wrapper' }, ...children);
}

function headerBlock(profile) {
  const logoCell = [];
  const logo = safeHref(profile.logo);
  if (logo) logoCell.push(el('picture', {}, el('img', { src: logo, alt: 'Partner Avatar', loading: 'eager' })));
  const details = [el('h2', { text: profile.name })];
  const website = safeHref(profile.website);
  if (website) details.push(el('p', {}, el('a', { href: website, text: profile.website.trim() })));
  const social = lines(profile.social).map((url) => safeHref(url)).filter(Boolean);
  if (social.length) {
    details.push(el('ul', {}, ...social.map((href) => {
      const { hostname } = new URL(href);
      const label = SOCIAL_LABELS.find(([re]) => re.test(hostname))?.[1] || hostname;
      return el('li', {}, el('a', { href, text: label }));
    })));
  }
  return authoredBlock('partner-profile', [[logoCell, details]]);
}

function levelNotice(profile) {
  const parts = [];
  const image = LEVEL_IMAGES[(profile['level-image'] || '').trim()];
  if (image && profile.level) {
    parts.push(el('p', {}, el('picture', {}, el('img', { src: `/icons/partner-levels/${image}`, alt: profile.level }))));
    parts.push(el('p', { text: profile.level }));
  }
  const mail = safeHref(profile.email, { mail: true });
  if (mail) parts.push(el('p', {}, el('a', { href: mail, text: 'Contact Seller' })));
  return parts.length ? authoredBlock('notice', [[parts]]) : null;
}

function locationNotice(profile) {
  const address = lines(profile.address);
  if (!address.length) return null;
  const p = el('p');
  address.forEach((line, i) => {
    if (i) p.append(el('br'));
    p.append(line);
  });
  return authoredBlock('notice', [[[el('h4', { text: 'Location' }), el('p', {}, el('strong', { text: 'Address' })), p]]]);
}

/**
 * "About Seller | All Products" bar, as on the old site: each tab jumps to its heading and becomes
 * the current one. The bar reuses this block's own element, so its styles stay scoped to it.
 */
function buildTabs(block, tabs) {
  const nav = el('nav', { class: 'partner-page-tabs', 'aria-label': 'Profile sections' });
  const links = tabs.map(({ id, label }, i) => {
    const a = el('a', { href: `#${id}`, text: label });
    if (!i) a.setAttribute('aria-current', 'true');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach((l) => l.removeAttribute('aria-current'));
      a.setAttribute('aria-current', 'true');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    });
    return a;
  });
  nav.append(...links);
  block.replaceChildren(nav);
  return { wrapper: el('div', { class: 'partner-page-wrapper' }, block) };
}

/**
 * Template block. Optional config row: `profiles` (sheet path, default /partner/profiles.json).
 * An authored `partner` row picks the profile instead of the page address.
 * @param {Element} block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const slug = (config.partner || currentSlug()).trim();
  const rows = slug ? await fetchProfileRows('data', config.profiles || PROFILES_SHEET) : [];
  const profile = slug && findProfile(rows, slug);
  if (!profile?.name) {
    await loadErrorPage(404);
    return;
  }

  // An old address (e.g. /partner/Abletech, or one with a trailing dot) gets the template too:
  // folder mapping answers before the redirects sheet. Send the visitor on to the new address.
  const canonical = (profile.path || '').split('/').pop();
  const addressSlug = window.location.pathname.replace(/\/+$/, '').split('/').pop();
  if (!config.partner && canonical && addressSlug !== TEMPLATE_SLUG && addressSlug !== canonical) {
    const local = window.location.pathname.startsWith('/content/') ? '/content' : '';
    window.location.replace(`${local}${profile.path}${window.location.hash}`);
    return;
  }

  // The grid is rendered first so it receives the search result; products load while the profile
  // is drawn.
  const grid = productGrid();
  const productsPromise = Promise.all([
    searchProducts(profile.id),
    loadCSS(`${window.hlx.codeBasePath}/styles/marketplace-tiles.css`),
    grid.rendered,
  ]).then(([result]) => result);
  document.title = profile.name;
  events.emit('partner/data', profile);

  const section = block.closest('.section');
  // The generated wrappers replace the template's own wrapper (the block moves into the tab bar).
  const wrapper = block.closest('.partner-page-wrapper') || block;
  const anchor = document.createComment('partner-page');
  wrapper.before(anchor);
  const parts = [defaultContent(el('h1', { id: toClassName(profile.name), text: profile.name })), headerBlock(profile)];
  const level = levelNotice(profile);
  const location = locationNotice(profile);
  if (level) parts.push(level);
  if (location) parts.push(location);
  // Biography: blank lines separate paragraphs; single line breaks (e.g. list items) are kept.
  const about = (profile.about || '').split(/\n\s*\n/).map(lines).filter((l) => l.length)
    .map((paraLines) => {
      const p = el('p');
      paraLines.forEach((line, i) => {
        if (i) p.append(el('br'));
        p.append(line);
      });
      return p;
    });
  const result = await productsPromise;
  const hasProducts = (result?.totalCount || result?.items?.length || 0) > 0;
  const tabs = [];
  if (about.length) tabs.push({ id: 'about-seller', label: 'About Seller' });
  if (hasProducts) tabs.push({ id: 'all-products', label: 'All Products' });
  if (tabs.length) parts.push(buildTabs(block, tabs));
  if (about.length) parts.push(defaultContent(el('h3', { id: 'about-seller', text: 'About Seller' }), ...about));
  if (hasProducts) {
    parts.push(defaultContent(el('h3', { id: 'all-products', text: 'All Products' })));
    parts.push(grid);
  }

  const nodes = parts.map((p) => p.wrapper || p);
  if (wrapper !== block) wrapper.remove();
  anchor.replaceWith(...nodes);
  section?.classList.add('partner-profile-container', 'notice-container');

  const blocks = parts.filter((p) => p.block).map((p) => p.block);
  blocks.forEach((b) => decorateBlock(b));
  await Promise.all(blocks.map((b) => loadBlock(b)));
}
