# Partner Directory

## Overview

The Adobe Commerce partner directory, as on the old Marketplace `/partners` page:
- a search box and a "Showing a–b of N partners" bar;
- filters for Partner Type, Certification, Solutions Type and Country, with counts. Country shows
  the top 15 options, then "Show more";
- partner tiles: partner level badge, logo, name and a "Learn More" button linking to the partner
  page;
- paging with "Results per page" (36, 72, 144).

## Configuration

Authored as a block table. Optional configuration rows come first, then one row per partner.

| Row | Cells | Description |
|-----|-------|-------------|
| `source` | URL | Partner search endpoint (`/partners-search/search` on the old site). When it answers from the page's domain, the directory is live: all partners, with search, filters, counts and paging done by the endpoint. |
| `page-size` | 36, 72 or 144 | Partners per page (default 36). |
| partner | logo, name (link), partner level, country, solution types, certifications | One authored partner. Solution types and certifications are comma-separated. |

Partner levels that get a badge: Adobe Platinum, Gold, Strategic and Silver Technology Partner, and
Adobe Gold and Silver Solution Partner. The badge images are in `/icons/partner-levels/small/`.

## Integration

- **Data source:** on load, the block makes one request to `source`, with a 4-second timeout. If the
  request fails (for example, the endpoint doesn't allow requests from this domain), the block uses
  the authored partner rows and filters, searches and pages them in the browser. `data-mode` on the
  block is `live` or `authored`.
- **Live query parameters:** `q`, `from`, `size`, `partner_level[]`, `country[]`, `makes[]` and
  `certifications[]`. The response is `{ success, total, hits[], aggregations }`.
- **Page state:** search, filter and page state isn't written to the URL.
- **Layout:** sidebar and results columns from 768px; three tiles per row from 1024px.
