import { getRootPath, isMultistore } from '@dropins/tools/lib/aem/configs.js';
// Dropin Components
import {
  Button,
  provider as UI,
} from '@dropins/tools/components.js';

// Block-level
import createModal from '../modal/modal.js';
import { loadFragment } from '../fragment/fragment.js';
import { getMetadata } from '../../scripts/aem.js';

// The old footer opened with a "Become a Partner" band on product and seller pages. A page can name
// its own band (metadata `footer-banner`: a fragment path) or turn it off (`off`).
const BANNER_PAGES = 'main .product-details, main .partner-page';
const BANNER_FRAGMENT = '/fragments/become-partner';

/**
 * Loads the page's "Become a Partner" band, if it has one. The local preview serves content
 * under /content.
 * @returns {Promise<Element|null>} The band, or null
 */
async function loadBanner() {
  const setting = getMetadata('footer-banner').trim();
  if (/^(off|no|false)$/i.test(setting)) return null;
  const path = setting || (document.querySelector(BANNER_PAGES) ? BANNER_FRAGMENT : '');
  if (!path.startsWith('/')) return null;
  let fragment = await loadFragment(path);
  if (!fragment && window.location.hostname === 'localhost') {
    fragment = await loadFragment(`/content${path}`);
  }
  if (!fragment) return null;
  const banner = document.createElement('aside');
  banner.className = 'footer-banner';
  fragment.querySelectorAll('.default-content-wrapper > *').forEach((node) => banner.append(node));
  return banner.children.length ? banner : null;
}

/**
 * Toggles all storeSelector sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleStoreDropdown(sections, expanded = false) {
  sections
    .querySelectorAll('.storeview-modal .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Groups each heading with the list that follows it into a column.
 * @param {Element} wrapper The section's default-content wrapper
 */
function buildLinkColumns(wrapper) {
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let column;
  [...wrapper.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName) || !column) {
      column = document.createElement('div');
      column.className = 'footer-column';
      columns.append(column);
    }
    column.append(child);
  });
  wrapper.append(columns);
}

/**
 * Splits the bottom section into a brand row (logo, text, social list) and a legal row
 * (copyright and legal links), reading the authored order from the fragment.
 * @param {Element} wrapper The section's default-content wrapper
 */
function buildBottomRows(wrapper) {
  const brandRow = document.createElement('div');
  brandRow.className = 'footer-brand-row';
  const legalRow = document.createElement('div');
  legalRow.className = 'footer-legal-row';
  let row = brandRow;
  [...wrapper.children].forEach((child) => {
    const isLogo = child.tagName === 'P' && child.querySelector('img') && !child.textContent.trim();
    const isSocial = child.tagName === 'UL' && child.querySelector('a img');
    if (isLogo) child.classList.add('footer-logo');
    if (isSocial) {
      child.classList.add('footer-social');
      child.querySelectorAll('li').forEach((li) => {
        if (!li.querySelector('a')) li.classList.add('footer-social-label');
      });
    }
    row.append(child);
    // everything after the social list belongs to the legal row
    if (isSocial) row = legalRow;
  });
  legalRow.querySelectorAll(':scope > ul').forEach((ul) => ul.classList.add('footer-legal-links'));
  wrapper.append(brandRow, legalRow);
}

/**
 * Adds layout classes to the fragment's sections: link columns first, bottom bar second.
 * @param {Element} footer The footer content element
 */
