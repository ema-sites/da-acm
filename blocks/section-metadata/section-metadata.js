import { readBlockConfig, toClassName } from '../../scripts/aem.js';

/**
 * Applies a section's metadata to the section that holds it, then removes the table.
 * `style` becomes section classes (comma separated); other keys become data attributes.
 * (This project's scripts/aem.js does not process section metadata itself.)
 * @param {Element} block The section-metadata block element
 */
export default function decorate(block) {
  const section = block.closest('.section');
  if (section) {
    const config = readBlockConfig(block);
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'style') {
        `${value}`.split(',')
          .map((style) => toClassName(style.trim()))
          .filter(Boolean)
          .forEach((style) => section.classList.add(style));
      } else {
        section.dataset[toClassName(key).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      }
    });
  }
  const wrapper = block.closest('.section-metadata-wrapper');
  (wrapper || block).remove();
}
