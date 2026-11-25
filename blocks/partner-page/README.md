# partner-page

Custom block. Purpose: the seller profile template. Every `/partner/<slug>` address is served by the
`/partner/default` document (folder mapping `/partner/` → `/partner/default`), which holds this block.

## What it renders

The profile row whose `path` matches the page address (or whose `old-path` does) in the profiles
workbook `/partner/profiles.json`, sheet `data`:

- page title (h1), then a `partner-profile` header (logo, name, website, social links);
- `notice` boxes: partner level badge and "Contact Seller" (mail link), then Location (address);
- an "About Seller | All Products" tab bar (kept in this block);
- the biography, then the seller's products: the Product Discovery drop-in's `SearchResults`
  container (search scope `partner`), searched by `ext_developer_id` for listed Marketplace
  extensions, by name, up to 500. Tiles use the category pages' slots
  (`scripts/marketplace-tiles.js`, styles in `styles/marketplace-tiles.css`) without the vendor line,
  as on the old profile tiles.

The header and boxes reuse the seller page blocks, so the page looks like the migrated seller pages. A seller
without a row goes to the 404 page. The breadcrumb reads Home > Partners > seller name.

## Authoring (Document Authoring)

Model: `standalone` (key/value rows, all optional).

| Row | Value |
|-----|-------|
| `profiles` | workbook path (default `/partner/profiles.json`) |
| `partner` | show this profile slug instead of the one in the address (for an authored page) |

On the template itself, `/partner/default?partner=<slug>` previews any profile.

## The profiles workbook

Sheet `data` columns: `path`, `old-path`, `id` (seller ID), `name`, `logo`, `website`, `social` (one
URL per line), `level`, `level-image` (old file name, e.g. `gold-technology-partner.png`), `email`,
`address` (one line per line), `about` (paragraphs separated by a blank line).

Sheet `ids` (`id`, `name`, `path`) is the small lookup product pages use for their "by <seller>" link.
Keep it in step with `data`. `tools/importer/build-partner-profiles.js` builds both.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
