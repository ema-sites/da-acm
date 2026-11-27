# Decisions needed (2026-11-27)

Open decisions for the commercemarketplace.adobe.com → Edge Delivery migration, with a
recommendation for each. Not served on the site (`*.md` is in `.hlxignore`).

## 1. Category page sort and paging: keep the custom bar, or use the drop-in's containers?

Your colleague's PR #1 left sort and paging custom, and the "drop-in first" rule says to move them to
the Product Discovery drop-in's `SortBy` and `Pagination` containers. I checked both (installed
`@dropins/storefront-product-discovery` 3.1.3). Neither has slots, so CSS is the only extension
point, and neither can show what the old site shows:

| | Old site | Drop-in container |
|---|---|---|
| Sort options | 4: Relevance, Price (Low to High), Price (High to Low), Rating (High to Low) | Every sortable store attribute, both directions: Average Ratings Score, Price, Product Name, Position, Relevance, Partner Weight, Rating, Certification, labelled "Price: Low to High" etc. |
| "Relevance" | The Marketplace custom ranking: relevance, certification, partner weight, average rating | Sorts by `relevance` alone. With no search phrase every product ties, so the order is effectively arbitrary |
| Paging | Text links "1 2 3 4 5 6 7 Next Page", 7-page window | Arrow icons and 16px numbered circles |
| Results per page | 36 / 72 / 144 selector | Not offered |

The request can't be fixed underneath either: the drop-in sends its search as a GET request, so a
request hook can't change the sort, and the sort menu is built from the store's sortable-attribute
list.

