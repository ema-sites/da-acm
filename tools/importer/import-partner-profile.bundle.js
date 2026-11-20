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

  // tools/importer/import-partner-profile.js
  var import_partner_profile_exports = {};
  __export(import_partner_profile_exports, {
    default: () => import_partner_profile_default
  });

  // tools/importer/parsers/notice.js
  function clean(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function lines(el) {
    const out = [];
    let current = "";
    const flush = () => {
      const t = clean(current).replace(/\s*,\s*$/, ",");
      if (t) out.push(t);
      current = "";
    };
    const walk = (node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          current += child.textContent;
        } else if (child.nodeType === 1) {
          const tag = child.tagName.toLowerCase();
          if (tag === "br") {
            flush();
          } else if (["div", "p", "li"].includes(tag)) {
            flush();
            walk(child);
            flush();
          } else {
            walk(child);
          }
        }
      });
    };
    walk(el);
    flush();
    return out;
  }
  function linesParagraph(document, textLines) {
    const p = document.createElement("p");
    textLines.forEach((line, i) => {
      if (i) p.append(document.createElement("br"));
      p.append(document.createTextNode(line));
    });
    return p;
  }
  function parseMessages(element, document) {
    const content = [];
    const messages = element.querySelectorAll(".message-warning, .message-notice, .message-error, .message-success, .message");
    const seen = /* @__PURE__ */ new Set();
    messages.forEach((msg) => {
      if ([...seen].some((s) => s.contains(msg) || msg.contains(s))) return;
      seen.add(msg);
      const text = clean(msg.textContent);
      if (!text) return;
      const p = document.createElement("p");
      const inner = msg.querySelector(":scope > div") || msg;
      inner.childNodes.forEach((n) => {
        if (n.nodeType === 3) p.append(document.createTextNode(n.textContent.replace(/\s+/g, " ")));
        else if (n.nodeType === 1 && n.tagName === "A" && n.getAttribute("href")) {
          const a = document.createElement("a");
          a.href = n.getAttribute("href");
          a.textContent = clean(n.textContent);
          p.append(a);
        } else if (n.nodeType === 1) p.append(document.createTextNode(n.textContent.replace(/\s+/g, " ")));
      });
      content.push(p);
    });
    return content;
  }
  function parseBoxProfile(element, document) {
    const content = [];
    const prev = element.previousElementSibling;
    if (prev && !prev.matches(".box-profile, .case-specifications") && prev.querySelector("img") && !clean(prev.textContent)) {
      const src = prev.querySelector("img");
      const img = document.createElement("img");
      img.src = src.getAttribute("src");
      img.alt = src.getAttribute("alt") || "";
      const p = document.createElement("p");
      p.append(img);
      content.push(p);
      if (img.alt) {
        const label = document.createElement("p");
        label.textContent = img.alt;
        content.push(label);
      }
      prev.remove();
    }
    element.querySelectorAll("a[href]").forEach((src) => {
      const text = clean(src.textContent);
      if (!text) return;
      const a = document.createElement("a");
      a.href = src.getAttribute("href");
      a.textContent = text;
      const p = document.createElement("p");
      p.append(a);
      content.push(p);
    });
    const textOnly = clean(element.textContent);
    if (!element.querySelector("a[href]") && textOnly) {
      const p = document.createElement("p");
      p.textContent = textOnly;
      content.push(p);
    }
    return content;
  }
  function parseSpecifications(element, document) {
    const content = [];
    const heading = element.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading && clean(heading.textContent)) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = clean(heading.textContent);
      content.push(h);
    }
    const boxes = element.querySelectorAll(".box");
    (boxes.length ? [...boxes] : [element]).forEach((box) => {
      const label = box.querySelector("b, strong");
      if (label && clean(label.textContent)) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = clean(label.textContent);
        p.append(strong);
        content.push(p);
      }
      const copy = box.cloneNode(true);
      copy.querySelectorAll("b, strong, h1, h2, h3, h4, h5, h6").forEach((n) => n.remove());
      copy.querySelectorAll("a[href]").forEach((a) => {
        const t = clean(a.textContent);
        if (t) {
          const p = document.createElement("p");
          const link = document.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = t;
          p.append(link);
          content.push(p);
        }
        a.remove();
      });
      const textLines = lines(copy);
      if (textLines.length) content.push(linesParagraph(document, textLines));
    });
    return content;
  }
  function parse(element, { document }) {
    let name = "notice";
    let content;
    if (element.matches(".page.messages, .messages")) {
      name = "notice (warning)";
      content = parseMessages(element, document);
    } else if (element.matches(".box-profile")) {
      content = parseBoxProfile(element, document);
    } else if (element.matches(".case-specifications")) {
      content = parseSpecifications(element, document);
    } else {
      const textLines = lines(element);
      content = textLines.length ? [linesParagraph(document, textLines)] : [];
    }
    if (!content.length) {
      element.remove();
      return;
    }
    const cells = [[content]];
    const block = WebImporter.Blocks.createBlock(document, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/partner-profile.js
  var NETWORKS = [
    ["facebook", "Facebook", /(^|\.)(facebook|fb)\.com$/i],
    ["twitter", "Twitter", /(^|\.)(twitter|x)\.com$/i],
    ["linkedin", "LinkedIn", /(^|\.)linkedin\.com$/i],
    ["youtube", "YouTube", /(^|\.)(youtube\.com|youtu\.be)$/i],
    ["instagram", "Instagram", /(^|\.)instagram\.com$/i]
  ];
  function clean2(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function networkOf(a) {
    const icon = a.querySelector('[class*="icon-"]');
    if (icon) {
      const m = icon.className.match(/icon-([a-z]+)/);
      const found = m && NETWORKS.find(([key]) => key === m[1]);
      if (found) return found;
    }
    try {
      const { hostname } = new URL(a.getAttribute("href"), "https://commercemarketplace.adobe.com/");
      return NETWORKS.find(([, , re]) => re.test(hostname));
    } catch (e) {
      return void 0;
    }
  }
  function parse2(element, { document }) {
    const logoCell = [];
    const srcImg = element.querySelector(".ico-product img, img.product-image-photo, img");
    if (srcImg) {
      const img = document.createElement("img");
      img.src = srcImg.getAttribute("src") || srcImg.getAttribute("data-src");
      img.alt = srcImg.getAttribute("alt") || "";
      logoCell.push(img);
    }
    const details = [];
    const title = element.querySelector("h1 .base, h1.page-title, h1, h2");
    const nameText = clean2(title && title.textContent);
    if (nameText) {
      const heading = document.createElement("h2");
      heading.textContent = nameText;
      details.push(heading);
    }
    element.querySelectorAll(".by-company a[href], .case-left-name a[href]").forEach((src, i, all) => {
      if ([...all].indexOf(src) !== i) return;
      const href = src.getAttribute("href");
      if (!href) return;
      const a = document.createElement("a");
      a.href = href;
      a.textContent = clean2(src.textContent) || href;
      const p = document.createElement("p");
      p.append(a);
      details.push(p);
    });
    const socialLinks = [...element.querySelectorAll(".social-list a[href]")];
    if (socialLinks.length) {
      const ul = document.createElement("ul");
      socialLinks.forEach((src) => {
        const net = networkOf(src);
        const a = document.createElement("a");
        a.href = src.getAttribute("href");
        a.textContent = clean2(src.textContent) || (net ? net[1] : a.href);
        const li = document.createElement("li");
        li.append(a);
        ul.append(li);
      });
      details.push(ul);
    }
    const cells = [[logoCell, details]];
    const block = WebImporter.Blocks.createBlock(document, { name: "partner-profile", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  function clean3(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function realSrc(img) {
    const src = img.getAttribute("src") || "";
    const dataSrc = img.getAttribute("data-src") || "";
    if ((!src || src.startsWith("data:")) && dataSrc) return dataSrc;
    return src || dataSrc;
  }
  function ratingOf(item) {
    const result = item.querySelector(".rating-result");
    if (!result) return "";
    let pct = (result.getAttribute("title") || "").match(/(\d+(?:\.\d+)?)\s*%/);
    if (!pct) {
      const span = result.querySelector('span[style*="width"]');
      pct = span && (span.getAttribute("style") || "").match(/width:\s*(\d+(?:\.\d+)?)%/);
    }
    if (!pct) {
      pct = clean3(result.textContent).match(/(\d+(?:\.\d+)?)\s*%/);
    }
    if (!pct) return "";
    return `${Math.round(Math.max(0, Math.min(100, parseFloat(pct[1]))))}%`;
  }
  function parse3(element, { document }) {
    const grid = element.querySelector(".products-grid") || element;
    let items = [...grid.querySelectorAll(":scope > .ais-hits--item")];
    if (!items.length) items = [...grid.querySelectorAll(".ais-hits--item")];
    const cells = [];
    items.forEach((item) => {
      var _a;
      if (item.closest(".products-loading, .products-empty, .products-error")) return;
      const html = item.innerHTML;
      if (html.includes("<%")) return;
      const titleEl = item.querySelector(".result-title, h3, h4");
      const title = clean3(titleEl && titleEl.textContent);
      if (!title) return;
      const imgCell = [];
      const srcImg = item.querySelector(".result-thumbnail img, img.product-item-photo");
      if (srcImg) {
        const src = realSrc(srcImg);
        if (src && !src.startsWith("data:")) {
          const img = document.createElement("img");
          img.src = src;
          img.alt = srcImg.getAttribute("alt") || title;
          imgCell.push(img);
        }
      }
      const link = item.querySelector("a.result[href]") || item.querySelector("a[href]");
      const h3 = document.createElement("h3");
      if (link) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = title;
        h3.append(a);
      } else {
        h3.textContent = title;
      }
      const badgeImg = item.querySelector(".hit-partner-badge img, .partner-badge-icon img");
      const badge = clean3(badgeImg && badgeImg.getAttribute("alt")) || clean3((_a = item.querySelector(".hit-partner-badge, .partner-badge-icon")) == null ? void 0 : _a.textContent);
      const priceEl = item.querySelector(".price-box .price, span.price, .price");
      const price = clean3(priceEl && priceEl.textContent);
      cells.push([
        imgCell,
        h3,
        ratingOf(item),
        badge,
        price
      ]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells });
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

  // tools/importer/import-partner-profile.js
  var PAGE_TEMPLATE = {
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
          '[id="partner.biography.info"]',
          ".partner.product-info-details-container > .product.info.detailed > .product-data-items .box",
          '[id="partner.products.info"]'
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
  var parsers = {
    "notice": parse,
    "partner-profile": parse2,
    "cards-product": parse3
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
  var import_partner_profile_default = {
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
  return __toCommonJS(import_partner_profile_exports);
})();
