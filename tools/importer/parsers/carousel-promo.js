/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the carousel-promo block (commercemarketplace.adobe.com homepage).
 *
 * Source: Magento Page Builder banner widget
 *   #maincontent > .widget.block.block-banners > ul.banner-items > li.banner-item
 *   containing a Page Builder slider whose slides are [data-content-type="slide"].
 * Each slide: <a data-element="link"> wrapping .pagebuilder-slide-wrapper (background
 * image in data-background-images JSON, a <style> rule or inline style), optional
 * poster content and a button label.
 *
 * The source nests <button> inside <a>, so slide parts are collected per type and
 * paired by document order (not by walking up to a shared ancestor).
 *
 * Block structure (library Carousel + blocks/carousel-promo/carousel-promo.js):
 * one row per slide, cells: [slide image, content (logo, heading, text, CTA link)].
 */

function clean(text) {
  return (text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanHref(href) {
  return (href || '').trim().replace(/(%20|\s)+$/i, '');
}

/** Desktop image URL of a Page Builder slide wrapper. */
function slideImageUrl(wrapper, styles) {
  if (!wrapper) return '';
  // 1. data-background-images='{"desktop_image":"..."}' (quotes may be backslash-escaped)
  const data = wrapper.getAttribute('data-background-images') || '';
  const m = data.match(/desktop_image\\*"\s*:\s*\\*"([^"\\]+)/);
  if (m) return m[1];
  // 2. Inline style background-image
  const inline = (wrapper.getAttribute('style') || '').match(/background-image:\s*url\(\s*['"]?([^'")]+)/i);
  if (inline) return inline[1];
  // 3. <style> rule keyed on the wrapper's background-image-* class (first rule = desktop)
  const cls = [...wrapper.classList].find((c) => c.startsWith('background-image-'));
  if (cls) {
    const re = new RegExp(`\\.${cls}\\s*\\{[^}]*background-image:\\s*url\\(\\s*['"]?([^'")]+)`);
    const r = styles.match(re);
    if (r) return r[1];
  }
  return '';
}

export default function parse(element, { document }) {
  const styles = [...element.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  const notCloned = (el) => !el.closest('.slick-cloned');

  // Stable inner wrappers, each list in document order.
  const slides = [...element.querySelectorAll('[data-content-type="slide"]')].filter(notCloned);
  const wrappers = [...element.querySelectorAll('.pagebuilder-slide-wrapper')].filter(notCloned);
  const links = [...element.querySelectorAll('a[data-element="link"][href]')].filter(notCloned);
  const buttons = [...element.querySelectorAll('.pagebuilder-slide-button')].filter(notCloned);
  const posters = [...element.querySelectorAll('.pagebuilder-poster-content [data-element="content"], .pagebuilder-collage-content [data-element="content"]')].filter(notCloned);

  const count = Math.max(slides.length, wrappers.length);
  const cells = [];
  const seen = new Set();

  for (let i = 0; i < count; i += 1) {
    const slide = slides[i];
    const name = clean(slide && slide.getAttribute('data-slide-name'));
    const imageUrl = slideImageUrl(wrappers[i], styles);
    const href = cleanHref(links[i] && links[i].getAttribute('href'));
    const buttonText = clean(buttons[i] && buttons[i].textContent);

    const key = `${imageUrl}|${href}`;
    if ((!imageUrl && !buttonText) || seen.has(key)) continue;
    seen.add(key);

    const imageCell = [];
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = name;
      imageCell.push(img);
    }

    // Content cell: logo, heading, text (Page Builder poster content), CTA.
    const content = [];
    const poster = posters[i];
    if (poster) {
      poster.querySelectorAll('img[src]').forEach((src) => {
        const img = document.createElement('img');
        img.src = src.getAttribute('src');
        img.alt = src.getAttribute('alt') || '';
        content.push(img);
      });
      const textEls = poster.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
      textEls.forEach((src) => {
        const t = clean(src.textContent);
        if (!t) return;
        const el = document.createElement(src.tagName.toLowerCase());
        el.textContent = t;
        content.push(el);
      });
      if (!textEls.length && clean(poster.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(poster.textContent);
        content.push(p);
      }
    }
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = buttonText || name || 'Learn more';
      const p = document.createElement('p');
      p.append(a);
      content.push(p);
    }

    cells.push([imageCell, content]);
  }

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-promo', cells });
  element.replaceWith(block);
}
