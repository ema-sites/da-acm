/* eslint-disable */
/* global WebImporter */

/**
 * Seller pages (the old site's pages for disabled extensions, template partner-profile): the old
 * page is the seller's profile plus a warning. On the new site it is the profile template block
 * (partner-page) for that seller, with the warning as its `notice` row, so it matches the
 * /partner/<slug> profiles exactly (header, tabs, live products in the old ranking).
 *
 * beforeTransform (before the parsers run): reads the seller ID (data-partner-id) and the warning
 * text from the source page. afterTransform: replaces the parsed content with the template block.
 */
export default function transform(hookName, element, payload) {
  const params = payload.params || {};
  if (hookName === 'beforeTransform') {
    const id = element.querySelector('[data-partner-id]')?.getAttribute('data-partner-id');
    const warning = element.querySelector('.message.notice, .message-notice, .messages .message');
    if (id) params.sellerPage = {
      id,
      notice: (warning?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
    return;
  }
  if (hookName !== 'afterTransform' || !params.sellerPage) return;
  const { document } = payload;
  // The page only (afterTransform also runs for the fragments the page writes)
  if (element !== document.body) return;
  const rows = [['Partner Page'], ['partner-id', params.sellerPage.id]];
  if (params.sellerPage.notice) rows.push(['notice', params.sellerPage.notice]);
  const block = WebImporter.DOMUtils.createTable(rows, document);
  element.replaceChildren(block);
}