function decorateFooterSections(footer) {
  const sections = [...footer.querySelectorAll(':scope > .section')];
  const [links, bottom] = sections;
  if (links) {
    links.classList.add('footer-links');
    const wrapper = links.querySelector('.default-content-wrapper');
    if (wrapper) buildLinkColumns(wrapper);
  }
  if (bottom) {
    bottom.classList.add('footer-bottom');
    const wrapper = bottom.querySelector('.default-content-wrapper');
    if (wrapper) buildBottomRows(wrapper);
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const root = getRootPath();
  // Load Footer as Fragment — metadata-independent:
  // /content first (localhost), then root (DA/EDS prod)
  let footerResp = await fetch('/content/footer.plain.html');
  if (!footerResp.ok) footerResp = await fetch('/footer.plain.html');
  const footerPath = footerResp.ok
    ? new URL(footerResp.url).pathname.replace(/\.plain\.html$/, '')
    : '/footer';
  const bannerPromise = loadBanner();
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');

  // Footer content - Store Switcher
  if (isMultistore()) {
    footer.innerHTML = `
      <div class="storeview-switcher-button"></div>
    `;

    // Container and component refs
    let modal;

    // Modal Actions
    const showModal = async (content) => {
      modal = await createModal([content]);
      modal.showModal();
    };

    // Rendering the Store Switcher Modal Content
    const $storeSwitcherBtn = footer.querySelector(
      '.storeview-switcher-button',
    );

    // Store Switcher Modal Content
    const storeSwitcherPath = '/store-switcher';
    let fragmentStoreView;

    try {
      fragmentStoreView = await loadFragment(storeSwitcherPath);
      if (!fragmentStoreView) throw new Error(`Footer does not render due to Store Switcher fragment (${storeSwitcherPath}) not found`);
    } catch (error) {
      console.error('Error loading store switcher fragment:', error);
      return;
    }

    // Store Switcher Modal Content
    const storeSwitcher = document.createElement('div');

    // Return Storename from stores-switcher
    const selected = [...fragmentStoreView.querySelectorAll('a')].find((a) => {
      const url = new URL(a.href);
      return url.pathname.startsWith(root);
    });

    storeSwitcher.id = 'storeview-modal';
    while (fragmentStoreView.firstElementChild) {
      storeSwitcher.append(fragmentStoreView.firstElementChild);
    }

    // create classes for storeview modal sections
    const classes = ['storeview-title', 'storeview-list'];
    classes.forEach((c, i) => {
      const section = storeSwitcher.children[i];
      if (section) section.classList.add(`storeview-modal-${c}`);
    });

    // Store Switcher Modal Content - Store View Title
    const storeViewTitle = storeSwitcher.querySelector('.storeview-modal-storeview-title');
    const title = storeViewTitle.querySelector('h3');
    if (title) {
      title.className = '';
      title.closest('h3').classList.add('storeview-modal-storeview-title');
      title.setAttribute('tabindex', '0');
    }

    // Storeview List
    const storeViewList = storeSwitcher.querySelector('.storeview-modal-storeview-list');

    if (storeViewList && storeViewList.children.length) {
      // Add storeview-selection class to parent UL
      storeViewList
        .querySelectorAll(':scope .default-content-wrapper > ul')
        .forEach((storeView) => {
          if (storeView.querySelector('ul')) storeView.classList.add('storeview-selection');
        });

      // if multiple stores exist per region, add class storeviews and click events for accordion
      storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
        if (storeRegion.children.length > 1) {
          if (storeRegion.querySelector('ul')) storeRegion.classList.add('storeviews');

          // Accessiblity: addeventlistener for 'click' and keyboard event and tab indexes
          storeViewList.querySelectorAll(':scope li').forEach((storeView) => {
            const link = storeView.closest('a');
            if (link) link.setAttribute('tabindex', '0');
            storeView.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const expanded = storeView.getAttribute('aria-expanded') === 'true';
                toggleStoreDropdown(storeViewList);
                storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
              }
            });
            storeView.addEventListener('click', () => {
              const expanded = storeView.getAttribute('aria-expanded') === 'true';
              toggleStoreDropdown(storeViewList);
              storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            });
          });
        }
      });

      // If only one storeview link in region, convert parent UL into the li and remove the child UL
      storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
        const li = storeRegion.closest('li');

        if (storeRegion.children.length <= 1) {
          li.classList.add('storeview-single-store');
          const ulParent = li.closest('ul');
          const replacedChild = (storeRegion.firstElementChild);
          replacedChild.className = 'storeview-single-store';

          ulParent.replaceChild(replacedChild, li);
          ulParent.setAttribute('tabindex', '0');
        } else {
          li.classList.add('storeview-multiple-stores');
          li.setAttribute('tabindex', '0');
        }
      });

      UI.render(Button, {
        children: `${selected.text}`,
        'data-testid': 'storeview-switcher-button',
        className: 'storeview-switcher-button',
        size: 'medium',
        variant: 'teritary',
        onClick: () => {
          showModal(storeSwitcher);
        },
      })($storeSwitcherBtn);
    }
  }
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  decorateFooterSections(footer);
  const banner = await bannerPromise;
  if (banner) block.append(banner);
  block.append(footer);
}
