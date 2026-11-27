/* eslint-disable */
/* global WebImporter */

/**
 * "Become a Partner" band: the old site opened the footer with it on product, seller and error
 * pages (source .page-footer > .become-partner). The new footer is shared by every page, so the
 * band is a fragment the footer block adds on those pages (blocks/footer/footer.js).
 *
 * beforeTransform reads the band (heading text, button label and link); afterTransform writes it
 * as a fragment (one heading, one button-styled link) at the template's `becomePartnerFragment`
 * path, by default /fragments/become-partner.
 */
const DEFAULT_LINK = 'https://www.adobe.com/partners.html';
const DEFAULT_FRAGMENT = '/fragments/become-partner';

export default function transform(hookName, element, payload) {
  const params = payload.params || {};
  const fragmentPath = payload.template?.becomePartnerFragment || DEFAULT_FRAGMENT;
  if (hookName === 'beforeTransform') {
    const band = element.querySelector('.page-footer .become-partner, .become-partner');
    if (!band || params.becomePartner) return;
    const heading = band.querySelector('h1, h2, h3, h4');
    const action = band.querySelector('a, button');
    params.becomePartner = {
      heading: (heading?.textContent || '').replace(/\s+/g, ' ').trim(),
      label: (action?.textContent || '').replace(/\s+/g, ' ').trim(),
      href: action?.getAttribute('href') || DEFAULT_LINK,
    };
    return;
  }
  const { document } = payload;
  // Only once, for the page itself (afterTransform also runs for each fragment element)
  if (hookName !== 'afterTransform' || element !== document.body) return;
  const data = params.becomePartner;
  if (!data?.heading || !data.label || params.fragments?.some((f) => f.path === fragmentPath)) return;
  const fragment = document.createElement('div');
  const h3 = document.createElement('h3');
  h3.textContent = data.heading;
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  const a = document.createElement('a');
  a.href = data.href;
  a.textContent = data.label;
  strong.append(a);
  p.append(strong);
  fragment.append(h3, p);
  params.fragments = params.fragments || [];
  params.fragments.push({
    element: fragment,
    path: WebImporter.FileUtils.sanitizePath(fragmentPath),
    report: { title: 'Become a Partner band', template: 'fragment' },
  });
}
