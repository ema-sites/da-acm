# Product List Page Block

## Overview

The Product List Page block powers search and category listing pages using the storefront-product-discovery dropin. It renders faceted search results with sort, filters, pagination, product cards (with add-to-cart and wishlist), and keeps the URL in sync with search state. The block supports two modes: **search page** (full-text search with optional filters) and **category page** (products in a category, optionally filtered).

## Configuration Options

Block configuration is read via `readBlockConfig(block)`.

| Option   | Effect |
|----------|--------|
| `urlpath` | When set, the block runs in **category page** mode: it filters by `categoryPath` and shows all products in that category. When absent, the block runs in **search page** mode and uses the `q` URL parameter as the search phrase. The value is also stored on the block as `data-urlpath` for use by other blocks (e.g. enrichment). |
| `pageSize` | Number of products per page. Defaults to `9` if not set or invalid. |

## Integration

### URL Parameters

Search state is read from and written to the URL by this project (see `search-url.js`). The dropin does not parse the URL.

| Parameter | Description |
|-----------|-------------|
| `q`       | Search phrase (search page only). |
| `page`    | Current page number (1-based). |
| `sort`    | Sort spec: comma-separated `attribute_DIRECTION` (e.g. `price_ASC,name_DESC`). |
| `filter`  | Filters: pipe-separated segments. Each segment is `attribute:value`; multiple values for the same attribute use multiple segments (e.g. `categories:val1\|categories:val2`). Supports `in` (single/multi-value) and numeric `range` (e.g. `price:0-100`). |

On load, the block normalizes the URL (e.g. filter format) with `replaceState`. After each search result, it updates the URL with `pushState` so the address bar reflects the current request.

### Events

#### Event Listeners

- `events.on('search/result', callback, { eager: true })` – Runs before the block re-renders. Updates empty-state class, result count text, and the facets button’s filter count.
- `events.on('search/result', callback, { eager: false })` – Runs after the block is rendered. Writes the search request (phrase, page, sort, filter) to the URL and calls `history.pushState`.

The block does not emit events; it calls the dropin’s `search()` API and reacts to `search/result`.

### Local Storage

This block does not use localStorage.

## Behavior Patterns

### Page Modes

- **Category page** (`config.urlpath` set): Initial search uses an empty phrase, `categoryPath` filter, visibility filter, and any sort/filter from the URL. Products are scoped to the category.
- **Search page** (no `urlpath`): Initial search uses `q` as the phrase, visibility filter, and sort/filter from the URL.

A visibility filter `{ attribute: 'visibility', in: ['Search', 'Catalog, Search'] }` is always added to the request; it is not persisted in the URL but is included when syncing the URL after each result.

### Filters sidebar (Marketplace)

The filters are the drop-in's `Facets` container, adapted to the old Marketplace sidebar with its slots (`facetSlots()` in `marketplace-plp.js`) and CSS:

- `Facet`: shows only the facets in `FACETS`, in that order (other store facets are hidden).
- `FacetHeading`: the old site's titles. `FacetBucket`: the old site's value order (`order` in `FACETS`).
- `FacetBucketLabel`: label and right-aligned count; `yes`/`no` as Yes/No; price ranges as "Under $50", "$50 - $100", "$20,000 & Above". Rating values are shown as stars by CSS.
- `SelectedFacets`: adds the "Selected Filters" header and the page's category (a link to the parent category). The visitor's filters and Clear All are the drop-in's.
- `Facets`: places the category tree (navigation, rendered by the block) above the filters.

The category tree is one Catalog Service search without a category filter (visibility and Marketplace filters only): its `categories` facet lists every level with name, path and count, which gives the top level, the children of each category on the path and each category's total. The drop-in's own search can't provide it: on category pages it is filtered by the page's category, so its facet only lists that category's children, and its counts follow the visitor's filters. The tree is kept in `sessionStorage` for 5 minutes (keyed by endpoint, customer group, store headers and query), so later category pages in the session make no tree request.

**Store configuration required:** the drop-in only keeps a request filter when its attribute is not a facet. The Marketplace base filters (`visibility`, `ext_attribute_set_id`, `ext_is_delisted_extension`) must therefore not be facets in the store's search facet settings; otherwise the first filter change drops them. Price ranges and the value order of facets without an `order` list also come from those settings.

### User Interaction Flows

1. **Initial load**: Block reads URL via `getSearchStateFromUrl`, normalizes the URL, then calls `search()` with phrase, page, sort, and filter (including visibility and, on category pages, categoryPath).
2. **Sort change**: User changes sort via SortBy; dropin calls `search()` with updated sort; block receives `search/result` and updates the URL.
3. **Filter change**: User toggles facets in the drop-in's Facets container; the drop-in calls `search()` with the updated filter (keeping every filter whose attribute isn't a facet, such as the base filters); block updates result count and URL.
4. **Pagination**: User changes page; dropin calls `search()` with new page; block scrolls to top and URL is updated.
5. **Add to cart / wishlist**: Product cards include add-to-cart and wishlist actions; cart and wishlist behavior are handled by their respective dropins. For simple products, the add-to-cart button is disabled when `product.inStock` is falsy. Complex products always link to the PDP where stock is validated by the PDP drop-in.

### Error Handling

- **Search API errors**: Initial `search()` calls are wrapped in `.catch()`; errors are logged with `console.error('Error searching for products', e)`. The block does not show an inline error UI; the dropin may show its own state.
- **Missing payload**: Result count and filter-count updates guard with `payload.result?.totalCount`, `payload.request?.phrase`, and `payload.request.filter.length` where appropriate.
