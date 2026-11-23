/**
 * Marketplace product listing: the parts of the old Marketplace category page that the Product
 * Discovery drop-in doesn't provide (product tiles, filters sidebar, results bar, paging), rendered
 * from the drop-in's search results and the catalog.
 */
import { CS_FETCH_GRAPHQL, getProductLink, rootLink } from '../../scripts/commerce.js';

/* ------------------------------------------------------------------ */
/* Product tiles                                                      */
/* ------------------------------------------------------------------ */

// Partner level lockups (from the old site), keyed by the catalog's ext_connect_partner_level_image.
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
/* Filters sidebar                                                    */
/* ------------------------------------------------------------------ */

// The old site's filters, in its order and with its titles. Other store facets are not shown.
export const FACETS = [
  { attribute: 'ext_certification', title: 'Certification' },
  { attribute: 'ext_all_editions', title: 'Edition', sort: 'alpha' },
  { attribute: 'ext_mde_compatibility', title: 'Compatibility' },
  { attribute: 'price', title: 'Price', type: 'price' },
  {
    attribute: 'ext_connect_partner_level_title',
    title: 'Partner Type',
    order: [
      'Adobe Platinum Technology Partner', 'Adobe Gold Technology Partner', 'Adobe Strategic Technology Partner',
      'Adobe Silver Technology Partner', 'Adobe Gold Solution Partner', 'Adobe Silver Solution Partner', 'Adobe Commerce',
    ],
  },
  { attribute: 'ext_approximate_rating', title: 'Ratings', type: 'rating' },
  {
    attribute: 'subscription_available', title: 'Subscription', order: ['yes', 'no'], labels: { yes: 'Yes', no: 'No' },
  },
  { attribute: 'ext_package_type', title: 'Package Type', order: ['Extension', 'App', 'Theme'] },
];

const PRICE_RANGES = [
  { from: 0, to: 50, label: 'Under $50' },
  { from: 50, to: 100, label: '$50 - $100' },
  { from: 100, to: 150, label: '$100 - $150' },
  { from: 150, to: 200, label: '$150 - $200' },
  { from: 200, to: 10100, label: '$200 - $10,100' },
  { from: 10100, to: 20000, label: '$10,100 - $20,000' },
  { from: 20000, to: 100000000, label: '$20,000 & Above' },
];

const facetTitle = (attribute) => FACETS.find((f) => f.attribute === attribute)?.title || attribute;

function bucketLabel(facet, value) {
  return facet.labels?.[value] || value;
}