- **Recommendation: keep the custom results bar and paging** as a named gap (they still run the
  drop-in's own `search()`, so filters and tiles stay on the drop-in). Revisit when the drop-in offers
  slots or configurable sort options.
- Alternative: adopt `SortBy` and `Pagination` and accept the differences above, plus a store change
  that removes the unwanted attributes from the sortable list.

Found on the way and fixed (local, see section 9): our "Relevance" sort was partner weight,
relevance, and matched none of the old page's first 16 products. The old custom ranking reproduces
the old order exactly, on category pages and on partner profile grids (95 of 95 products for Amasty).
The Rating option also used the wrong attribute (`ext_average_rating` instead of
`ext_approximate_rating`).

## 1b. Product pages: rebuild to the old layout? (largest remaining 1:1 gap)

The 4,183 product pages (`/products/<url-key>`) still use the Commerce boilerplate's product page.
The old Marketplace product page is laid out quite differently. At 1440px it has:
- a header row: logo (96px), title, "by <seller>";
- a bordered gallery with a thumbnail strip;
- a right sidebar: **Edition** and **Your store version** selects, Product/Total price, "Add to cart",
  "Contact Vendor";
- a left "Contents" side navigation and long sections: Overview, Features, Technical
  Specifications, Quality Report, Release Notes, Support, Q&A, Reviews;
- a "Become a Adobe Commerce Partner" band above the footer.

What Catalog Service has (checked on FAQ Hub):

| Old section | Data in Catalog Service |
|---|---|
| Overview, Features | `description` (HTML) |
| Edition select and per-edition price | `ext_all_editions`, `ext_m2_community_price`, `ext_m2_enterprise_price`, `ext_m2_cloud_price` |
| Store version select, compatibility | `ext_compatibility_m2_*`, `ext_compatible_versions` |
| Release Notes, current version, updated date | `ext_all_release_notes` (JSON per version: date, compatibility), `ext_extension_versions` |
| Categories, seller | `ext_category_mapping`, `ext_developer_name` / `_id` (profile link and email: profiles sheet) |
| Ratings count | `ext_ratings_qty` |
| Quality Report, License type, Documentation / User Guide / Policy links, Stability ("Stable Build") | **not found** |
| Reviews text, Q&A | **not found** (Magento reviews and questions, not in the catalog) |

- **Option A (recommended): rebuild the product page layout** with the PDP drop-in's containers
  (header, gallery, price) and slots, plus the sections the catalog can fill. Show the remaining
  sections only once a data source exists (store export or the store's REST API through a proxy).
  This is several days of work and the biggest single fidelity gain.
- **Option B:** keep the current page and accept the difference.

## 2. Store facet settings (store team)

Remove `ext_attribute_set_id` and `ext_is_delisted_extension` from the Live Search facets (keep them
filterable). Until then a filter click lets 15–21 delisted or non-Marketplace products through. See
the PR #1 comment. Optional: ask Adobe for a "base filters" setting in the drop-in.

## 3. Old-site filter features the drop-in doesn't offer

"Show more" on long filter lists, cumulative "N & Up" ratings, "Label: value" pills, an
always-visible Clear All, Min/Max price inputs. Also store data: 4 price ranges (old site: 7), some
facets capped (Developer Id: 8 values).

- **Recommendation:** accept for launch; raise the price ranges with the store team.

## 4. The 58 products no longer in the catalog

Their old addresses (`/<url-key>`) return 404.

- **Recommendation:** redirect them to `/extensions` (or their old category, if known), so old
  links and search results land somewhere useful.

## 5. EU visitors (`show_in_eu`)

The old site hid some products from EU visitors. The new site doesn't know the visitor's region.

- **Options:** a CDN-provided country header read by the block, or show all products.

## 6. Store features that still live on Magento

`/contact-us`, cart, sign-in, checkout and `/catalogsearch` (search results). The store's GraphQL
refuses requests from the new domains.

- **Decide per feature:** route at the CDN to the Magento store, or rebuild with drop-ins (cart,
  account and checkout drop-ins exist). Needed before the domain moves.

## 7. Before the domain moves (no decision, but needs an owner)

- Product images and partner logos load from the old domain's `/media/` folder: route or copy them.
- 72 old partner addresses with `+` or `%` need CDN redirects (Edge Delivery 404s them first).
- A sitemap for template-served pages (products and partner profiles).
- Publishing live: pages plus the redirects, metadata and profiles sheets.

## 8. Partner profiles sheet size

Each profile page loads the full profiles sheet (about 740 KB).

- **Recommendation:** keep it for launch; split by first letter if page weight becomes a problem.

## 9. Small screens: copy the old site's defects?

I captured the live site at 390px (one load per template) and matched the page bodies to it. The old
mobile layout has several defects. I did **not** reproduce these:

| Old site at 390px | Ours |
|---|---|
| A fixed, empty dark bar (55–130px) covers the top of every page: page titles and the first lines are hidden under it | The dark bar holds the search box and "Powered by", in the page flow; nothing is hidden |
| Footer: all 7 link columns squeezed into one row, so the headings and links overlap; the social icons overlap each other (672px tall) | Two readable columns (1,161px tall) |
| Home slider: about 230px of empty space under the slide, and the dots overlap the "Featured Categories" heading | Dots directly under the slide |
| Home Resources cards are 6px wider than the column | Cards fit the column |
| The header row shows only the cart; "Sign In" is not visible | Cart and "Sign In" |

- **Recommendation: keep ours**, because these are layout bugs rather than design.
- Alternative: reproduce them exactly. The footer and the dark bar are the large ones.

Matched to the live mobile pages (local): no breadcrumb on category and CMS pages; the "+ Refine"
filters toggle, with the selected filters always shown; the results bar on two rows, with the Next
Page link at its top right. On the Partners page, the filters come first and the results keep the
75% column, one partner per row. On seller pages, the tabs stack and the headings are 32px. On the
503 page, the 60%/39% columns are kept, with full-width buttons. On the homepage, the headings are
30px and 26px and the Assurance icon is smaller.

## 10. Partners directory: 111 partners listed, the old site listed about 9,600

The old directory also listed every seller without a partner level ("Non-Partner", about 9,500),
from its live search endpoint. Ours lists the 111 partners authored in the page (the live endpoint
only answers on the old domain).

- **Options:** keep the 111 partners (recommended for launch: the non-partner entries have no profile
  pages); or add the non-partner sellers from the profiles sheet (820 sellers with profiles), or point
  the block at the live endpoint once the domain moves.

## 11. Fonts: one remaining difference

The old site's own "adobe-clean" family had only the Regular face. Its semibold and bold text was the
browser's synthetic bold, and its "medium" text was Regular. I now reproduce that where the old site
used it: the category page and Partners page text, legal and 503 headings, and the seller "Address"
label. Its true Bold and Medium faces stay where it used them: tile titles, tabs, the footer and the
header. The product pages still use the true faces until 1b is decided.

## 12. Waiting for your explicit request (remote or git changes)

- **Upload `metadata.json` to DA and preview it:** it now has 4,175 product rows (title = product
  name, image = product image, as on the old site) next to the 820 partner rows. Until then, product
  pages have no server-side title.
- **Upload the 8 re-imported seller pages** (`/products/<slug>`, now the profile template with the
  seller ID and the warning), the two legal pages and the 503 page (new page metadata: template,
  breadcrumb title, footer band) and the two new fragments `/fragments/become-partner` and
  `/fragments/become-partner-503` to DA, and preview them. DA still has the older versions.
- **Commit and push** the local code changes (sort fixes and the desktop and mobile critique fixes).
