/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the notice block (commercemarketplace.adobe.com partner profile).
 *
 * Instances:
 *  - #maincontent > .page.messages  -> "notice (warning)": redirect warning message text.
 *  - .product-info-main > .box-profile -> "notice": partner badge (preceding sibling
 *    .text-center image) + Contact Seller link.
 *  - .product-info-main > .case-specifications -> "notice": Location heading + address.
 *
 * Block structure (blocks/notice/notice.js): one row, one cell of text paragraphs and links.
 */

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Split an element's content into text lines on <br> and block boundaries. */
function lines(el) {
  const out = [];
  let current = '';
  const flush = () => {
    const t = clean(current).replace(/\s*,\s*$/, ',');
    if (t) out.push(t);
    current = '';
  };
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        current += child.textContent;
      } else if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        if (tag === 'br') {
          flush();
        } else if (['div', 'p', 'li'].includes(tag)) {
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
  const p = document.createElement('p');
  textLines.forEach((line, i) => {
    if (i) p.append(document.createElement('br'));
    p.append(document.createTextNode(line));
  });
  return p;
}

/** Redirect / status message: keep text and inline links. */
function parseMessages(element, document) {
  const content = [];
  const messages = element.querySelectorAll('.message-warning, .message-notice, .message-error, .message-success, .message');
  const seen = new Set();
  messages.forEach((msg) => {
    if ([...seen].some((s) => s.contains(msg) || msg.contains(s))) return;
    seen.add(msg);
    const text = clean(msg.textContent);
    if (!text) return;
    const p = document.createElement('p');
    const inner = msg.querySelector(':scope > div') || msg;
    inner.childNodes.forEach((n) => {
      if (n.nodeType === 3) p.append(document.createTextNode(n.textContent.replace(/\s+/g, ' ')));
      else if (n.nodeType === 1 && n.tagName === 'A' && n.getAttribute('href')) {
        const a = document.createElement('a');
        a.href = n.getAttribute('href');
        a.textContent = clean(n.textContent);
        p.append(a);
      } else if (n.nodeType === 1) p.append(document.createTextNode(n.textContent.replace(/\s+/g, ' ')));
    });
    content.push(p);
  });
  return content;
}

/** Partner badge (preceding sibling) + Contact Seller link. */
function parseBoxProfile(element, document) {
  const content = [];
  const prev = element.previousElementSibling;
  if (prev && !prev.matches('.box-profile, .case-specifications') && prev.querySelector('img')
    && !clean(prev.textContent)) {
    const src = prev.querySelector('img');
    const img = document.createElement('img');
    img.src = src.getAttribute('src');
    img.alt = src.getAttribute('alt') || '';
    const p = document.createElement('p');
    p.append(img);
    content.push(p);
    if (img.alt) {
      const label = document.createElement('p');
      label.textContent = img.alt;
      content.push(label);
    }
    prev.remove();
  }
  element.querySelectorAll('a[href]').forEach((src) => {
    const text = clean(src.textContent);
    if (!text) return;
    const a = document.createElement('a');
    a.href = src.getAttribute('href');
    a.textContent = text;
    const p = document.createElement('p');
    p.append(a);
    content.push(p);
  });
  const textOnly = clean(element.textContent);
  if (!element.querySelector('a[href]') && textOnly) {
    const p = document.createElement('p');
    p.textContent = textOnly;
    content.push(p);
  }
  return content;
}

/** Location heading + labelled address. */
function parseSpecifications(element, document) {
  const content = [];
  const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && clean(heading.textContent)) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = clean(heading.textContent);
    content.push(h);
  }
  const boxes = element.querySelectorAll('.box');
  (boxes.length ? [...boxes] : [element]).forEach((box) => {
    const label = box.querySelector('b, strong');
    if (label && clean(label.textContent)) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = clean(label.textContent);
      p.append(strong);
      content.push(p);
    }
    const copy = box.cloneNode(true);
    copy.querySelectorAll('b, strong, h1, h2, h3, h4, h5, h6').forEach((n) => n.remove());
    copy.querySelectorAll('a[href]').forEach((a) => {
      const t = clean(a.textContent);
      if (t) {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
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

export default function parse(element, { document }) {
  let name = 'notice';
  let content;

  if (element.matches('.page.messages, .messages')) {
    name = 'notice (warning)';
    content = parseMessages(element, document);
  } else if (element.matches('.box-profile')) {
    content = parseBoxProfile(element, document);
  } else if (element.matches('.case-specifications')) {
    content = parseSpecifications(element, document);
  } else {
    const textLines = lines(element);
    content = textLines.length ? [linesParagraph(document, textLines)] : [];
  }

  if (!content.length) {
    // Empty message container (no redirect message on this page): nothing to author.
    element.remove();
    return;
  }

  const cells = [[content]];
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
