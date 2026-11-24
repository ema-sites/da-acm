/**
 * Marketplace product listing: the old Marketplace category page on top of the Product Discovery
 * drop-in. Product tiles and filters are drop-in slots; the category tree, results bar and paging
 * (which the drop-in doesn't provide in the old site's form) are rendered from its search results
 * and the catalog.
 */
import { CS_FETCH_GRAPHQL, getProductLink, rootLink } from '../../scripts/commerce.js';

/* ------------------------------------------------------------------ */
/* Product tiles                                                      */
/* ------------------------------------------------------------------ */

// Partner level lockups (from the old site),
// keyed by the catalog's ext_connect_partner_level_image.
const PARTNER_LEVEL_IMAGES = {
  'platinum-technology-partner.png': 'platinum-technology-partner.png',
  'gold-technology-partner.png': 'gold-technology-partner.png',
  'gold-solution-partner.png': 'gold-solution-partner.png',
  'silver-technology-partner.png': 'silver-technology-partner.png',
  'silver-solution-partner.png': 'silver-solution-partner.webp',
  'strategic-technology-partner.png': 'strategic-technology-partner.png',
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function attr(product, name) {
  return product?.attributes?.find((a) => a.name === name)?.value;
}

function formatPrice(product) {
  const amount = product?.price?.final?.amount ?? product?.priceRange?.minimum?.final?.amount;
  if (!amount || typeof amount.value !== 'number') return '';
  const value = new Intl.NumberFormat('en-US', { style: 'currency', currency: amount.currency || 'USD' }).format(amount.value);
  return attr(product, 'subscription_available') === 'yes' ? `${value} / year` : value;
}

/** Tile header: logo and, for assured extensions, the Assurance Program badge. */
export function buildTileHeader(product) {
  const header = el('div', 'plp-tile__header');
  const thumb = el('div', 'plp-tile__thumb');
  const image = product.images?.find((i) => i.roles?.includes('small_image')) || product.images?.[0];
  if (image?.url) {
    const img = el('img');
    img.src = image.url.replace(/^\/\//, 'https://');
    img.alt = product.name || '';
    img.width = 50;
    img.height = 50;
    img.loading = 'lazy';
    thumb.append(img);
  }
  header.append(thumb);
  if (String(attr(product, 'ext_is_assured')) === '1') {
    const badge = el('span', 'plp-tile__assurance');
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', 'Assurance Program');
    header.append(badge);
  }
  return header;
}

/** Tile name block: name (links the whole tile), vendor, divider. */
export function buildTileName(product) {
  const wrapper = el('div', 'plp-tile__name-block');
  const title = el('h3', 'plp-tile__title');
  const link = el('a', 'plp-tile__link', (product.name || product.sku || '').trim());
  link.href = getProductLink(product.urlKey, product.sku);
  title.append(link);
  wrapper.append(title, el('p', 'plp-tile__vendor', attr(product, 'ext_developer_name') || ''), el('hr', 'plp-tile__divider'));
  return wrapper;
}

/** Tile footer block: star rating, partner level lockup and price. */
export function buildTileFooter(product) {
  const wrapper = el('div', 'plp-tile__meta');
  const rating = Math.max(0, Math.min(5, parseFloat(attr(product, 'ext_approximate_rating')) || 0));
  const stars = el('div', 'plp-tile__rating');
  stars.setAttribute('role', 'img');
  stars.setAttribute('aria-label', `Rated ${rating} out of 5`);
  const filled = el('span', 'plp-tile__rating-filled');
  filled.style.width = `${(rating / 5) * 100}%`;
  stars.append(filled);

  const footer = el('div', 'plp-tile__footer');
  const levelImage = PARTNER_LEVEL_IMAGES[attr(product, 'ext_connect_partner_level_image')];
  const badge = el('div', 'plp-tile__partner');
  if (levelImage) {
    const img = el('img');
    img.src = `/icons/partner-levels/${levelImage}`;
    img.alt = attr(product, 'ext_connect_partner_level_title') || '';
    img.width = 90;
    img.loading = 'lazy';
    badge.append(img);
  }
  footer.append(badge);
  const price = formatPrice(product);
  if (price) footer.append(el('div', 'plp-tile__price', price));
  wrapper.append(stars, footer);
  return wrapper;
}

/* ------------------------------------------------------------------ */
/* Filters sidebar (Product Discovery drop-in Facets container slots) */
/* ------------------------------------------------------------------ */

// The old site's filters, in its order and with its titles. Other store facets are not shown.
// `order` lists the old site's value order; values not listed keep the store's order.
export const FACETS = [
  { attribute: 'ext_certification', title: 'Certification' },
  { attribute: 'ext_all_editions', title: 'Edition' },
  { attribute: 'ext_mde_compatibility', title: 'Compatibility' },
  { attribute: 'price', title: 'Price' },
  {
    attribute: 'ext_connect_partner_level_title',
    title: 'Partner Type',
    order: [
      'Adobe Platinum Technology Partner', 'Adobe Gold Technology Partner', 'Adobe Strategic Technology Partner',
      'Adobe Silver Technology Partner', 'Adobe Gold Solution Partner', 'Adobe Silver Solution Partner', 'Adobe Commerce',
    ],
  },
  { attribute: 'ext_approximate_rating', title: 'Ratings', order: ['5', '4', '3', '2', '1'] },
  { attribute: 'subscription_available', title: 'Subscription', order: ['yes', 'no'] },
  { attribute: 'ext_package_type', title: 'Package Type', order: ['Extension', 'App', 'Theme'] },
];

// Bucket labels that differ from the catalog value. The drop-in shows yes/no buckets as
// "<Facet>" / "Not <Facet>"; the old site showed "Yes" / "No".
const VALUE_LABELS = { yes: 'Yes', no: 'No' };

// Open-ended top price bucket (the old site's "$20,000 & Above").
const PRICE_OPEN_END = 100000000;

const facetConfig = (attribute) => FACETS.find((f) => f.attribute === attribute);

const formatAmount = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(value);

/** Price bucket label as on the old site: "Under $50", "$50 - $100", "$20,000 & Above". */
function priceLabel(bucket) {
  if (!bucket.from) return `Under ${formatAmount(bucket.to)}`;
  if (bucket.to == null || bucket.to >= PRICE_OPEN_END) return `${formatAmount(bucket.from)} & Above`;
  return `${formatAmount(bucket.from)} - ${formatAmount(bucket.to)}`;
}

/** Runs `fn` for the slot's current context and again whenever the drop-in updates it. */
function bindSlot(ctx, fn) {
  fn(ctx);
  ctx.onChange((next) => fn(next));
}

function facetGroup(className, title) {
  const group = el('div', `plp-facet ${className}`);
  group.append(el('div', 'plp-facet__title', title));
  return group;
}

function countSpan(count) {
  return el('span', 'plp-facet__count', String(count ?? ''));
}

/**
 * Facets container slots: show the old site's filters in its order, with its titles and labels.
 * Filtering itself (selection, search requests, Clear All) stays with the drop-in.
 * @param {{ categories: HTMLElement, selectedHeader: HTMLElement }} parts - category tree and
 *   Selected Filters header, rendered by the block and placed by the slots
 */
export function facetSlots({ categories, selectedHeader }) {
  return {
    // Category tree (navigation, not a facet) above the filters, as on the old site.
    Facets: (ctx) => {
      ctx.prependChild(categories);
    },

    // Hide store facets the old site didn't show; order the rest as on the old site.
    Facet: (ctx, element) => {
      bindSlot(ctx, ({ data }) => {
        if (!element) return;
        const index = FACETS.findIndex((f) => f.attribute === data.attribute);
        element.dataset.plpFacet = data.attribute;
        element.hidden = index === -1;
        element.style.order = String(index);
      });
    },

    FacetHeading: (ctx) => {
      const title = el('div', 'plp-facet__title');
      bindSlot(ctx, ({ data }) => {
        title.textContent = facetConfig(data.attribute)?.title || data.title;
      });
      ctx.replaceWith(title);
    },

    // Order values as on the old site.
    FacetBucket: (ctx, element) => {
      bindSlot(ctx, ({ data }) => {
        if (!element) return;
        const rank = FACETS.reduce((found, f) => {
          if (found !== -1 || !f.order) return found;
          return f.order.indexOf(data.title);
        }, -1);
        element.style.order = String(rank === -1 ? FACETS.length * 10 : rank);
      });
    },

    // "<label> <count>" as two spans (count right-aligned); old-site price labels.
    FacetBucketLabel: (ctx) => {
      const wrapper = el('span', 'plp-facet__bucket-label');
      bindSlot(ctx, ({ data }) => {
        const isRange = data.__typename === 'RangeBucket';
        const text = isRange
          ? priceLabel(data)
          : (VALUE_LABELS[data.title] || data.name || data.title);
        const label = el('span', 'plp-facet__label', text);
        label.dataset.value = data.title;
        wrapper.replaceChildren(label);
        if (!isRange && data.count != null) wrapper.append(countSpan(data.count));
      });
      ctx.replaceWith(wrapper);
    },

    // "Selected Filters" header and the page's category above the drop-in's selected filters.
    SelectedFacets: (ctx) => {
      ctx.prependChild(selectedHeader);
    },
  };
}

/**
 * Builds the Selected Filters header and the page's category pill (a link to the parent
 * category, as on the old site). The visitor's filters and Clear All come from the drop-in.
 * @returns {{ element: HTMLElement, setCategory: (category: ?{name, href}) => void }}
 */
export function buildSelectedHeader() {
  const element = el('div', 'plp-selected');
  element.append(el('div', 'plp-selected__header', 'Selected Filters'));
  const pill = el('a', 'plp-selected__pill');
  pill.title = 'Remove';
  const label = el('span', 'plp-selected__pill-label');
  pill.append(el('span', 'plp-selected__remove', 'X'), label);
  pill.hidden = true;
  element.append(pill);
  return {
    element,
    setCategory(category) {
      pill.hidden = !category?.name;
      if (!category?.name) return;
      pill.href = category.href;
      label.replaceChildren(el('strong', '', 'Category:'), ` ${category.name}`);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Category tree                                                      */
/* ------------------------------------------------------------------ */

// Without a category filter, the `categories` facet lists the categories of every level (name,
// path, count). One such search gives the whole tree; counts don't depend on the visitor's filters.
const TREE_QUERY = (filter) => `query MARKETPLACE_CATEGORY_TREE {
  productSearch(phrase: "", page_size: 1, filter: ${filter}) {
    facets { attribute buckets { ... on CategoryView { name path count } } }
  }
}`;

const gqlFilter = (filters) => `[${filters.map((f) => {
  if (f.in) return `{attribute: ${JSON.stringify(f.attribute)}, in: ${JSON.stringify(f.in)}}`;
  return `{attribute: ${JSON.stringify(f.attribute)}, eq: ${JSON.stringify(f.eq)}}`;
}).join(', ')}]`;

const parentPath = (path) => path.split('/').slice(0, -1).join('/');

// The tree is the same for every page and visitor filter, so it's kept for a few minutes in the
// session. The key includes the endpoint (with the customer group) and the store headers.
const TREE_CACHE_TTL = 5 * 60 * 1000;

async function fetchCategoryBuckets(baseFilters) {
  const query = TREE_QUERY(gqlFilter(baseFilters));
  const { endpoint, fetchGraphQlHeaders } = CS_FETCH_GRAPHQL.getConfig();
  const key = `plp-category-tree:${JSON.stringify([endpoint, fetchGraphQlHeaders, query])}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(key));
    if (cached && Date.now() - cached.time < TREE_CACHE_TTL) return cached.buckets;
  } catch { /* no usable cache entry */ }

  const res = await CS_FETCH_GRAPHQL
    .fetchGraphQl(query, { method: 'GET' })
    .then(({ data }) => data?.productSearch)
    .catch(() => null);
  const buckets = (res?.facets || []).find((f) => f.attribute === 'categories')?.buckets?.filter((b) => b.path) || [];
  if (buckets.length) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), buckets }));
    } catch { /* storage full or unavailable */ }
  }
  return buckets;
}

/**
 * Loads the category tree around a category: top-level categories, and the children of each
 * category on the path down to the current one, with product counts.
 * @param {string} categoryPath - e.g. "extensions/accounting-finance"
 * @param {Array} baseFilters - visibility and Marketplace filters (no category)
 * @returns {Promise<{top: Array, childrenOf: Object, totals: Object, names: Object}>}
 */
export async function fetchCategoryTree(categoryPath, baseFilters) {
  const parts = categoryPath.split('/');
  const chain = parts.map((_, i) => parts.slice(0, i + 1).join('/'));
  const all = await fetchCategoryBuckets(baseFilters);
  const byPath = Object.fromEntries(all.map((b) => [b.path, b]));
  const tree = {
    top: all.filter((b) => !b.path.includes('/')), childrenOf: {}, totals: {}, names: {},
  };
  all.forEach((b) => { tree.names[b.path] = b.name; });
  chain.forEach((path) => {
    tree.totals[path] = byPath[path]?.count ?? null;
    tree.childrenOf[path] = all.filter((b) => parentPath(b.path) === path);
  });
  return tree;
}

/** Renders the Categories group: top-level categories, with the current branch expanded. */
export function renderCategoryTree(container, tree, categoryPath) {
  const group = facetGroup('plp-facet--categories', 'Categories');
  const chain = categoryPath.split('/').map((_, i, all) => all.slice(0, i + 1).join('/'));
  const link = (path, name, count, level) => {
    const a = el('a', `plp-category__link${path === categoryPath ? ' plp-category__link--selected' : ''}`);
    a.href = rootLink(`/${path}`);
    if (path === categoryPath) a.setAttribute('aria-current', 'page');
    a.append(el('span', 'plp-category__name', name), countSpan(count));
    a.dataset.level = level;
    return a;
  };
  const build = (items, level) => {
    const ul = el('ul', level ? 'plp-category__children' : 'plp-facet__items plp-category__tree');
    items.forEach((item) => {
      const li = el('li', `plp-category__item plp-category__item--level-${level}`);
      const onPath = chain[level] === item.path;
      const count = onPath && tree.totals[item.path] != null ? tree.totals[item.path] : item.count;
      li.append(link(item.path, item.name, count, level));
      if (onPath && tree.childrenOf[item.path]?.length) {
        li.append(build(tree.childrenOf[item.path], level + 1));
      }
      ul.append(li);
    });
    return ul;
  };
  const rootItem = {
    path: chain[0],
    name: tree.names[chain[0]] || chain[0],
    count: tree.totals[chain[0]],
  };
  let top = tree.top.length ? tree.top : [rootItem];
  if (!top.some((t) => t.path === chain[0])) top = [rootItem, ...top];
  group.append(build(top, 0));
  container.replaceChildren(group);
}

/* ------------------------------------------------------------------ */
/* Results bar and paging                                             */
/* ------------------------------------------------------------------ */

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', sort: [{ attribute: 'ext_partner_weight', direction: 'DESC' }, { attribute: 'relevance', direction: 'DESC' }] },
  { value: 'price_ASC', label: 'Price (Low to High)', sort: [{ attribute: 'price', direction: 'ASC' }] },
  { value: 'price_DESC', label: 'Price (High to Low)', sort: [{ attribute: 'price', direction: 'DESC' }] },
  { value: 'rating_DESC', label: 'Rating (High to Low)', sort: [{ attribute: 'ext_average_rating', direction: 'DESC' }] },
];

export function sortOptionFor(sort) {
  const key = (s) => (s || []).map((x) => `${x.attribute}_${x.direction}`).join(',');
  return SORT_OPTIONS.find((o) => key(o.sort) === key(sort)) || SORT_OPTIONS[0];
}

function select(id, options, value, onChange, label) {
  const s = el('select', 'plp-select');
  s.id = id;
  s.setAttribute('aria-label', label);
  options.forEach((o) => {
    const opt = el('option', '', o.label);
    opt.value = o.value;
    if (o.value === value) opt.selected = true;
    s.append(opt);
  });
  s.addEventListener('change', () => onChange(s.value));
  return s;
}

export function renderResultsBar(container, total, sortValue, onSort) {
  const count = el('div', 'plp-results__count');
  count.append(el('strong', '', String(total)), ' Results');
  count.setAttribute('role', 'status');
  const sort = el('div', 'plp-results__sort');
  const label = el('label', 'plp-results__sort-label', 'Sort By');
  label.htmlFor = 'plp-sorter';
  sort.append(label, select('plp-sorter', SORT_OPTIONS, sortValue, onSort, 'Sort By'));
  container.replaceChildren(count, sort);
}

export function renderControls(container, pageInfo, pageSize, onPage, onPageSize) {
  const limiter = el('div', 'plp-controls__limiter');
  limiter.append(el('b', '', 'Results per page: '), select('plp-limiter', [36, 72, 144].map((n) => ({ value: String(n), label: String(n) })), String(pageSize), (v) => onPageSize(Number(v)), 'Results per page'));
  const current = pageInfo?.currentPage || 1;
  const total = pageInfo?.totalPages || 1;
  const pages = el('ul', 'plp-controls__pages');
  const pageLink = (n, text, className) => {
    const li = el('li', `plp-controls__page${className ? ` ${className}` : ''}`);
    const a = el('a', 'plp-controls__page-link', text);
    a.href = '#';
    a.addEventListener('click', (e) => { e.preventDefault(); onPage(n); });
    li.append(a);
    return li;
  };
  if (current > 1) pages.append(pageLink(current - 1, 'Previous Page', 'plp-controls__page--previous'));
  const windowSize = 7;
  let start = Math.max(1, current - Math.floor(windowSize / 2));
  const end = Math.min(total, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let n = start; n <= end; n += 1) {
    if (n === current) {
      const li = el('li', 'plp-controls__page plp-controls__page--current');
      const strong = el('strong', 'plp-controls__page-current', String(n));
      strong.setAttribute('aria-current', 'page');
      li.append(strong);
      pages.append(li);
    } else {
      pages.append(pageLink(n, String(n)));
    }
  }
  if (current < total) pages.append(pageLink(current + 1, 'Next Page', 'plp-controls__page--next'));
  container.replaceChildren(limiter, total > 1 ? pages : el('span'));
}
