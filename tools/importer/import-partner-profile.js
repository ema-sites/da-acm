/* eslint-disable */
/* global WebImporter */

import noticeParser from './parsers/notice.js';
import partnerProfileParser from './parsers/partner-profile.js';
import cardsProductParser from './parsers/cards-product.js';
import commercemarketplaceCleanupTransformer from './transformers/commercemarketplace-cleanup.js';
import commercemarketplaceLinksTransformer from './transformers/commercemarketplace-links.js';
import commercemarketplaceSectionsTransformer from './transformers/commercemarketplace-sections.js';

const PAGE_TEMPLATE = {
  "name": "partner-profile",
  "urls": [
    "https://commercemarketplace.adobe.com/aheadworks-module-bambora-apac.html",
    "https://commercemarketplace.adobe.com/aheadworks-module-reviewreminder.html",
    "https://commercemarketplace.adobe.com/amasty-module-special-promotions.html",
    "https://commercemarketplace.adobe.com/i95devconnect-ax365base.html",
    "https://commercemarketplace.adobe.com/i95devconnect-axbase.html",
    "https://commercemarketplace.adobe.com/i95devconnect-gp2015connect.html",
    "https://commercemarketplace.adobe.com/i95devconnect-navbases.html",
    "https://commercemarketplace.adobe.com/i95devconnect-sapbase.html"
  ],
  "description": "Seller profile page: warning notice, seller header with logo and badge, about text with a location sidebar, and a grid of the seller's product cards",
  "blocks": [
    {
      "name": "notice",
      "instances": [
        "#maincontent > .page.messages",
        ".partner.product-info-details-container > .product-info-main > .box-profile",
        ".partner.product-info-details-container > .product-info-main > .case-specifications"
      ],
      "pageInstances": {
        "https://commercemarketplace.adobe.com/aheadworks-module-bambora-apac.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ],
        "https://commercemarketplace.adobe.com/aheadworks-module-reviewreminder.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ],
        "https://commercemarketplace.adobe.com/amasty-module-special-promotions.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-ax365base.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-axbase.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-gp2015connect.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-navbases.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-sapbase.html": [
          "#maincontent > div.page.messages",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.box-profile.box.box--lightgray.text-center",
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product-info-main > div.case-specifications"
        ]
      }
    },
    {
      "name": "partner-profile",
      "instances": [
        ".partner.product-info-details-container > .product.media"
      ],
      "pageInstances": {
        "https://commercemarketplace.adobe.com/aheadworks-module-bambora-apac.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ],
        "https://commercemarketplace.adobe.com/aheadworks-module-reviewreminder.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ],
        "https://commercemarketplace.adobe.com/amasty-module-special-promotions.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-ax365base.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-axbase.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-gp2015connect.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-navbases.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-sapbase.html": [
          "#maincontent > div.columns > div > div.partner.product-info-details-container.abs-add-clearfix > div.product.media"
        ]
      }
    },
    {
      "name": "cards-product",
      "instances": [
        "#instant-search-results-container"
      ],
      "pageInstances": {
        "https://commercemarketplace.adobe.com/aheadworks-module-bambora-apac.html": [
          "#instant-search-results-container"
        ],
        "https://commercemarketplace.adobe.com/aheadworks-module-reviewreminder.html": [
          "#instant-search-results-container"
        ],
        "https://commercemarketplace.adobe.com/amasty-module-special-promotions.html": [
          "#instant-search-results-container"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-ax365base.html": [
          "#instant-search-results-container"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-axbase.html": [
          "#instant-search-results-container"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-gp2015connect.html": [
          "#instant-search-results-container"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-navbases.html": [
          "#instant-search-results-container"
        ],
        "https://commercemarketplace.adobe.com/i95devconnect-sapbase.html": [
          "#instant-search-results-container"
        ]
      }
    }
  ],
  "sections": [
    {
      "id": "page-title",
      "name": "page-title",
      "selector": [
        "#maincontent > .page-title-wrapper"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "#maincontent > .page-title-wrapper"
      ]
    },
    {
      "id": "redirect-notice",
      "name": "redirect-notice",
      "selector": [
        "#maincontent > .page.messages"
      ],
      "style": null,
      "blocks": [
        "notice"
      ],
      "defaultContent": []
    },
    {
      "id": "seller-profile",
      "name": "seller-profile",
      "selector": [
        "#maincontent > .columns"
      ],
      "style": null,
      "blocks": [
        "partner-profile",
        "notice",
        "cards-product"
      ],
      "defaultContent": [
        ".partner.product-info-details-container > .product-info-main > div:first-child",
        "[id=\"partner.biography.info\"]",
        ".partner.product-info-details-container > .product.info.detailed > .product-data-items .box",
        "[id=\"partner.products.info\"]"
      ]
    }
  ],
  "pageCleanup": {
    "https://commercemarketplace.adobe.com/aheadworks-module-bambora-apac.html": [
      "#onetrust-style",
      "#onetrust-consent-sdk",
      "div.ui-dialog.ui-corner-all"
    ],
    "https://commercemarketplace.adobe.com/aheadworks-module-reviewreminder.html": [
      "#onetrust-style",
      "#onetrust-consent-sdk",
      "div.ui-dialog.ui-corner-all"
    ],
    "https://commercemarketplace.adobe.com/i95devconnect-ax365base.html": [
      "#onetrust-style",
      "#onetrust-consent-sdk",
      "div.ui-dialog.ui-corner-all"
    ],
    "https://commercemarketplace.adobe.com/i95devconnect-axbase.html": [
      "#onetrust-style",
      "#onetrust-consent-sdk"
    ],
    "https://commercemarketplace.adobe.com/i95devconnect-gp2015connect.html": [
      "#onetrust-style",
      "#onetrust-consent-sdk",
      "div.ui-dialog.ui-corner-all"
    ],
    "https://commercemarketplace.adobe.com/i95devconnect-navbases.html": [
      "#onetrust-style",
      "#onetrust-consent-sdk",
      "div.ui-dialog.ui-corner-all"
    ],
    "https://commercemarketplace.adobe.com/i95devconnect-sapbase.html": [
      "#onetrust-style",
      "#onetrust-consent-sdk"
    ]
  }
};

const parsers = {
  'notice': noticeParser,
  'partner-profile': partnerProfileParser,
  'cards-product': cardsProductParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [commercemarketplaceSectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// Page corrections ({sitename}-page-corrections.js, when it exists) run last.
const correctionTransformers = [];
// Links to migrated pages become site-relative (afterTransform), before page corrections.
const transformers = [commercemarketplaceCleanupTransformer, ...lateTransformers, commercemarketplaceLinksTransformer, ...correctionTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};

