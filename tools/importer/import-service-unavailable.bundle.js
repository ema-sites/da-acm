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

  // tools/importer/import-service-unavailable.js
  var import_service_unavailable_exports = {};
  __export(import_service_unavailable_exports, {
    default: () => import_service_unavailable_default
  });

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

  // tools/importer/transformers/commercemarketplace-page-corrections.js
  function pagePath(payload) {
    var _a;
    try {
      const url = new URL(((_a = payload == null ? void 0 : payload.params) == null ? void 0 : _a.originalURL) || (payload == null ? void 0 : payload.url) || "");
      return url.pathname.replace(/\/$/, "").replace(/\.html?$/, "") || "/";
    } catch (e) {
      return "";
    }
  }
  var CORRECTIONS = {
    // The source buttons only work through page scripts: make them real links.
    "/service-unavailable": (element, document) => {
      const buttons = [...element.querySelectorAll("button")];
      if (!buttons.length) return;
      const holder = buttons[0].closest("p") || buttons[0].parentElement;
      const links = buttons.map((button) => {
        const label = button.textContent.replace(/\s+/g, " ").trim();
        const home = /home page/i.test(label);
        const a = document.createElement("a");
        a.href = home ? "/" : "/service-unavailable";
        a.textContent = label;
        const wrap = document.createElement(home ? "strong" : "em");
        wrap.append(a);
        const p = document.createElement("p");
        p.append(wrap);
        return p;
      });
      holder.replaceWith(...links);
      if (!element.querySelector(".section-metadata")) {
        const meta = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: "error-page" }
        });
        element.append(meta);
      }
    }
  };
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const fix = CORRECTIONS[pagePath(payload)];
    if (fix) fix(element, element.ownerDocument || payload.document);
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
  function transform3(hookName, element, payload) {
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

  // tools/importer/import-service-unavailable.js
  var PAGE_TEMPLATE = {
    "name": "service-unavailable",
    "urls": [
      "https://commercemarketplace.adobe.com/service-unavailable"
    ],
    "description": "Error page with a short heading and message",
    "blocks": [],
    "sections": [
      {
        "id": "error-content",
        "name": "error-content",
        "selector": [
          "#maincontent .column.main"
        ],
        "style": "error-page",
        "blocks": [],
        "defaultContent": [
          "#maincontent .column.main"
        ]
      }
    ],
    "pageCleanup": {
      "https://commercemarketplace.adobe.com/service-unavailable": [
        "#onetrust-style",
        "#onetrust-consent-sdk",
        "div.ui-dialog.ui-corner-all"
      ]
    }
  };
  var parsers = {};
  var sectionTransformers = [transform3];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [transform2];
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
  var import_service_unavailable_default = {
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
  return __toCommonJS(import_service_unavailable_exports);
})();
