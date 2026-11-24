/**
 * Partner directory (the old Marketplace /partners page): search, filters (Partner Type,
 * Certification, Solutions Type, Country), partner tiles and paging.
 *
 * Authored content: optional config rows (`source`, `page-size`), then one row per partner:
 * logo | name (linked to the partner page) | partner level | country | solution types |
 * certifications
 *
 * If `source` (the old site's partner search endpoint) answers from this domain, the directory is
 * live (all partners, server-side search, filters and counts). Otherwise it uses the authored rows.
 */
import { partnerPathFromOld } from '../../scripts/partner-profiles.js';

const CONFIG_KEYS = ['source', 'page-size'];
const PAGE_SIZES = [36, 72, 144];
const COUNTRY_LIMIT = 15;
const LIVE_TIMEOUT_MS = 4000;

const PARTNER_TYPES = [
  'Adobe Platinum Technology Partner', 'Adobe Gold Technology Partner', 'Adobe Strategic Technology Partner',
  'Adobe Silver Technology Partner', 'Adobe Gold Solution Partner', 'Adobe Silver Solution Partner',
  'Adobe Commerce', 'Non-Partner',
];

// Partner level badge images (from the old site), by partner level.
const BADGES = {
  'Adobe Platinum Technology Partner': 'small-platinum-technology-partner.svg',
  'Adobe Gold Technology Partner': 'small-gold-technology-partner.svg',
  'Adobe Strategic Technology Partner': 'small-strategic-technology-partner.svg',
  'Adobe Silver Technology Partner': 'small-silver-technology-partner.svg',
  'Adobe Gold Solution Partner': 'small-gold-solution-partner.svg',
  'Adobe Silver Solution Partner': 'small-silver-solution-partner.svg',
};

const FILTERS = [
  { key: 'partner_level', title: 'Partner Type', order: PARTNER_TYPES },
  { key: 'certifications', title: 'Certification' },
  { key: 'makes', title: 'Solutions Type' },
  { key: 'country', title: 'Country', limit: COUNTRY_LIMIT },
];

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const list = (text) => (text || '').split(',').map((s) => s.trim()).filter(Boolean);

/** Reads config rows and partner rows from the authored block. */
function readBlock(block) {
  const config = {};
  const partners = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = cells[0]?.textContent.trim().toLowerCase();
    if (cells.length === 2 && CONFIG_KEYS.includes(key)) {
      config[key] = cells[1].textContent.trim();
      return;
    }
    const link = row.querySelector('a[href]');
    if (!link) return;
    const img = cells[0]?.querySelector('img');
    partners.push({
      name: link.textContent.trim(),
      url: link.href,
      avatar: img?.getAttribute('src') || '',
      partner_level: cells[2]?.textContent.trim() || '',
      country: cells[3]?.textContent.trim() || '',
      makes: list(cells[4]?.textContent),
      certifications: list(cells[5]?.textContent),
    });
  });
  return { config, partners };
}

/** Partner from the live endpoint, in the same shape as an authored row. */
function fromLive(hit, sourceUrl) {
  const { origin } = new URL(sourceUrl);
  const abs = (path) => (path ? new URL(path, origin).href : '');
  return {
    name: hit.name || hit.screen_name || '',
    // Profiles live on this site: the old /partner/<name> becomes /partner/<slug>.
    url: partnerPathFromOld(hit.developer_page_url || (hit.screen_name ? `/partner/${encodeURIComponent(hit.screen_name)}` : '')),
    avatar: abs(hit.avatar),
    partner_level: hit.partner_level || '',
    country: hit.country || '',
    makes: hit.makes || [],
    certifications: hit.certifications || [],
  };
}

/* ---------------- data sources ---------------- */

function staticSource(partners) {
  const matches = (p, state, except) => FILTERS.every(({ key }) => {
    if (key === except) return true;
    const selected = state.filters[key];
    if (!selected?.length) return true;
    const values = [].concat(p[key] || []);
    return selected.some((v) => values.includes(v));
  }) && (!state.q || p.name.toLowerCase().includes(state.q.toLowerCase()));

  return async (state) => {
    const hits = partners.filter((p) => matches(p, state));
    const aggregations = {};
    FILTERS.forEach(({ key }) => {
      const counts = {};
      // Counts for a filter consider every other selected filter (as on the old site).
      partners.filter((p) => matches(p, state, key)).forEach((p) => {
        [].concat(p[key] || []).filter(Boolean).forEach((v) => {
          counts[v] = (counts[v] || 0) + 1;
        });
      });
      aggregations[key] = Object.entries(counts).map(([value, count]) => ({ key: value, count }))
        .sort((a, b) => b.count - a.count);
    });
    const from = (state.page - 1) * state.size;
    return { total: hits.length, hits: hits.slice(from, from + state.size), aggregations };
  };
}