function sortBuckets(facet, buckets) {
  const list = buckets.filter((b) => b.title && b.title !== 'undefined');
  if (facet.order) {
    const rank = (t) => { const i = facet.order.indexOf(t); return i === -1 ? facet.order.length : i; };
    return list.sort((a, b) => rank(a.title) - rank(b.title));
  }
  if (facet.sort === 'alpha') return list.sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

function filterFor(filters, attribute) {
  return filters.find((f) => f.attribute === attribute);
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
 * Renders the filters (everything below the category tree) for a search result.
 * @param {HTMLElement} container
 * @param {Object} result - search/result payload.result
 * @param {Array} userFilters - the visitor's filters
 * @param {(filters: Array) => void} apply - runs a search with new user filters
 */
export function renderFacets(container, result, userFilters, apply) {
  const facets = result?.facets || [];
  const groups = [];
  FACETS.forEach((facet) => {
    const data = facets.find((f) => f.attribute === facet.attribute);
    const current = filterFor(userFilters, facet.attribute);
    const others = userFilters.filter((f) => f.attribute !== facet.attribute);

    if (facet.type === 'price') {
      const group = facetGroup('plp-facet--price', facet.title);
      const ul = el('ul', 'plp-facet__items plp-facet__price-ranges');
      PRICE_RANGES.forEach((range) => {
        const li = el('li', 'plp-facet__item');
        const a = el('a', 'plp-facet__price-link');
        a.href = '#';
        const selected = current?.range && current.range.from === range.from && current.range.to === range.to;
        if (selected) li.classList.add('plp-facet__item--selected');
        a.append(el('span', 'plp-facet__indicator'), el('span', 'plp-facet__label', range.label));
        a.addEventListener('click', (e) => {
          e.preventDefault();
          apply(selected ? others : [...others, { attribute: 'price', range: { from: range.from, to: range.to } }]);
        });
        li.append(a);
        ul.append(li);
      });
      const form = el('form', 'plp-facet__price-input');
      const min = el('input');
      min.type = 'number';
      min.min = '0';
      min.placeholder = 'Min';
      min.setAttribute('aria-label', 'Minimum price');
      const max = el('input');
      max.type = 'number';
      max.min = '0';
      max.placeholder = 'Max';
      max.setAttribute('aria-label', 'Maximum price');
      if (current?.range && !PRICE_RANGES.some((r) => r.from === current.range.from && r.to === current.range.to)) {
        min.value = current.range.from;
        max.value = current.range.to;
      }
      const go = el('button', 'plp-facet__price-go', 'Go');
      go.type = 'submit';
      form.append(min, el('span', 'plp-facet__price-dash', '-'), max, go);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const from = Number(min.value) || 0;
        const to = Number(max.value) || 100000000;
        apply([...others, { attribute: 'price', range: { from, to } }]);
      });
      group.append(ul, form);
      groups.push(group);
      return;
    }

    if (!data?.buckets?.length) return;

    if (facet.type === 'rating') {
      const counts = Object.fromEntries(data.buckets.map((b) => [String(b.title), b.count || 0]));
      const group = facetGroup('plp-facet--rating', facet.title);
      const ul = el('ul', 'plp-facet__items');
      const selectedMin = current?.in?.length ? Math.min(...current.in.map(Number)) : null;
      [5, 4, 3, 2, 1].forEach((n) => {
        let count = 0;
        for (let v = n; v <= 5; v += 1) count += counts[String(v)] || 0;
        const li = el('li', 'plp-facet__item');
        if (selectedMin === n) li.classList.add('plp-facet__item--selected');
        const a = el('a', 'plp-facet__rating-link');
        a.href = '#';
        const stars = el('span', 'plp-facet__stars');
        for (let s = 1; s <= 5; s += 1) stars.append(el('span', `plp-facet__star${s <= n ? ' plp-facet__star--filled' : ''}`, s <= n ? '★' : '☆'));
        a.append(el('span', 'plp-facet__indicator'), stars, el('span', 'plp-facet__label', n < 5 ? ' & Up' : ''), countSpan(count));
        a.setAttribute('aria-label', `${n} stars${n < 5 ? ' and up' : ''} (${count})`);
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const values = [];
          for (let v = n; v <= 5; v += 1) values.push(String(v));
          apply(selectedMin === n ? others : [...others, { attribute: facet.attribute, in: values }]);
        });
        li.append(a);
        ul.append(li);
      });
      group.append(ul);
      groups.push(group);
      return;
    }

    const buckets = sortBuckets(facet, data.buckets);
    if (!buckets.length) return;
    const group = facetGroup(`plp-facet--${facet.attribute.replace(/_/g, '-')}`, facet.title);
    const ul = el('ul', 'plp-facet__items');
    const selected = new Set(current?.in || []);
    buckets.forEach((bucket) => {
      const li = el('li', 'plp-facet__item');
      const label = el('label', 'plp-facet__checkbox-label');
      const input = el('input');
      input.type = 'checkbox';
      input.value = bucket.title;
      input.checked = selected.has(bucket.title);
      input.addEventListener('change', () => {
        const next = new Set(selected);
        if (input.checked) next.add(bucket.title); else next.delete(bucket.title);
        apply(next.size ? [...others, { attribute: facet.attribute, in: [...next] }] : others);
      });
      label.append(input, el('span', 'plp-facet__label', bucketLabel(facet, bucket.title)), countSpan(bucket.count));
      li.append(label);
      ul.append(li);
    });
    group.append(ul);
    groups.push(group);
  });
  container.replaceChildren(...groups);
}

/**
 * Renders the Selected Filters box: the page's category, then the visitor's filters.
 */
