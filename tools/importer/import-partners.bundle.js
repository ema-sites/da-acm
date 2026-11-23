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

  // tools/importer/import-partners.js
  var import_partners_exports = {};
  __export(import_partners_exports, {
    default: () => import_partners_default
  });
  var ORIGIN = "https://commercemarketplace.adobe.com";
  var SEARCH_ENDPOINT = `${ORIGIN}/partners-search/search`;
  function readPartnersData(document) {
    for (const script of document.querySelectorAll("script")) {
      const text = script.textContent || "";
      const m = text.match(/window\.partnersData\s*=\s*(\[[\s\S]*?\]);/);
      if (m) {
        try {
          return JSON.parse(m[1]);
        } catch (e) {
        }
      }
    }
    return [];
  }
  var abs = (path) => path ? new URL(path, ORIGIN).href : "";
  var import_partners_default = {
    // <script> elements are removed before transform, so read the partner data here.
    preprocess: ({ document, params }) => {
      params.partners = readPartnersData(document);
    },
    transform: ({ document, url, params }) => {
      var _a, _b;
      const main = document.body;
      const partners = params.partners || [];
      if (!partners.length) console.warn("import-partners: no window.partnersData found");
      const h1Text = (((_a = document.querySelector("#maincontent h1, h1")) == null ? void 0 : _a.textContent) || "Adobe Commerce Partners").replace(/\s+/g, " ").trim();
      const description = ((_b = document.querySelector('meta[name="description"]')) == null ? void 0 : _b.getAttribute("content")) || "";
      const rows = [["Partner Directory"], ["source", SEARCH_ENDPOINT], ["page-size", "36"]];
      partners.forEach((p) => {
        const href = abs(p.developer_page_url || (p.screen_name ? `/partner/${encodeURIComponent(p.screen_name)}` : ""));
        const logo = document.createElement("div");
        if (p.avatar) {
          const img = document.createElement("img");
          img.src = abs(p.avatar);
          img.alt = p.name || "";
          logo.append(img);
        }
        const name = document.createElement("a");
        name.href = href;
        name.textContent = p.name || p.screen_name || "";
        rows.push([
          logo,
          name,
          p.partner_level || "",
          p.country || "",
          (p.makes || []).join(", "),
          (p.certifications || []).join(", ")
        ]);
      });
      const block = WebImporter.DOMUtils.createTable(rows, document);
      const metadata = WebImporter.DOMUtils.createTable([
        ["Metadata"],
        ["Title", `${h1Text} | Marketplace`],
        // The old site's breadcrumb reads "Home > Partners".
        ["breadcrumb-title", "Partners"],
        ...description ? [["Description", description]] : []
      ], document);
      main.innerHTML = "";
      const section = document.createElement("div");
      const h1 = document.createElement("h1");
      h1.textContent = h1Text;
      section.append(h1, block);
      main.append(section);
      const metaSection = document.createElement("div");
      metaSection.append(metadata);
      main.append(metaSection);
      const path = new URL(params.originalURL || url).pathname.replace(/\.html?$/i, "").replace(/\/+$/, "") || "/partners";
      return [{
        element: main,
        path: WebImporter.FileUtils.sanitizePath(path),
        report: { partners: partners.length }
      }];
    }
  };
  return __toCommonJS(import_partners_exports);
})();
