# Plan: partner profile pages (`/partner/<name>`)

Status (2026-11-24): **Option C chosen and built locally** (see section 6). Not yet committed,
uploaded or previewed.
Not served on the site (`*.md` is in `.hlxignore`).

## 1. What these pages are

Every directory tile on `/partners` links to a partner profile, for example
`https://commercemarketplace.adobe.com/partner/algolia`. None of these pages are in the source sitemap,
so scoping never found them. Today all 111 directory tiles still link to the old site.

A profile page has:
- **Header:** logo, name, partner level badge, website, social links and "Contact Seller" (mailto).
- **Location:** address. Not every profile has one.
- **About Seller:** a written biography. Not every profile has one.
- **All Products:** a product grid. The old site's script fills it in the browser from Catalog Service:
  `productSearch(filter: [{attribute: "ext_developer_id", eq: <partner id>}], pageSize: 500)`.
  The partner ID is on the page as `data-partner-id`, and it is the same `id` the partner search endpoint
  returns.
- **JSON-LD:** an `Organization` with the URL and contact email.

These are the same kind of page as the 8 "seller pages" already migrated. Those are the old site's view
of a disabled extension, at its product address.

## 2. Findings that shape the options

| Fact | Value | Source |
|------|-------|--------|
| Directory entries | 9,593 | `/partners-search/search` total |
| Entries with an Adobe partner level | 111 (100 of them have products) | partner search, per level |
| "Non-Partner" developer accounts | 9,482 | partner search aggregations |
| Sellers with listed products | 792 (534 with a single product, the largest with 275) | Catalog Service, all listed products by `ext_developer_id` |
| Profile fields available outside the page HTML | name, logo, partner level, country, ID, page URL | partner search endpoint |
| Profile fields only in the page HTML | website, social links, contact email, address, biography | page HTML / JSON-LD |
| Partner addresses that are not valid Edge Delivery paths | 51 of the 111 (capitals, `+`, trailing `.`) | e.g. `/partner/Adobe+Commerce`, `/partner/ae-18th-digitech-pvt-ltd.` |
| Live data from the new domains | Catalog Service: yes. Partner search: no (no CORS headers). | tested 2026-11-23 |

So:
- the **product grid can be live**, using the same query the old page runs;
- the **profile details need a copy**, because nothing the new site can call serves them;
- around **8,800 of the 9,593 accounts have no products**, and most of them have no profile content
  either.

## 3. Options

### A. Import every profile as its own page (9,593 pages)
- **How:** one document per profile, like the 8 seller pages: header, location and biography authored,
  with the product grid live from Catalog Service.
- **Cost:**
  - about 9,600 fetches through Bright Data, since the pages aren't in any capture. At the site's rate
    limit that's tens of hours;
  - about 8,800 near-empty pages.
- **Upkeep:** profile changes and new sellers need someone to re-import or author pages.
- **Not recommended.**

### B. Import the profiles that matter as pages (111 or 792)
- **How:** the same as A, but only for the 111 partner-level partners (everything the directory links
  to), or for all 792 sellers with products.
- **Cost:** 111 or 792 fetches, roughly 1 or 4–7 hours.
- **Upkeep:** the same as A, at a smaller scale.
- **Good for:** profiles where authors want to curate the content.

### C. One template driven by a profile sheet, with live products (recommended)
- **How:**
  - `/partner/<slug>` is served by a `/partner/default` template through folder mapping, as
    `/products/` is.
  - A `partner-profile` view reads the header, location and biography from a "partner profiles" sheet
    in DA: one row per partner, with slug, ID, name, logo, level, website, social links, email, address
    and biography.
  - The product grid comes live from Catalog Service by `ext_developer_id`, reusing the category page's
    tile design.
- **Data:** the sheet is seeded once. The best source is an export of the seller accounts from the store
  owners. Failing that, a crawl of the 111 or 792 profiles. After that, authors edit rows in DA, and a
  new seller is one new row.
- **SEO:** the biography is drawn in the browser. Page titles and descriptions come from a bulk metadata
  sheet generated from the same data, as planned for product pages.
- **Unknown slug** (not in the sheet): the 404 page.

### Applies to all options
- **New addresses:**
  - normalize slugs to lowercase, `+` → `-`, and strip trailing dots, e.g. `/partner/adobe-commerce`;
  - add redirects from every old address (with the original capitals, `+` or `.`) to the new one;
  - point the directory tiles at the new addresses (`import-partners.js` and the link transformer).
- **Accounts without products and without a partner level:** no page. Their old addresses redirect to
  `/partners`.
- **Disabled-extension seller pages:** the 8 authored pages at `/products/<url-key>` could later reuse the
  same profile view, plus the notice.

## 4. Decisions needed

