import { initializers } from '@dropins/tools/initializer.js';
import { initialize, setEndpoint } from '@dropins/storefront-product-discovery/api.js';
import { initializeDropin } from './index.js';
import { CS_FETCH_GRAPHQL, fetchPlaceholders } from '../commerce.js';

await initializeDropin(async () => {
  // Inherit Fetch GraphQL Instance (Catalog Service)
  setEndpoint(CS_FETCH_GRAPHQL);

  // Fetch placeholders
  const labels = await fetchPlaceholders('placeholders/search.json');
  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  // The drop-in drops the `categories` facet from its result on category pages. Keep its buckets
  // (the category's subcategories with counts) as `result.categories` for the category tree.
  const models = {
    ProductSearchResult: {
      transformer: (data) => ({
        categories: data?.productSearch?.facets
          ?.find((facet) => facet.attribute === 'categories')
          ?.buckets?.filter((bucket) => bucket.path) ?? [],
      }),
    },
  };

  // Initialize search
  return initializers.mountImmediately(initialize, { langDefinitions, models });
})();
