# Plan: catalog-driven product pages

Status: proposal for review (2026-11-20). Nothing in this plan has been built yet.
Not served on the site (`*.md` is in `.hlxignore`).

## 1. Summary

Today each of the 4,228 product pages is its own Document Authoring (DA) document. The page holds the
product code (SKU), an optional payment-security notice and SEO metadata. The product data itself
already loads from the Commerce catalog at view time.

The proposal:
- **Product pages:** replace the per-product documents with **one product template page**. The page finds
  its product from the URL. This is the model the Adobe Commerce boilerplate (the code in this repo) is
  built for.
- **Category pages (97) and seller pages (8):** keep them as authored pages.

Why:

| | One document per product (today) | One template, catalog-driven (proposed) |
|---|---|---|
| New product in the catalog | someone creates a page | works immediately |
| Product delisted or renamed | page and metadata go stale | follows the catalog |
| Links from category lists, cart, orders, recommendations | **broken** (see 2.1) | work as designed |
| Per-product hand-written content | easy | possible, but needs a rule or an exception page |
| URLs | unchanged from the old site | change; redirects needed |
| SEO metadata in the page HTML | yes | yes, via a generated metadata sheet |

## 2. Findings that shape the plan

### 2.1 The code already assumes catalog-driven product URLs
`getProductLink()` in `scripts/commerce.js` builds every product link as
`/products/<url-key>/<sanitized-sku>`. The following blocks use it:
- `product-list-page`;
- `product-recommendations`;
- the cart and mini cart;
- the wishlist;
- the orders, returns and shipping status blocks;
- the header search.

Our product pages live at `/<url-key>`. In the local preview, every product link on a category page (108
on ERP & Accounting) returns 404. **This is broken in the current setup either way.** Option A or B in
section 3 fixes it.

### 2.2 SKUs can't be put in, or derived from, the URL
- Every Marketplace SKU contains a slash (`vendor/module-name`, e.g. `mageants/module-simpleconfigurable`).
- 4,019 of 4,228 (95%) URL keys equal the SKU with `/` turned into `-`. 209 don't: dots, commas and
  underscores differ, e.g. `ae-above-the-fray-design,-inc./klaviyo-for-adobe-commerce` →
  `ae-above-the-fray-design-inc-klaviyo-for-adobe-commerce`.
- The boilerplate's `getSkuFromUrl()` only matches `[\w|-]+`, so it can't read these SKUs.

**Resolution:** look products up by URL key. `url_key` is a filterable attribute in the Marketplace's
Catalog Service, and a lookup by URL key returned the right product even for the awkward example above.
This was tested read-only.

### 2.3 The catalog is larger than the sitemap
The catalog has 4,341 products and the sitemap lists 4,228:
- 17 products are flagged `ext_is_delisted_extension = 1`;
- the rest are products the old sitemap doesn't list.

