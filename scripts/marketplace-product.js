/**
 * Marketplace product resolution for catalog-driven product pages.
 *
 * Product pages live at /products/<url-key> and are served by one template document. The page finds
 * its product by URL key in Catalog Service, because Marketplace SKUs (vendor/module-name) can't be
 * read back from a URL. An authored SKU (page metadata `sku` or the product-details block's
 * `defaultSku`) takes precedence, so authored product pages and the DA preview keep working.
 *
 * The result also carries what the product page needs to match the old site:
 * - attributeSetId: only Marketplace extensions (attribute set 12) get a product page;
 * - delisted: delisted products are shown without Add to Cart;
 * - inPaymentsCategory: products in Payments & Security show the payment-security notice.
 */
import { CS_FETCH_GRAPHQL, getProductSku, getUrlKeyFromPath } from './commerce.js';

export const MARKETPLACE_ATTRIBUTE_SET_ID = '12';
export const PAYMENTS_CATEGORY_PATH = 'extensions/payments-security';

const PRODUCT_QUERY = `query MARKETPLACE_PRODUCT($filter: [SearchClauseInput!], $paymentsFilter: [SearchClauseInput!]) {
  product: productSearch(phrase: "", page_size: 1, filter: $filter) {
    items { productView { sku urlKey attributes(roles: []) { name value } } }
  }
  payments: productSearch(phrase: "", page_size: 1, filter: $paymentsFilter) { total_count }
}`;

let resolved;

function attributeValue(productView, name) {
  return productView?.attributes?.find((attr) => attr.name === name)?.value;
}

async function lookup() {
  const authoredSku = getProductSku();
  const urlKey = getUrlKeyFromPath();
  if (!authoredSku && !urlKey) return null;

  const clause = authoredSku
    ? { attribute: 'sku', eq: authoredSku }
    : { attribute: 'url_key', eq: urlKey };

  try {
    const { data, errors } = await CS_FETCH_GRAPHQL.fetchGraphQl(PRODUCT_QUERY, {
      method: 'GET',
      variables: {
        filter: [clause],
        paymentsFilter: [clause, { attribute: 'categoryPath', eq: PAYMENTS_CATEGORY_PATH }],
      },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));

    const productView = data?.product?.items?.[0]?.productView;
    if (!productView) return null;

    const delisted = attributeValue(productView, 'ext_is_delisted_extension');
    return {
      sku: productView.sku,
      urlKey: productView.urlKey,
      attributeSetId: attributeValue(productView, 'ext_attribute_set_id') ?? null,
      delisted: delisted === '1' || delisted === 1 || delisted === true,
      inPaymentsCategory: (data?.payments?.total_count ?? 0) > 0,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Marketplace product lookup failed', error);
    // Without the lookup, an authored SKU still renders the product; a URL key alone can't.
    return authoredSku ? {
      sku: authoredSku,
      urlKey,
      attributeSetId: null,
      delisted: false,
      inPaymentsCategory: false,
    } : null;
  }
}

/**
 * Resolves the current page's Marketplace product (cached for the page view).
 * @returns {Promise<{sku: string, urlKey: string, attributeSetId: string|null, delisted: boolean,
 *   inPaymentsCategory: boolean}|null>} The product, or null when there is none for this page.
 */
export function resolveMarketplaceProduct() {
  if (!resolved) resolved = lookup();
  return resolved;
}

/**
 * Whether a resolved product should get a product page (Marketplace extensions only).
 * @param {Object|null} product - Result of resolveMarketplaceProduct()
 * @returns {boolean}
 */
export function isListableProduct(product) {
  if (!product?.sku) return false;
  return !product.attributeSetId || String(product.attributeSetId) === MARKETPLACE_ATTRIBUTE_SET_ID;
}
