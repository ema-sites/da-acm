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

  // Initialize search
  return initializers.mountImmediately(initialize, {
    langDefinitions,
    models: {
      Product: {
        // Product images show the extension logo (small_image); the drop-in shows images[0].
        // Its merge is per index, so this replaces only the first image's url and label.
        transformer: (data) => {
          const logo = data?.images?.find((image) => image.roles?.includes('small_image'));
          if (!logo?.url || logo === data.images[0]) return undefined;
          return { images: [{ url: logo.url.replace(/^https?:\/\//, '//'), label: logo.label || '' }] };
        },
      },
    },
  });
})();
