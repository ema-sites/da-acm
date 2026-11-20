/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the partner-profile block (seller header).
 * Source: .partner.product-info-details-container > .product.media
 *
 * Block structure (blocks/partner-profile/partner-profile.js): one row, two cells:
 *   [logo image] | [seller name heading, website link, social links]
 */

const NETWORKS = [
  ['facebook', 'Facebook', /(^|\.)(facebook|fb)\.com$/i],
  ['twitter', 'Twitter', /(^|\.)(twitter|x)\.com$/i],
  ['linkedin', 'LinkedIn', /(^|\.)linkedin\.com$/i],
  ['youtube', 'YouTube', /(^|\.)(youtube\.com|youtu\.be)$/i],
  ['instagram', 'Instagram', /(^|\.)instagram\.com$/i],
];

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function networkOf(a) {
  const icon = a.querySelector('[class*="icon-"]');
  if (icon) {
    const m = icon.className.match(/icon-([a-z]+)/);
    const found = m && NETWORKS.find(([key]) => key === m[1]);
    if (found) return found;
  }
  try {
    const { hostname } = new URL(a.getAttribute('href'), 'https://commercemarketplace.adobe.com/');
    return NETWORKS.find(([, , re]) => re.test(hostname));
  } catch (e) {
    return undefined;
  }
}

export default function parse(element, { document }) {
  // Logo
  const logoCell = [];
  const srcImg = element.querySelector('.ico-product img, img.product-image-photo, img');
  if (srcImg) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src') || srcImg.getAttribute('data-src');
    img.alt = srcImg.getAttribute('alt') || '';
    logoCell.push(img);
  }

  const details = [];

  // Seller name
  const title = element.querySelector('h1 .base, h1.page-title, h1, h2');
  const nameText = clean(title && title.textContent);
  if (nameText) {
    // The page already has the seller name as its h1 (page title), so the block uses h2.
    const heading = document.createElement('h2');
    heading.textContent = nameText;
    details.push(heading);
  }

  // Website link(s): links outside the social list
  element.querySelectorAll('.by-company a[href], .case-left-name a[href]').forEach((src, i, all) => {
    if ([...all].indexOf(src) !== i) return;
    const href = src.getAttribute('href');
    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.textContent = clean(src.textContent) || href;
    const p = document.createElement('p');
    p.append(a);
    details.push(p);
  });

  // Social links: source anchors only contain an icon span, so give them a label.
  const socialLinks = [...element.querySelectorAll('.social-list a[href]')];
  if (socialLinks.length) {
    const ul = document.createElement('ul');
    socialLinks.forEach((src) => {
      const net = networkOf(src);
      const a = document.createElement('a');
      a.href = src.getAttribute('href');
      a.textContent = clean(src.textContent) || (net ? net[1] : a.href);
      const li = document.createElement('li');
      li.append(a);
      ul.append(li);
    });
    details.push(ul);
  }

  const cells = [[logoCell, details]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'partner-profile', cells });
  element.replaceWith(block);
}
