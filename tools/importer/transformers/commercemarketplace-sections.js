/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for commercemarketplace.adobe.com.
 * Inserts section breaks (<hr>) and Section Metadata per payload.template.sections.
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const selector of selectors) {
    if (!selector) continue;
    try {
      const el = root.querySelector(selector);
      if (el) return el;
    } catch (e) {
      // invalid selector: try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = (template && template.sections) || [];
  if (sections.length < 2) return;
  const doc = (payload && payload.document) || element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el || !el.parentNode) continue;
      if (i === 0 && !section.style) continue;
      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      if (section.style) {
        const anchor = marker || findSectionElement(element, section);
        if (anchor && anchor.parentNode) {
          const meta = WebImporter.Blocks.createBlock(doc, {
            name: 'Section Metadata',
            cells: { style: section.style },
          });
          // Place metadata at the end of the section: before the next section break.
          let next = anchor.nextElementSibling;
          if (marker) {
            while (next && next.tagName !== 'HR') next = next.nextElementSibling;
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
