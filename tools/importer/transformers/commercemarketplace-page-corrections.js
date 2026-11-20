/* eslint-disable */
/* global WebImporter */

/**
 * Page-scoped corrections, applied last (afterTransform) to the final page.
 * Each correction names the page path it applies to.
 */

function pagePath(payload) {
  try {
    const url = new URL(payload?.params?.originalURL || payload?.url || '');
    return url.pathname.replace(/\/$/, '').replace(/\.html?$/, '') || '/';
  } catch (e) {
    return '';
  }
}

const CORRECTIONS = {
  // The source buttons only work through page scripts: make them real links.
  '/service-unavailable': (element, document) => {
    const buttons = [...element.querySelectorAll('button')];
    if (!buttons.length) return;
    const holder = buttons[0].closest('p') || buttons[0].parentElement;
    const links = buttons.map((button) => {
      const label = button.textContent.replace(/\s+/g, ' ').trim();
      const home = /home page/i.test(label);
      const a = document.createElement('a');
      a.href = home ? '/' : '/service-unavailable';
      a.textContent = label;
      // Authored button styles: bold = filled (orange) button, italic = outlined button.
      const wrap = document.createElement(home ? 'strong' : 'em');
      wrap.append(a);
      const p = document.createElement('p');
      p.append(wrap);
      return p;
    });
    holder.replaceWith(...links);
    // Section style "error-page" (as in page-templates.json) gives the source's two-column
    // layout. The sections transformer only writes metadata after a section break, and this
    // page has a single section, so it is added here.
    if (!element.querySelector('.section-metadata')) {
      const meta = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: 'error-page' },
      });
      element.append(meta);
    }
  },
};

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const fix = CORRECTIONS[pagePath(payload)];
  if (fix) fix(element, element.ownerDocument || payload.document);
}