function liveSource(sourceUrl) {
  const AGG = {
    partner_level: 'partner_levels', country: 'countries', makes: 'makes', certifications: 'certifications',
  };
  return async (state) => {
    const params = new URLSearchParams({ q: state.q || '', from: (state.page - 1) * state.size, size: state.size });
    FILTERS.forEach(({ key }) => (state.filters[key] || []).forEach((v) => params.append(`${key}[]`, v)));
    const resp = await fetch(`${sourceUrl}?${params}`, { headers: { Accept: 'application/json' } });
    const json = await resp.json();
    if (!resp.ok || !json.success) throw new Error(json.error || `Partner search failed (${resp.status})`);
    const aggregations = {};
    Object.entries(AGG).forEach(([key, aggKey]) => {
      aggregations[key] = (json.aggregations?.[aggKey] || []).filter((b) => b.key);
    });
    return {
      total: json.total || 0,
      hits: (json.hits || []).map((h) => fromLive(h, sourceUrl)),
      aggregations,
    };
  };
}

async function tryLive(sourceUrl, size) {
  if (!sourceUrl) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
  try {
    const resp = await fetch(`${sourceUrl}?q=&from=0&size=1`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const json = await resp.json();
    return resp.ok && json.success && size ? liveSource(sourceUrl) : null;
  } catch (e) {
    return null; // not reachable from this domain (e.g. no CORS): use the authored partners
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- rendering ---------------- */

function renderTile(p) {
  const tile = el('div', 'partner-directory-tile');
  const badge = el('div', 'partner-directory-badge');
  if (BADGES[p.partner_level]) {
    const img = el('img');
    img.src = `/icons/partner-levels/small/${BADGES[p.partner_level]}`;
    img.alt = p.partner_level;
    img.height = 35;
    img.loading = 'lazy';
    badge.append(img);
  }
  const logo = el('a', 'partner-directory-logo');
  logo.href = p.url;
  logo.title = p.name;
  logo.setAttribute('aria-hidden', 'true');
  logo.tabIndex = -1;
  if (p.avatar) {
    const img = el('img');
    img.src = p.avatar;
    img.alt = '';
    img.width = 140;
    img.height = 140;
    img.loading = 'lazy';
    img.addEventListener('error', () => { img.style.display = 'none'; });
    logo.append(img);
  }
  const name = el('a', 'partner-directory-name', p.name);
  name.href = p.url;
  const more = el('a', 'partner-directory-more', 'Learn More');
  more.href = p.url;
  more.setAttribute('aria-label', `Learn more about ${p.name}`);
  tile.append(badge, logo, name, more);
  return tile;
}

function renderFilters(container, aggregations, state, onChange) {
  const groups = FILTERS.map((filter) => {
    const buckets = (aggregations[filter.key] || []).slice();
    if (filter.order) {
      const rank = (k) => {
        const i = filter.order.indexOf(k);
        return i === -1 ? filter.order.length : i;
      };
      buckets.sort((a, b) => rank(a.key) - rank(b.key));
    }
    const selected = new Set(state.filters[filter.key] || []);
    // Keep selected values visible even when their count drops to zero.
    selected.forEach((v) => {
      if (!buckets.some((b) => b.key === v)) buckets.push({ key: v, count: 0 });
    });
    if (!buckets.length) return null;
    const group = el('div', 'partner-directory-facet');
    group.append(el('h3', 'partner-directory-facet-title', filter.title));
    const items = el('div', 'partner-directory-facet-items');
    const expanded = container.dataset[`expanded${filter.key}`] === 'true';
    const visible = filter.limit && !expanded ? buckets.slice(0, filter.limit) : buckets;
    visible.forEach((b) => {
      const label = el('label', 'partner-directory-facet-item');
      const input = el('input');
      input.type = 'checkbox';
      input.value = b.key;
      input.checked = selected.has(b.key);
      input.addEventListener('change', () => {
        const next = new Set(selected);
        if (input.checked) next.add(b.key); else next.delete(b.key);
        onChange({ ...state.filters, [filter.key]: [...next] });
      });
      const text = el('span', 'partner-directory-facet-label');
      text.append(input, document.createTextNode(b.key));
      label.append(text, el('span', 'partner-directory-facet-count', String(b.count)));
      items.append(label);
    });
    group.append(items);
    if (filter.limit && buckets.length > filter.limit) {
      const toggle = el('a', 'partner-directory-show-more', expanded ? 'Show less' : `Show more (${buckets.length - filter.limit})`);
      toggle.href = '#';
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        container.dataset[`expanded${filter.key}`] = expanded ? 'false' : 'true';
        renderFilters(container, aggregations, state, onChange);
      });
      group.append(toggle);
    }
    return group;
  }).filter(Boolean);
  container.replaceChildren(...groups);
}

function renderPagination(container, total, state, onPage, onSize) {
  const pages = Math.max(1, Math.ceil(total / state.size));
  const limiter = el('div', 'partner-directory-limiter');
  const label = el('label', '', 'Results per page:');
  const select = el('select');
  select.id = 'partner-directory-limiter';
  label.htmlFor = select.id;
  PAGE_SIZES.forEach((n) => {
    const opt = el('option', '', String(n));
    opt.value = String(n);
    opt.selected = n === state.size;
    select.append(opt);
  });
  select.addEventListener('change', () => onSize(Number(select.value)));
  limiter.append(label, select);

  const nav = el('nav', 'partner-directory-pagination');
  nav.setAttribute('aria-label', 'Partner pages');
  const link = (n, text, extra) => {
    const a = el('a', `partner-directory-page${extra ? ` ${extra}` : ''}`, text);
    a.href = '#';
    a.addEventListener('click', (e) => { e.preventDefault(); onPage(n); });
    return a;
  };
  if (state.page > 1) nav.append(link(state.page - 1, '← Previous', 'partner-directory-page-step'));
  const windowEnd = Math.min(pages, Math.max(10, state.page + 4));
  const windowStart = Math.max(1, windowEnd - 9);
  if (windowStart > 1) {
    nav.append(link(1, '1'));
    if (windowStart > 2) nav.append(el('span', 'partner-directory-page', '...'));
  }
  for (let n = windowStart; n <= windowEnd; n += 1) {
    if (n === state.page) {
      const cur = el('span', 'partner-directory-page partner-directory-page-current', String(n));
      cur.setAttribute('aria-current', 'page');
      nav.append(cur);
    } else nav.append(link(n, String(n)));
  }
  if (windowEnd < pages) {
    if (windowEnd < pages - 1) nav.append(el('span', 'partner-directory-page', '...'));
    nav.append(link(pages, String(pages)));
  }
  if (state.page < pages) nav.append(link(state.page + 1, 'Next →', 'partner-directory-page-step'));
  container.replaceChildren(limiter, pages > 1 ? nav : el('span'));
}

export default async function decorate(block) {
  const { config, partners } = readBlock(block);
  const size = PAGE_SIZES.includes(Number(config['page-size'])) ? Number(config['page-size']) : 36;
  const state = {
    q: '', page: 1, size, filters: {},
  };

  const sidebar = el('div', 'partner-directory-filters');
  sidebar.setAttribute('aria-label', 'Filter partners');
  const results = el('div', 'partner-directory-results');
  const search = el('input', 'partner-directory-search');
  search.type = 'search';
  search.placeholder = 'Search partners...';
  search.setAttribute('aria-label', 'Search partners');
  const stats = el('div', 'partner-directory-stats');
  const statsText = el('span');
  statsText.setAttribute('role', 'status');
  stats.append(statsText);
  const grid = el('div', 'partner-directory-grid');
  const controls = el('div', 'partner-directory-controls');
  results.append(search, stats, grid, controls);
  block.replaceChildren(sidebar, results);
  block.classList.add('partner-directory--loading');

  const live = await tryLive(config.source, size);
  const query = live || staticSource(partners);
  block.dataset.mode = live ? 'live' : 'authored';

  let requestId = 0;
  const run = async () => {
    requestId += 1;
    const id = requestId;
    block.classList.add('partner-directory--loading');
    let result;
    try {
      result = await query(state);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Partner directory search failed', e);
      result = await staticSource(partners)(state);
    }
    if (id !== requestId) return;
    block.classList.remove('partner-directory--loading');
    const from = result.total ? (state.page - 1) * state.size + 1 : 0;
    const to = Math.min(result.total, state.page * state.size);
    statsText.textContent = `Showing ${from}-${to} of ${result.total} partners`;
    grid.replaceChildren(...result.hits.map(renderTile));
    if (!result.hits.length) grid.append(el('p', 'partner-directory-empty', 'No partners match your search.'));
    renderFilters(sidebar, result.aggregations, state, (filters) => {
      state.filters = filters;
      state.page = 1;
      run();
    });
    renderPagination(controls, result.total, state, (page) => {
      state.page = page;
      run();
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, (newSize) => {
      state.size = newSize;
      state.page = 1;
      run();
    });
  };

  let debounce;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.q = search.value.trim();
      state.page = 1;
      run();
    }, 300);
  });

  await run();
}
