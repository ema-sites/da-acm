/* eslint-disable no-console */
/**
 * Adds bulk-metadata rows for the catalog-driven product pages (/products/<url-key>) to
 * content/metadata.json, keeping the rows for other addresses (e.g. /partner/...).
 *
 * Product pages are drawn in the browser from Catalog Service, so search engines and link
 * previews need the title and image server-side. As on the old site: the title is the product
 * name, og:image the product image, and there is no description (the catalog has no meta title
 * or description). Products outside the Marketplace attribute set (12) or not visible get no
 * page, so no row. Delisted products keep their page, so they keep a row.
 *
 * Usage: node tools/importer/build-product-metadata.js
 * Re-run when products are added; upload content/metadata.json to DA and preview it.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'content/metadata.json');
const ENDPOINT = 'https://catalog-service.adobe.io/graphql';
const HEADERS = {
  'Content-Type': 'application/json',
  'Magento-Environment-Id': '536cf842-9bc2-4438-8282-dbacb21c2f96',
  'Magento-Website-Code': 'base',
  'Magento-Store-Code': 'main_website_store',
  'Magento-Store-View-Code': 'default',
  'x-api-key': 'search_gql',
};
const FILTER = '[{attribute: "ext_attribute_set_id", eq: "12"}, {attribute: "visibility", in: ["Search", "Catalog, Search"]}]';

async function page(n) {
  const query = `{ productSearch(phrase: "", page_size: 100, current_page: ${n}, filter: ${FILTER}, sort: [{attribute: "name", direction: ASC}]) {
    page_info { total_pages } items { productView { name sku urlKey images(roles: ["image", "small_image"]) { url roles } } } } }`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(ENDPOINT, { method: 'POST', headers: HEADERS, body: JSON.stringify({ query }) });
      // eslint-disable-next-line no-await-in-loop
      const json = await resp.json();
      if (json.data?.productSearch) return json.data.productSearch;
      throw new Error(JSON.stringify(json.errors || json).slice(0, 200));
    } catch (e) {
      if (attempt === 3) throw e;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => { setTimeout(r, attempt * 2000); });
    }
  }
  return null;
}

const imageOf = (p) => {
  const img = p.images?.find((i) => i.roles?.includes('image')) || p.images?.find((i) => i.roles?.includes('small_image'));
  return img?.url ? img.url.replace(/^\/\//, 'https://') : '';
};

(async () => {
  const first = await page(1);
  const products = [...first.items];
  for (let n = 2; n <= first.page_info.total_pages; n += 1) {
    // eslint-disable-next-line no-await-in-loop
    products.push(...(await page(n)).items);
  }
  // Authored pages under /products/ (the seller pages for disabled extensions) keep their own
  // page metadata.
  const authored = (p) => fs.existsSync(path.join(ROOT, `content/products/${p.urlKey}.plain.html`));
  const rows = new Map();
  products.map((i) => i.productView).filter((p) => p?.urlKey && !authored(p)).forEach((p) => {
    rows.set(`/products/${p.urlKey}`, {
      URL: `/products/${p.urlKey}`, Title: p.name || p.sku, Description: '', Image: imageOf(p),
    });
  });

  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).data : [];
  const kept = existing.filter((r) => !String(r.URL).startsWith('/products/'));
  const data = [...kept, ...[...rows.values()].sort((a, b) => a.URL.localeCompare(b.URL))]
    .map((r) => ({
      URL: r.URL, Title: r.Title || '', Description: r.Description || '', Image: r.Image || '',
    }));
  const sheet = {
    total: data.length, limit: data.length, offset: 0, data, ':type': 'sheet',
  };
  fs.writeFileSync(OUT, `${JSON.stringify(sheet, null, 2)}\n`);
  const withImage = [...rows.values()].filter((r) => r.Image).length;
  console.log(JSON.stringify({
    products: rows.size, kept: kept.length, total: data.length, withImage,
  }));
})();