(`certiprosolutions-test-extension`, which looked like a test product, is a real listing, "CertiPro Demo &
Contact".)

With a template, **any** catalog product is reachable by URL. So the product list needs the same filtering
the current site applies, through its custom search module (`AppStore_LiveSearch`):
- visibility;
- `ext_attribute_set_id = 12`;
- not delisted;
- the EU Digital Services Act "show in EU" rule.

### 2.4 The payment-security notice follows the Payments & Security category
- All 587 product pages with the notice are in category `extensions/payments-security`.
- The category has 604 products, so 17 are in it without the notice on their page.
- So the notice can be shown by a rule ("product is in Payments & Security") instead of being authored on
  587 pages.
- None of the 17 has a product page on the old site (none is in its sitemap; one is delisted), so the rule
  reproduces the old site exactly.

### 2.5 How the old site treats delisted and disabled products
- **Delisted** (`ext_is_delisted_extension = 1`): 14 of the 17 have normal product pages in the old sitemap,
  with description and Contact Vendor but **no Add to Cart**. Its search filter ("Is Delisted") keeps them
  out of category lists.
- **Disabled** (no longer supported): the product address shows the **seller's page** with "You are
  redirected here because the extension you were trying to view was temporarily disabled…". These are the
  8 pages migrated as the partner-profile template. 3 of them are flagged delisted in the catalog, 5 are
  not.

### 2.6 Unchanged by this plan
- **The store GraphQL endpoint** (`https://commercemarketplace.adobe.com/graphql`) still needs CORS for the
  new domains, a bot-protection exemption, and the Storefront Compatibility Package. Cart, sign-in and
  checkout depend on it.
- **Category facets** currently include internal fields ("Attribute Set ID (ALS)", "Is Delisted (ALS)",
  "Developer Id", "Partner Weight"). Choose them in the store's search facet settings.

## 3. Decisions needed

1. **URL pattern for product pages. DECIDED (2026-11-20): `/products/<url-key>`.**
   - For example `/products/mageants-module-simpleconfigurable`. The page looks the product up by URL key,
     and `getProductLink()` drops the SKU segment.
   - Rejected: the boilerplate default `/products/<url-key>/<sku>`. It gives longer, repetitive URLs, and
     still needs the URL-key lookup, because sanitized SKUs can't be reversed.
   - Keeping today's root URLs (`/<url-key>`) isn't possible with a template: folder mapping works on a
     folder prefix.
2. **Per-product hand-written content. DECIDED (2026-11-20): category rule.**
   - The product page shows the payment-security notice for every product in `extensions/payments-security`.
   - The notice text lives in one authored fragment in DA, so it can still be edited.
   - The rule matches all 587 existing notice pages exactly. The 17 category products without a notice
     have no page on the old site (not in its sitemap; one is delisted), so they aren't exceptions.
   - The notice was the only per-product content found. If a product needs its own content later, add an
     authored page under `/products/`; it overrides the template for that URL.
3. **Delisted and disabled products. DECIDED (2026-11-20): match the old site.** See 2.5.
   - **Delisted products** (`ext_is_delisted_extension = 1`, 17 in the catalog) get the normal product page
     with no Add to Cart button; Contact Vendor stays. They are left out of category lists and search.
   - **The 8 disabled extensions** keep their authored seller pages, moved to `/products/<url-key>`, where
     they override the template. Their old addresses redirect there.
     - The 8 are `aheadworks-module-bambora-apac`, `aheadworks-module-reviewreminder`,
       `amasty-module-special-promotions`, and five `i95devconnect-*`: `ax365base`, `axbase`,
       `gp2015connect`, `navbases`, `sapbase`.
     - Because the catalog can't identify these (5 of the 8 aren't flagged delisted), the authored pages are
       the switch. To disable another extension later, author a page at its `/products/<url-key>`.
