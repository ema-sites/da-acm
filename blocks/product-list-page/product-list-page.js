// Product Discovery Dropins
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import Facets from '@dropins/storefront-product-discovery/containers/Facets.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import { Button, Icon, provider as UI } from '@dropins/tools/components.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
// Event Bus
import { events } from '@dropins/tools/event-bus.js';
// AEM
import { readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, getProductLink, rootLink } from '../../scripts/commerce.js';
import { getSearchStateFromUrl, applySearchStateToUrl, BASE_FILTER_ATTRIBUTES } from './search-url.js';
import {
  tileHeaderSlot,
  tileNameSlot,
  tileFooterSlot,
  fetchCategoryTree,
  renderCategoryTree,
  facetSlots,
  buildSelectedHeader,
  renderResultsBar,
  renderControls,
  sortOptionFor,
  SORT_OPTIONS,
} from './marketplace-plp.js';

// Initializers
import '../../scripts/initializers/search.js';

/**
 * Marketplace category / search page: the old Marketplace layout (filters sidebar, results bar,
 * 4-column product tiles, paging) on top of the Product Discovery drop-in's search. The filters
 * are the drop-in's Facets container, adapted with slots and CSS.
 * Config: urlPath (category path), pageSize (default 36).
 * @param {Element} block
 */