1. **Option:** C (recommended), B with 111 or 792 profiles, or A.
2. **Profile data source:** an export from the store owners (preferred), or a crawl of the live pages.
3. **Coverage:**
   - which profiles get pages: the 111 partners, all 792 sellers with products, or every account;
   - whether accounts without products get a page or redirect to `/partners`.
4. **Addresses:** whether the normalized slugs above are acceptable.

## 5. Related: old-site features that stay on Magento

These links still go to the old store because they're store features, not content:
- `/contact-us`: needs a Magento account sign-in (`account.magento.com`);
- the cart, sign-in and checkout;
- `/catalogsearch/result` ("See all products" and search terms on profile pages).

**Before the domain moves to Edge Delivery,** decide for each one: route it at the CDN to the Magento
store, or rebuild it with drop-ins (cart, account and checkout drop-ins exist). Otherwise these
addresses will 404 on the new site.

## 6. Implementation (Option C)

### Where the old site's profile data comes from
Checked 2026-11-24. There is **no backend the new site can reuse for the profile details**:
- The profile page is rendered by Magento on the server from the seller account (screen name, logo,
  website, social links, support email, address, biography). Its scripts only switch tabs and
  scroll (`AppStore_Partners/js/partner-details`), and it embeds no data feed.
- The store GraphQL (`/graphql`) answers 403 to requests from outside the store, has no CORS for
  the new domains, and the profile isn't one of its types.
- The partner search endpoint returns only name, logo, level, country, ID and old address, and only
  to server requests with the store's Origin header (no CORS).
- **Catalog Service is reusable** and is what the old page itself uses for the product grid: the
  page's own settings carry the same endpoint, environment ID, API key and filters (attribute set
  12, visibility, not delisted) as our category pages. Every product also carries its seller's
  `ext_developer_id`, `ext_developer_name` and partner level.

So the template takes the products live from Catalog Service, and the profile details come from a
sheet seeded once from the live pages. An export of the seller accounts from the store owners would
still be a better seed (it would include sellers without products and stay exact); the sheet's
columns are the account fields, so an export can replace the crawl later.

### Coverage
Every product page on the old site links its seller ("by <seller>" and "Seller profile"), so the
directory's 111 partners are not enough: **824 profiles** are linked (111 from the directory, 713
more from product pages). All 824 were fetched on 2026-11-24: 820 have profiles, 1 is a 404 on the
old site (`commercema1679`), and 3 are the same seller linked with a trailing slash.

### What was built
| Piece | Where |
|-------|-------|
| Template block: profile from the sheet, products live, 404 for unknown sellers | `blocks/partner-page` |
| Template page (one block) | `content/partner/default` |
| Profiles workbook: `data` (full rows) and `ids` (id, name, path) | `content/partner/profiles.json` |
| Sheet builder (from saved profile pages) + redirects and metadata rows | `tools/importer/build-partner-profiles.js` |
| Shared lookups (sheet fetch, seller ID → profile, old → new address) | `scripts/partner-profiles.js` |
| Breadcrumb: Home > Partners > seller | `blocks/breadcrumb` |
| Product pages: "by <seller>" linking the profile | `blocks/product-details` |
| Directory tiles and live directory links → `/partner/<slug>` | `import-partners.js`, link transformer, `blocks/partner-directory` |

The page reuses the seller page blocks (`partner-profile`, `notice`, `cards-product`) and was
measured against the old page at 1440px: header, sidebar boxes, tab bar and headings line up within
1px. Fixes found on the way that also apply to the 8 authored seller pages: grey address text,
the All Products rule colour (`#aeafb1`), and no rule under About Seller.

### Still to do (each needs an explicit request)
1. **DA: done 2026-11-24.** `/partner/default` and the `/partner/profiles` workbook are uploaded and previewed.
2. **Site configuration: done 2026-11-24.** Folder mapping `/partner/` → `/partner/default`.
3. **Redirects: done 2026-11-24** (uploaded and previewed). The sheet's 341 profile rows don't fire
   under `/partner/`: folder mapping answers first, so the template forwards old addresses to the new
   one in the browser instead. 72 old addresses with `+` or `%` get a 404 from Edge Delivery before
   either; they need a redirect at the CDN when the domain moves.
4. **Bulk metadata:** add the title/description rows (`migration-work/partner-profiles/metadata.json`)
   to the site's metadata sheet, with the product rows.
5. **Partners page: done 2026-11-24.** Re-imported page uploaded and previewed.
6. **Code:** commit and merge the template, so the preview site draws the profiles.

### Known limits
- The `data` sheet is about 880 KB for 820 profiles and every profile view loads it (the `ids` sheet
  for product pages is about 60 KB). If that is too heavy, split `data` by first letter.
- Logos and product images still load from the old domain's `/media/` folder, like the rest of the
  catalog. They need a route or a copy before the domain moves.
- The 8 authored seller pages don't have the tab bar; they could switch to this template (a page
  with the block and a `partner` row) to pick it up.
