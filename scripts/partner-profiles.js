/**
 * Seller profiles sheet (/partner/profiles.json), shared by the profile template
 * (blocks/partner-page) and the pages that link to profiles.
 *
 * The workbook has two sheets:
 * - `data`: one row per profile (path, old-path, id, name, logo, website, social, level,
 *   level-image, email, address, about). Only the profile page loads it.
 * - `ids`: id, name and path only, small enough for any page that needs a seller's profile link.
 */

export const PROFILES_SHEET = '/partner/profiles.json';

/**
 * The new address for an old-site profile address (/partner/Adobe+Commerce ->
 * /partner/adobe-commerce). Same rule as the importer (tools/importer/build-partner-profiles.js).
 * @param {string} oldPath e.g. /partner/Adobe+Commerce
 * @returns {string}
 */
export function partnerPathFromOld(oldPath) {
  let s = (oldPath || '').replace(/^\/partner\//, '').replace(/\/+$/, '');
  try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { /* keep as is */ }
  const slug = s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `/partner/${slug}` : '/partners';
}

const cache = new Map();

async function fetchJson(url) {
  try {
    const resp = await fetch(url);
    return resp.ok ? await resp.json() : null;
  } catch (e) {
    return null;
  }
}

/**
 * Rows of one sheet of the profiles workbook.
 * The local preview serves content under /content and returns the whole workbook file.
 * @param {string} sheet `data` or `ids`
 * @param {string} [path] workbook path
 * @returns {Promise<Object[]>}
 */
export function fetchProfileRows(sheet, path = PROFILES_SHEET) {
  const key = `${path}#${sheet}`;
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      const sep = path.includes('?') ? '&' : '?';
      const json = await fetchJson(`${path}${sep}sheet=${sheet}&limit=5000`)
        || (window.location.hostname === 'localhost' ? await fetchJson(`/content${path}`) : null);
      if (!json) return [];
      if (json[':type'] === 'multi-sheet') return json[sheet]?.data || [];
      return json.data || [];
    })());
  }
  return cache.get(key);
}

/**
 * The profile address for a seller ID (Catalog Service ext_developer_id), or null if it has none.
 * @param {string|number} sellerId
 * @returns {Promise<string|null>}
 */
export async function getPartnerPath(sellerId) {
  if (!sellerId) return null;
  const rows = await fetchProfileRows('ids');
  return rows.find((r) => String(r.id) === String(sellerId))?.path || null;
}