export default async function decorate(block) {
  const labels = await fetchPlaceholders();

  const config = readBlockConfig(block);
  let pageSize = parseInt(config.pagesize, 10) || 36;

  const fragment = document.createRange().createContextualFragment(`
    <div class="search__wrapper">
      <div class="search__view-facets"></div>
      <aside class="plp-sidebar" aria-label="Filters">
        <div class="plp-facets"></div>
      </aside>
      <div class="plp-main">
        <div class="plp-results"></div>
        <div class="search__product-list"></div>
        <div class="plp-controls"></div>
      </div>
    </div>
  `);

  const $viewFacets = fragment.querySelector('.search__view-facets');
  const $sidebar = fragment.querySelector('.plp-sidebar');
  const $facets = fragment.querySelector('.plp-facets');
  const $results = fragment.querySelector('.plp-results');
  const $productList = fragment.querySelector('.search__product-list');
  const $controls = fragment.querySelector('.plp-controls');

  block.innerHTML = '';
  block.appendChild(fragment);

  // Add url path back to the block for enrichment, incase enrichment block is
  // executed after the plp block and block config is not available
  if (config.urlpath) {
    block.dataset.urlpath = config.urlpath;
  }

  const searchState = getSearchStateFromUrl(new URL(window.location.href));

  // Default visibility filter for all of our requests
  const visibilityFilter = { attribute: 'visibility', in: ['Search', 'Catalog, Search'] };
  // Marketplace listing rules, as on the old site: only Marketplace extensions (attribute set 12)
  // that are not delisted are listed. Delisted products keep their product page.
  const marketplaceFilters = [
    { attribute: 'ext_attribute_set_id', eq: '12' },
    { attribute: 'ext_is_delisted_extension', eq: '0' },
  ];
  const categoryFilter = config.urlpath ? [{ attribute: 'categoryPath', eq: config.urlpath }] : [];
  const baseFilters = [...categoryFilter, visibilityFilter, ...marketplaceFilters];
  // The page's own category filter isn't a visitor choice either.
  const isUserFilter = (f) => !BASE_FILTER_ATTRIBUTES.includes(f.attribute)
    && !(config.urlpath && f.attribute === 'categoryPath' && f.eq === config.urlpath);
  const userFilters = searchState.filter.filter(isUserFilter);

  // Normalize URL (e.g. pipe-separated filter values)
  const normalizedUrl = new URL(window.location.href);
  applySearchStateToUrl(normalizedUrl, searchState);
  window.history.replaceState({}, '', normalizedUrl.toString());

  let lastRequest = {
    phrase: config.urlpath ? '' : searchState.phrase,
    currentPage: searchState.currentPage,
    pageSize,
    sort: searchState?.sort?.length ? searchState.sort : SORT_OPTIONS[0].sort,
    filter: [...baseFilters, ...userFilters],
  };

  // Sort and paging aren't drop-in containers here; they search with the drop-in's last request,
  // which the Facets container also builds on (it keeps the base filters, as they aren't facets).
  const runSearch = (changes) => {
    lastRequest = { ...lastRequest, ...changes };
    return search(lastRequest).catch((e) => {
      console.error('Error searching for products', e);
    });
  };

  // Request search based on the page type on block load
  await runSearch({});

  // Category tree (category pages only), placed above the filters by the Facets slot
  const $categories = document.createElement('div');
  $categories.className = 'plp-categories';
  const selectedHeader = buildSelectedHeader();
  const categoryInfo = () => {
    if (!config.urlpath) return null;
    const crumbs = config.urlpath.split('/');
    const h1 = document.querySelector('main h1')?.textContent.trim();
    const treeName = $categories.querySelector('.plp-category__link--selected .plp-category__name')?.textContent;
    const parentPath = crumbs.slice(0, -1).join('/');
    return {
      name: treeName || h1 || crumbs[crumbs.length - 1],
      href: parentPath ? rootLink(`/${parentPath}`) : rootLink('/'),
    };
  };
  selectedHeader.setCategory(categoryInfo());

  if (config.urlpath) {
    fetchCategoryTree(config.urlpath, [visibilityFilter, ...marketplaceFilters])
      .then((tree) => {
        renderCategoryTree($categories, tree, config.urlpath);
        // The breadcrumb is generated from the URL; use the catalog's category names, as the
        // old site did (e.g. "Accounting & Finance", and "Extensions" rather than the page title).
        document.querySelectorAll('main .breadcrumb li').forEach((li) => {
          const a = li.querySelector('a[href]');
          const path = a ? new URL(a.href).pathname.replace(/^\/content/, '').replace(/^\/|\/$/g, '') : config.urlpath;
          const target = a || li.querySelector('[aria-current="page"]');
          if (target && tree.names[path]) target.textContent = tree.names[path];
        });
        // The Selected Filters pill uses the category name from the tree.
        selectedHeader.setCategory(categoryInfo());
      })
      .catch((e) => console.error('Category tree failed to load', e));
  }

  await Promise.all([
    // View Facets Button (small screens)
    UI.render(Button, {
      children: labels.Global?.Filters || 'Filters',
      icon: Icon({ source: 'Burger' }),
      variant: 'secondary',
      onClick: () => {
        $sidebar.classList.toggle('plp-sidebar--visible');
      },
    })($viewFacets),

    // Filters: the drop-in's Facets container, shown as the old site's sidebar
    provider.render(Facets, {
      slots: facetSlots({ categories: $categories, selectedHeader: selectedHeader.element }),
    })($facets),

    // Product List: Marketplace tiles (logo, Assurance badge, name, vendor, rating, partner level,
    // price). The whole tile links to the product; there is no Add to Cart on the list.
    provider.render(SearchResults, {
      routeProduct: (product) => getProductLink(product.urlKey, product.sku),
      skeletonCount: pageSize,
      slots: {
        ProductImage: tileHeaderSlot,
        ProductName: tileNameSlot,
        ProductPrice: tileFooterSlot,
        ProductActions: (ctx) => {
          ctx.replaceWith(document.createElement('span'));
        },
      },
    })($productList),
  ]);

  function render(payload) {
    const result = payload.result || {};
    const totalCount = result.totalCount || 0;
    const request = payload.request || lastRequest;
    // Searches also come from the Facets container; carry its request into sort and paging.
    if (payload.request) lastRequest = { ...lastRequest, ...payload.request };
    const currentUserFilters = (request.filter || []).filter(isUserFilter);

    block.classList.toggle('product-list-page--empty', totalCount === 0);

    renderResultsBar($results, totalCount, sortOptionFor(request.sort).value, (value) => {
      const option = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];
      runSearch({ sort: option.sort, currentPage: 1 });
    });
    renderControls($controls, result.pageInfo, request.pageSize || pageSize, (page) => {
      runSearch({ currentPage: page });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, (size) => {
      pageSize = size;
      runSearch({ pageSize: size, currentPage: 1 });
    });

    // Update the view facets button with the number of filters the visitor chose
    const userFilterCount = currentUserFilters.length;
    if (userFilterCount > 0) {
      $viewFacets.querySelector('button')?.setAttribute('data-count', userFilterCount);
    } else {
      $viewFacets.querySelector('button')?.removeAttribute('data-count');
    }
  }

  // Listen for search results (event is fired before the block is rendered; eager: true)
  events.on('search/result', render, { eager: true });

  // Listen for search results (event is fired after the block is rendered; eager: false)
  // URL is owned by this project; update it when search state changes.
  events.on('search/result', (payload) => {
    const url = new URL(window.location.href);
    applySearchStateToUrl(url, payload.request);
    window.history.pushState({}, '', url.toString());
  }, { eager: false });
}