export function renderSelectedFilters(container, category, userFilters, apply) {
  const header = el('div', 'plp-selected__header');
  header.append(el('span', 'plp-selected__title', 'Selected Filters'));
  const clear = el('a', 'plp-selected__clear', 'Clear All');
  clear.href = '#';
  clear.addEventListener('click', (e) => { e.preventDefault(); apply([]); });
  header.append(clear);

  const list = el('div', 'plp-selected__list');
  const pill = (labelText, valueText, onRemove, href) => {
    const a = el('a', 'plp-selected__pill');
    a.href = href || '#';
    a.title = 'Remove';
    const label = el('span', 'plp-selected__pill-label');
    label.append(el('strong', '', `${labelText}:`), ` ${valueText}`);
    a.append(el('span', 'plp-selected__remove', 'X'), label);
    if (onRemove) a.addEventListener('click', (e) => { e.preventDefault(); onRemove(); });
    list.append(a);
  };
  if (category?.name) pill('Category', category.name, null, category.parentPath ? rootLink(`/${category.parentPath}`) : rootLink('/'));
  userFilters.forEach((filter) => {
    const others = userFilters.filter((f) => f !== filter);
    const facet = FACETS.find((f) => f.attribute === filter.attribute) || {};
    if (filter.range) {
      const range = PRICE_RANGES.find((r) => r.from === filter.range.from && r.to === filter.range.to);
      pill(facetTitle(filter.attribute), range ? range.label : `$${filter.range.from} - $${filter.range.to}`, () => apply(others));
    } else if (filter.attribute === 'ext_approximate_rating') {
      const n = Math.min(...filter.in.map(Number));
      pill(facetTitle(filter.attribute), `${n}${n < 5 ? ' & Up' : ''}`, () => apply(others));
    } else {
      (filter.in || []).forEach((value) => {
        const rest = filter.in.filter((v) => v !== value);
        pill(facetTitle(filter.attribute), bucketLabel(facet, value), () => apply(rest.length ? [...others, { ...filter, in: rest }] : others));
      });
    }
  });
  container.replaceChildren(header, list);
}

/* ------------------------------------------------------------------ */
/* Category tree                                                      */
/* ------------------------------------------------------------------ */

// One search per request: Catalog Service returns no facets for aliased (multi-search) queries.
const TREE_QUERY = (filter) => `query MARKETPLACE_CATEGORY_TREE {
  productSearch(phrase: "", page_size: 1, filter: ${filter}) {
    total_count
    facets { attribute buckets { ... on CategoryView { name path count } } }
  }
}`;

const gqlFilter = (filters) => `[${filters.map((f) => {
  if (f.in) return `{attribute: ${JSON.stringify(f.attribute)}, in: ${JSON.stringify(f.in)}}`;
  return `{attribute: ${JSON.stringify(f.attribute)}, eq: ${JSON.stringify(f.eq)}}`;
}).join(', ')}]`;

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
  const filters = [baseFilters, ...chain.map((path) => [{ attribute: 'categoryPath', eq: path }, ...baseFilters])];
  const [top, ...levels] = await Promise.all(filters.map((f) => CS_FETCH_GRAPHQL
    .fetchGraphQl(TREE_QUERY(gqlFilter(f)), { method: 'GET' })
    .then(({ data }) => data?.productSearch)
    .catch(() => null)));
  const buckets = (res) => (res?.facets || []).find((f) => f.attribute === 'categories')?.buckets?.filter((b) => b.path) || [];
  const tree = {
    // Without a category filter the facet lists categories of every level; keep the top level.
    top: buckets(top).filter((b) => !b.path.includes('/')), childrenOf: {}, totals: {}, names: {},
  };
  tree.top.forEach((b) => { tree.names[b.path] = b.name; });
  chain.forEach((path, i) => {
    const res = levels[i];
    tree.totals[path] = res?.total_count ?? null;
    tree.childrenOf[path] = buckets(res);
    tree.childrenOf[path].forEach((b) => { tree.names[b.path] = b.name; });
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
      if (onPath && tree.childrenOf[item.path]?.length) li.append(build(tree.childrenOf[item.path], level + 1));
      ul.append(li);
    });
    return ul;
  };
  let top = tree.top.length ? tree.top : [{ path: chain[0], name: tree.names[chain[0]] || chain[0], count: tree.totals[chain[0]] }];
  if (!top.some((t) => t.path === chain[0])) top = [{ path: chain[0], name: tree.names[chain[0]] || chain[0], count: tree.totals[chain[0]] }, ...top];
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
