/**
 * Marketplace product tiles as Product Discovery drop-in SearchResults slots, shared by the
 * category pages (blocks/product-list-page) and the seller profiles (blocks/partner-page). The
 * drop-in's own image and name links are kept; the slots add the old site's extras around them.
 * Tile styles: styles/marketplace-tiles.css (load it with the block, on an element with the
 * `marketplace-tiles` class around the SearchResults container).
 */

// Partner level lockups (from the old site),
// keyed by the catalog's ext_connect_partner_level_image.
const PARTNER_LEVEL_IMAGES = {
  'platinum-technology-partner.png': 'platinum-technology-partner.png',
  'gold-technology-partner.png': 'gold-technology-partner.png',
  'gold-solution-partner.png': 'gold-solution-partner.png',
  'silver-technology-partner.png': 'silver-technology-partner.png',
  'silver-solution-partner.png': 'silver-solution-partner.webp',
  'strategic-technology-partner.png': 'strategic-technology-partner.png',
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function attr(product, name) {
  return product?.attributes?.find((a) => a.name === name)?.value;
}

function formatPrice(product) {
  const amount = product?.price?.final?.amount ?? product?.priceRange?.minimum?.final?.amount;
  if (!amount || typeof amount.value !== 'number') return '';
  const value = new Intl.NumberFormat('en-US', { style: 'currency', currency: amount.currency || 'USD' }).format(amount.value);
  return attr(product, 'subscription_available') === 'yes' ? `${value} / year` : value;
}

/**
 * ProductImage slot: the drop-in's image (the extension logo, see the search initializer) and,
 * for assured extensions, the Assurance Program badge.
 */
export function tileHeaderSlot(ctx) {
  const badge = el('span', 'plp-tile__assurance');
  badge.setAttribute('role', 'img');
  badge.setAttribute('aria-label', 'Assurance Program');
  ctx.appendChild(badge);
  ctx.onRender(({ product }) => {
    badge.hidden = String(attr(product, 'ext_is_assured')) !== '1';
  });
}

/**
 * ProductName slot: the drop-in's name link (it links the whole tile), then vendor and divider.
 * Seller profile tiles have no vendor line (every product is the seller's): pass `vendor: false`.
 */
export function tileNameSlot(ctx, { vendor: showVendor = true } = {}) {
  if (showVendor) {
    const vendor = el('p', 'plp-tile__vendor');
    ctx.appendChild(vendor);
    ctx.onRender(({ product }) => {
      vendor.textContent = attr(product, 'ext_developer_name') || '';
    });
  }
  ctx.appendChild(el('hr', 'plp-tile__divider'));
}

/**
 * ProductPrice slot: star rating, then partner level lockup and price.
 * The price replaces the drop-in's price link: the old site's " / year" for subscriptions is part
 * of the price text (it wraps with it on narrow tiles), which can't be added to the drop-in's link.
 * The lockup shares the price's row, so both shrink together as on the old site.
 */
export function tileFooterSlot(ctx) {
  const stars = el('div', 'plp-tile__rating');
  stars.setAttribute('role', 'img');
  const filled = el('span', 'plp-tile__rating-filled');
  stars.append(filled);
  const partner = el('div', 'plp-tile__partner');
  const price = el('div', 'plp-tile__price');
  const footer = el('div', 'plp-tile__footer');
  footer.append(partner, price);
  ctx.replaceWith(footer);
  ctx.prependChild(stars);
  ctx.onRender(({ product }) => {
    const rating = Math.max(0, Math.min(5, parseFloat(attr(product, 'ext_approximate_rating')) || 0));
    stars.setAttribute('aria-label', `Rated ${rating} out of 5`);
    filled.style.width = `${(rating / 5) * 100}%`;

    const levelImage = PARTNER_LEVEL_IMAGES[attr(product, 'ext_connect_partner_level_image')];
    const src = levelImage ? `/icons/partner-levels/${levelImage}` : '';
    if ((partner.firstChild?.getAttribute('src') || '') !== src) {
      partner.replaceChildren();
      if (src) {
        const img = el('img');
        img.src = src;
        img.alt = attr(product, 'ext_connect_partner_level_title') || '';
        img.width = 90;
        img.loading = 'lazy';
        partner.append(img);
      }
    }

    price.textContent = formatPrice(product);
    price.hidden = !price.textContent;
  });
}