4. **Cut-over. DECIDED (2026-11-20): remove the per-product documents from DA now,** as a background job.
   - The 3,615 product documents in DA are removed from DA and from the aem.page preview. None was
     published live.
   - The remaining 613 local product pages are not uploaded.
   - Until the template is ready, product addresses show "page not found" on aem.page.
   - Not affected: the seller pages (including `aheadworks-module-bambora-apac`, which stays until it moves
     to `/products/`), category pages, homepage, legal pages, nav and footer.
   - The local product pages stay in the workspace for now (they are only the import's output).

## 4. Work items

### Content (DA)
1. Create the product template document `/products/default`. It holds a `product-details` block with no
   SKU, plus any shared content: default notice text, shared banners.
2. **Disabled extensions** (decision 3): move the 8 seller pages from `/<url-key>` to
   `/products/<url-key>` in DA, so they override the template.
3. **Redirects:** add a row for each of the 4,228 old product URLs, plus the 8 disabled ones, to the site's
   redirects sheet:
   - `/<url-key>` → `/products/<url-key>`;
   - `/<url-key>.html` → `/products/<url-key>`, the form the old site and search engines use.

   Generate the rows from the catalog or the import list. **Test that `.html` sources redirect** before
   relying on them.
4. **Remove the per-product documents** from DA and the preview (3,615; decision 4).
   - **Preview:** 3,614 of 3,615 removed with the bulk tool (tools.aem.live, "unpreview"), checked
     2026-11-21. `mirasvit-module-gtm` is still previewed.
   - **DA:** the documents still exist. Deleting them is still to do.
   - **Local copies:** removing them is still to be decided.
   - The list is on the branch `product-pages-unpublish-list`
     (`tools/importer/cleanup/product-pages-to-unpublish.txt`).

### Site configuration
5. **Folder mapping:** map `/products/` to `/products/default`, so every product URL serves the template
   (an admin change on the site configuration).
6. **Commerce settings:** replace the sandbox settings with the catalog the products live in. The draft is
   ready; see the conversation from 2026-11-20.

### Code (repo; ship through a branch, PR and preview link per AGENTS.md)
7. **SKU lookup:** `getProductSku()` resolves `/products/<url-key>` to a SKU through Catalog Service
   (`productSearch` filtered on `url_key`). Cache the result per page view. Keep `defaultSku` and `sku`
   metadata as overrides for authored exceptions and for the DA editor preview.
8. **Links:** `getProductLink()` returns `/products/<url-key>` (decision 1). All the blocks in 2.1 pick it
   up automatically.
9. **Not-found and gating** (decision 3):
   - unknown URL keys and products outside attribute set 12 show the 404 page;
   - delisted products show the product page without Add to Cart;
   - the product list and search apply the same filters as the current site (visibility, attribute set,
     delisted, EU rule).
10. **Notice:** the product page shows the payment-security notice for products in Payments & Security
   (rule per decision 2). Keep the text in one authored fragment, so it's still editable.
11. **Seller and home pages:** the link transformer (`tools/importer/transformers/commercemarketplace-links.js`)
    sends product links to `/products/<url-key>` instead of `/<url-key>`, then re-import those 9 pages.

### SEO
12. **Product metadata:** adapt `tools/pdp-metadata` to the new path (`products/<url-key>`) and to the
    Marketplace catalog settings. It generates the bulk-metadata sheet (title, description, image, SKU)
    that Edge Delivery puts into each product page's HTML. Run it on a schedule.
13. **Product sitemap:** `default-query.yaml` excludes `products/**` from the content sitemap. Generate a
    product sitemap from the catalog (the same job as item 12), and add it to the sitemap index.

### Importer
14. Retire the PDP branch of `tools/importer/commerce-import.js`. Keep the PLP branch for category pages.
    Update `MIGRATION_LEARNINGS.md`.

## 5. Validation
- **A sample of URL keys:** include the 209 that don't match their SKU, and check each resolves to the
  right product. Unknown URL keys show the 404 page, delisted products show without Add to Cart, and the
  8 disabled extensions show their seller pages.
- **Links:** every product link on category pages, recommendations, cart and orders opens a working product
  page.
- **Redirects:** old `/<url-key>.html` and `/<url-key>` URLs redirect (301) to `/products/<url-key>`.
- **SEO data:** view-source of a product page shows the title, description and image from the metadata
  sheet. The product sitemap lists every listed product.
- **Notice:** shown on Payments & Security products only, per the agreed rule.
- **Before/after counts:** products reachable in the new site versus the 4,228 in the old sitemap.

## 6. Effort and order
1. Decisions (section 3).
2. Code items 7–10 on a branch, tested in local preview and on the branch's aem.page preview.
3. Template page, folder mapping, then switching the Commerce settings to the real catalog.
4. Metadata and sitemap job (items 12–13).
5. Moving the 8 seller pages, redirects and the link transformer update (items 2, 3 and 11).
6. Go-live, then removal of the per-product documents (item 4).
