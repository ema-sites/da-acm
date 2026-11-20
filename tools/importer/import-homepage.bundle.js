/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-promo.js
  function clean(text) {
    return (text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function cleanHref(href) {
    return (href || "").trim().replace(/(%20|\s)+$/i, "");
  }
  function slideImageUrl(wrapper, styles) {
    if (!wrapper) return "";
    const data = wrapper.getAttribute("data-background-images") || "";
    const m = data.match(/desktop_image\\*"\s*:\s*\\*"([^"\\]+)/);
    if (m) return m[1];
    const inline = (wrapper.getAttribute("style") || "").match(/background-image:\s*url\(\s*['"]?([^'")]+)/i);
    if (inline) return inline[1];
    const cls = [...wrapper.classList].find((c) => c.startsWith("background-image-"));
    if (cls) {
      const re = new RegExp(`\\.${cls}\\s*\\{[^}]*background-image:\\s*url\\(\\s*['"]?([^'")]+)`);
      const r = styles.match(re);
      if (r) return r[1];
    }
    return "";
  }
  function parse(element, { document }) {
    const styles = [...element.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    const notCloned = (el) => !el.closest(".slick-cloned");
    const slides = [...element.querySelectorAll('[data-content-type="slide"]')].filter(notCloned);
    const wrappers = [...element.querySelectorAll(".pagebuilder-slide-wrapper")].filter(notCloned);
    const links = [...element.querySelectorAll('a[data-element="link"][href]')].filter(notCloned);
    const buttons = [...element.querySelectorAll(".pagebuilder-slide-button")].filter(notCloned);
    const posters = [...element.querySelectorAll('.pagebuilder-poster-content [data-element="content"], .pagebuilder-collage-content [data-element="content"]')].filter(notCloned);
    const count = Math.max(slides.length, wrappers.length);
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    for (let i = 0; i < count; i += 1) {
      const slide = slides[i];
      const name = clean(slide && slide.getAttribute("data-slide-name"));
      const imageUrl = slideImageUrl(wrappers[i], styles);
      const href = cleanHref(links[i] && links[i].getAttribute("href"));
      const buttonText = clean(buttons[i] && buttons[i].textContent);
      const key = `${imageUrl}|${href}`;
      if (!imageUrl && !buttonText || seen.has(key)) continue;
      seen.add(key);
      const imageCell = [];
      if (imageUrl) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = name;
        imageCell.push(img);
      }
      const content = [];
      const poster = posters[i];
      if (poster) {
        poster.querySelectorAll("img[src]").forEach((src) => {
          const img = document.createElement("img");
          img.src = src.getAttribute("src");
          img.alt = src.getAttribute("alt") || "";
          content.push(img);
        });
        const textEls = poster.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
        textEls.forEach((src) => {
          const t = clean(src.textContent);
          if (!t) return;
          const el = document.createElement(src.tagName.toLowerCase());
          el.textContent = t;
          content.push(el);
        });
        if (!textEls.length && clean(poster.textContent)) {
          const p = document.createElement("p");
          p.textContent = clean(poster.textContent);
          content.push(p);
        }
      }
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = buttonText || name || "Learn more";
        const p = document.createElement("p");
        p.append(a);
        content.push(p);
      }
      cells.push([imageCell, content]);
    }
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-category.js
  var ICON_BY_CLASS = {
    "icon-gar": "mp-customer-support",
    "icon-lock": "mp-payments-security",
    "icon-met": "mp-marketing",
    "icon-cal": "mp-accounting-finance",
    "icon-truck": "mp-shipping-fulfillment",
    "icon-clock": "mp-site-optimization"
  };
  var ICON_BY_SLUG = {
    "customer-support": "mp-customer-support",
    "payments-security": "mp-payments-security",
    "marketing-automation-email-marketing": "mp-marketing",
    "accounting-finance": "mp-accounting-finance",
    "shipping-fulfillment": "mp-shipping-fulfillment",
    "site-optimization": "mp-site-optimization"
  };
  function clean2(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function toSiteRelative(href) {
    try {
      const url = new URL(href, "https://commercemarketplace.adobe.com/");
      if (url.hostname !== "commercemarketplace.adobe.com") return href;
      return `${url.pathname.replace(/\.html$/i, "")}${url.search}${url.hash}`;
    } catch (e) {
      return href;
    }
  }
  function iconName(link, path) {
    const span = link.querySelector('span[class*="icon-"]');
    if (span) {
      const cls = [...span.classList].find((c) => ICON_BY_CLASS[c]);
      if (cls) return ICON_BY_CLASS[cls];
    }
    const slug = (path.split(/[?#]/)[0].split("/").pop() || "").toLowerCase();
    return ICON_BY_SLUG[slug] || "";
  }
  function parse2(element, { document }) {
    const cells = [];
    let links = [...element.querySelectorAll(":scope > .col a[href]")];
    if (!links.length) links = [...element.querySelectorAll("a[href]")];
    links.forEach((link) => {
      const labelEl = link.querySelector(".text-link");
      const label = clean2(labelEl ? labelEl.textContent : link.textContent);
      if (!label) return;
      const href = toSiteRelative(link.getAttribute("href").trim());
      const icon = iconName(link, href);
      const iconCell = [];
      if (icon) {
        const p2 = document.createElement("p");
        p2.textContent = `:${icon}:`;
        iconCell.push(p2);
      }
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      const p = document.createElement("p");
      p.append(a);
      cells.push([iconCell, [p]]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-category", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-program.js
  var ICON_BY_CLASS2 = {
    "icon-assurance-program": "mp-assurance-program",
    "icon-arm": "mp-partner-program",
    "icon-Training": "mp-training",
    "icon-certif": "mp-certification"
  };
  var ICON_BY_TITLE = {
    "assurance program": "mp-assurance-program",
    "partner program": "mp-partner-program",
    training: "mp-training",
    certification: "mp-certification"
  };
  function clean3(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function iconName2(card, title) {
    const spans = [...card.querySelectorAll('span[class*="icon-"]')];
    for (let i = 0; i < spans.length; i += 1) {
      const cls = [...spans[i].classList].find((c) => ICON_BY_CLASS2[c]);
      if (cls) return ICON_BY_CLASS2[cls];
    }
    return ICON_BY_TITLE[title.toLowerCase()] || "";
  }
  function parse3(element, { document }) {
    const cells = [];
    element.querySelectorAll(":scope > .col").forEach((card) => {
      const headingEl = card.querySelector("h1, h2, h3, h4, h5, h6");
      const title = clean3(headingEl && headingEl.textContent);
      const body = [];
      if (title) {
        const h3 = document.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      card.querySelectorAll(".txt p").forEach((src) => {
        const t = clean3(src.textContent);
        if (!t) return;
        const p = document.createElement("p");
        p.textContent = t;
        body.push(p);
      });
      const link = card.querySelector(".actions a[href]") || card.querySelector("a[href]");
      if (link && clean3(link.textContent)) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href").trim();
        a.textContent = clean3(link.textContent);
        const p = document.createElement("p");
        p.append(a);
        body.push(p);
      }
      if (!body.length) return;
      const icon = iconName2(card, title);
      const iconCell = [];
      if (icon) {
        const p = document.createElement("p");
        p.textContent = `:${icon}:`;
        iconCell.push(p);
      }
      cells.push([iconCell, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-program", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/commercemarketplace-cleanup.js
  var CATALOG_CLEANUP_RULES = [
    '[id*="onetrust"]',
    // cookie-banner
    '[role="dialog"]'
    // popup
  ];
  var CHROME_SELECTORS = [
    "header.page-header",
    "footer",
    "footer.page-footer",
    "div.after-header-container",
    "div.breadcrumbs",
    "a.action.skip",
    "a.skip-link",
    ".skip-link",
    "#ot-cookie-button",
    "#ot-cookie-settings",
    // Magento hidden UI: cookie-status message and the sign-in popup template
    "#cookie-status",
    ".cookie-status-message",
    "#authenticationPopup",
    ".block-authentication",
    // In-page tab links and "Back to top" anchors point at source-only ids
    ".product-info-nav",
    "a.box-back-top",
    '[id*="onetrust"]',
    "script",
    "style",
    "noscript",
    "link",
    "template"
  ];
  function pageKey(u) {
    try {
      const { origin, pathname } = new URL(u);
      return `${origin}${pathname.replace(/\/$/, "")}`;
    } catch (e) {
      return u;
    }
  }
  function currentUrl(payload) {
    return payload && payload.params && payload.params.originalURL || payload && payload.url || "";
  }
  function removeAll(root, selectors) {
    selectors.forEach((selector) => {
      let found = [];
      try {
        found = root.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      found.forEach((el) => el.remove());
    });
  }
  function isKnockoutComment(text) {
    const t = (text || "").trim();
    return /^\/?\s*ko(\s|$)/.test(t);
  }
  function removeKnockoutComments(doc, root) {
    const SHOW_COMMENT = 128;
    const walker = doc.createTreeWalker(root, SHOW_COMMENT);
    const comments = [];
    let node = walker.nextNode();
    while (node) {
      if (isKnockoutComment(node.nodeValue)) comments.push(node);
      node = walker.nextNode();
    }
    comments.forEach((c) => c.remove());
  }
  function transform(hookName, element, payload) {
    const doc = payload && payload.document || element.ownerDocument;
    if (hookName === "beforeTransform") {
      const template = payload && payload.template || {};
      const pageCleanup = template.pageCleanup || {};
      const key = pageKey(currentUrl(payload));
      const entry = Object.entries(pageCleanup).find(([u]) => pageKey(u) === key);
      if (entry) {
        entry[1].forEach((selector) => {
          let found = [];
          try {
            found = doc.querySelectorAll(selector);
          } catch (e) {
            return;
          }
          if (found.length === 1) found[0].remove();
        });
      } else {
        const main = doc.querySelector("main");
        CATALOG_CLEANUP_RULES.forEach((rule) => {
          let found = [];
          try {
            found = doc.querySelectorAll(rule);
          } catch (e) {
            return;
          }
          found.forEach((el) => {
            if (main && (main === el || main.contains(el) || el.contains(main))) return;
            if (el === doc.body || el === doc.documentElement || el.tagName === "HEAD") return;
            el.remove();
          });
        });
      }
    }
    if (hookName === "afterTransform") {
      removeAll(element, CHROME_SELECTORS);
      removeKnockoutComments(doc, element);
      element.querySelectorAll("[data-bind], [data-mage-init], [x-magento-init]").forEach((el) => {
        el.removeAttribute("data-bind");
        el.removeAttribute("data-mage-init");
        el.removeAttribute("x-magento-init");
      });
      element.querySelectorAll("[data-track], [data-analytics], [data-gtm], [onclick]").forEach((el) => {
        ["data-track", "data-analytics", "data-gtm", "onclick"].forEach((a) => el.removeAttribute(a));
      });
    }
  }

  // tools/importer/transformers/commercemarketplace-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const selector of selectors) {
      if (!selector) continue;
      try {
        const el = root.querySelector(selector);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && template.sections || [];
    if (sections.length < 2) return;
    const doc = payload && payload.document || element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(element, section);
        if (!el || !el.parentNode) continue;
        if (i === 0 && !section.style) continue;
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (section.style) {
          const anchor = marker || findSectionElement(element, section);
          if (anchor && anchor.parentNode) {
            const meta = WebImporter.Blocks.createBlock(doc, {
              name: "Section Metadata",
              cells: { style: section.style }
            });
            let next = anchor.nextElementSibling;
            if (marker) {
              while (next && next.tagName !== "HR") next = next.nextElementSibling;
              if (next) next.parentNode.insertBefore(meta, next);
              else anchor.parentNode.appendChild(meta);
            } else {
              anchor.after(meta);
            }
          }
        }
        if (marker) {
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    "name": "homepage",
    "urls": [
      "https://commercemarketplace.adobe.com/"
    ],
    "description": "Site landing page with promotional banner and featured product listings",
    "blocks": [
      {
        "name": "carousel-promo",
        "instances": [
          "#maincontent > .widget.block.block-banners"
        ],
        "pageInstances": {
          "https://commercemarketplace.adobe.com/": [
            "#maincontent > div.widget.block.block-banners"
          ]
        }
      },
      {
        "name": "cards-category",
        "instances": [
          "#maincontent > .widget.block.block-static-block .fotorama"
        ],
        "pageInstances": {
          "https://commercemarketplace.adobe.com/": [
            "#maincontent > div.widget.block.block-static-block > section > div > div"
          ]
        }
      },
      {
        "name": "cards-program",
        "instances": [
          "#maincontent section.case-resources .col-box"
        ],
        "pageInstances": {
          "https://commercemarketplace.adobe.com/": [
            "#maincontent > div.columns > div > div:nth-child(4) > section > div > div > div"
          ]
        }
      }
    ],
    "sections": [
      {
        "id": "promo-carousel",
        "name": "promo-carousel",
        "selector": [
          "#maincontent > .widget.block.block-banners"
        ],
        "style": null,
        "blocks": [
          "carousel-promo"
        ],
        "defaultContent": []
      },
      {
        "id": "featured-categories",
        "name": "featured-categories",
        "selector": [
          "#maincontent > .widget.block.block-static-block"
        ],
        "style": null,
        "blocks": [
          "cards-category"
        ],
        "defaultContent": [
          "#maincontent > .widget.block.block-static-block > section > div > h2"
        ]
      },
      {
        "id": "resources",
        "name": "resources",
        "selector": [
          "#maincontent section.case-resources"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-program"
        ],
        "defaultContent": [
          "#maincontent section.case-resources > div > div > h2",
          "#maincontent section.case-resources h2:not(.col-box h2)"
        ]
      }
    ],
    "pageCleanup": {
      "https://commercemarketplace.adobe.com/": [
        "#onetrust-style",
        "#onetrust-consent-sdk",
        "div.ui-dialog.ui-corner-all"
      ]
    }
  };
  var parsers = {
    "carousel-promo": parse,
    "cards-category": parse2,
    "cards-program": parse3
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [];
  var transformers = [transform, ...lateTransformers, ...correctionTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey2 = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey2(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      matches.forEach((element) => {
        if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    };
    template.blocks.forEach((blockDef) => {
      const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey2(u) === key);
      (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
    });
    template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
    return pageBlocks;
  }
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_homepage_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
