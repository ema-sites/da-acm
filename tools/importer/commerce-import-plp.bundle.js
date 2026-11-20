/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/commerce-import.js
  var commerce_import_exports = {};
  __export(commerce_import_exports, {
    default: () => commerce_import_default
  });
  function readJsonLdProduct(document) {
    const found = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try {
        const data = JSON.parse(s.textContent);
        const walk = (node) => {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) {
            node.forEach(walk);
            return;
          }
          const type = node["@type"];
          if (type === "Product" || Array.isArray(type) && type.includes("Product")) found.push(node);
          Object.values(node).forEach(walk);
        };
        walk(data);
      } catch (e) {
      }
    });
    return found[0] || null;
  }
  function meta(document, name) {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? (el.getAttribute("content") || "").trim() : "";
  }
  function pagePath(url) {
    const { pathname } = new URL(url);
    return pathname.replace(/\.html?$/i, "").replace(/\/+$/, "") || "/";
  }
  function findSku(document, ldProduct) {
    if (ldProduct && ldProduct.sku) return String(ldProduct.sku).trim();
    const attr = document.querySelector("[data-sku], [data-product-sku]");
    if (attr) return (attr.getAttribute("data-sku") || attr.getAttribute("data-product-sku") || "").trim();
    const m = (document.body.textContent || "").match(/\bSKU:\s*([\w\-/.]+)/i);
    return m ? m[1] : "";
  }
  function buildNotice(document, el) {
    const p = document.createElement("p");
    [...el.childNodes].forEach((n) => p.append(n.cloneNode(true)));
    return WebImporter.DOMUtils.createTable([["notice"], [p]], document);
  }
  function buildMetadata(document, fields) {
    const rows = [["Metadata"]];
    Object.entries(fields).forEach(([k, v]) => {
      if (v) rows.push([k, v]);
    });
    return WebImporter.DOMUtils.createTable(rows, document);
  }
  var commerce_import_default = {
    // <script> elements are removed before transform, so read JSON-LD here.
    preprocess: ({ document, params }) => {
      const product = readJsonLdProduct(document);
      params.commerce = {
        isProduct: Boolean(product) || meta(document, "og:type") === "product",
        sku: findSku(document, product),
        productName: product && product.name ? String(product.name) : ""
      };
    },
    transform: ({ document, url, params }) => {
      var _a, _b;
      const main = document.body;
      const info = params.commerce || { isProduct: false, sku: "" };
      const originalUrl = params.originalURL || url;
      const path = pagePath(originalUrl);
      const title = meta(document, "og:title") || (((_a = document.querySelector("title")) == null ? void 0 : _a.textContent) || "").trim();
      const description = meta(document, "description");
      const ogImage = meta(document, "og:image");
      const pciNotice = document.querySelector(".product-info-details-container .pci-notice, .pci-notice");
      const noticeBlock = info.isProduct && pciNotice && pciNotice.textContent.trim() ? buildNotice(document, pciNotice) : null;
      const h1Text = (((_b = document.querySelector("#maincontent h1, h1")) == null ? void 0 : _b.textContent) || "").replace(/\s+/g, " ").trim();
      let commerceBlock;
      if (info.isProduct) {
        if (!info.sku) console.warn(`\u26A0\uFE0F commerce-import: no SKU found for ${originalUrl}`);
        commerceBlock = WebImporter.DOMUtils.createTable([
          ["product-details"],
          ["defaultSku", info.sku || ""]
        ], document);
      } else {
        commerceBlock = WebImporter.DOMUtils.createTable([
          ["product-list-page"],
          ["urlPath", path.replace(/^\//, "")],
          ["pageSize", "36"]
        ], document);
      }
      let image = null;
      if (ogImage) {
        image = document.createElement("img");
        image.src = ogImage;
        image.alt = info.productName || title;
      }
      const metadataBlock = buildMetadata(document, {
        Title: title,
        Description: description,
        Image: image,
        sku: info.isProduct ? info.sku : ""
      });
      main.innerHTML = "";
      if (!info.isProduct && h1Text) {
        const titleSection = document.createElement("div");
        const h1 = document.createElement("h1");
        h1.textContent = h1Text;
        titleSection.append(h1);
        main.append(titleSection);
      }
      if (noticeBlock) {
        const noticeSection = document.createElement("div");
        noticeSection.append(noticeBlock);
        main.append(noticeSection);
      }
      const commerceSection = document.createElement("div");
      commerceSection.append(commerceBlock);
      main.append(commerceSection);
      const metadataSection = document.createElement("div");
      metadataSection.append(metadataBlock);
      main.append(metadataSection);
      return [{
        element: main,
        path: WebImporter.FileUtils.sanitizePath(path === "/" ? "/index" : path),
        report: { pageType: info.isProduct ? "PDP" : "PLP", sku: info.sku || "" }
      }];
    }
  };
  return __toCommonJS(commerce_import_exports);
})();
