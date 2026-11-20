import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

const SOCIAL_NETWORKS = {
  facebook: /(^|\.)facebook\.com$|(^|\.)fb\.com$/,
  twitter: /(^|\.)twitter\.com$|(^|\.)x\.com$/,
  linkedin: /(^|\.)linkedin\.com$/,
  youtube: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/,
  instagram: /(^|\.)instagram\.com$/,
};

function socialNetwork(a) {
  try {
    const { hostname } = new URL(a.href);
    return Object.keys(SOCIAL_NETWORKS).find((name) => SOCIAL_NETWORKS[name].test(hostname));
  } catch (e) {
    return undefined;
  }
}

function optimizeImages(block) {
  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]));
  });
}

/**
 * Seller header: logo, seller name, website link and social links.
 * Authored as one row: a logo cell and a details cell (name heading, website link,
 * social links). Content in a single cell also works.
 * @param {Element} block
 */
export default function decorate(block) {
  const logo = document.createElement('div');
  logo.className = 'partner-profile-logo';
  const details = document.createElement('div');
  details.className = 'partner-profile-details';

  const picture = block.querySelector('picture') || block.querySelector('img');
  if (picture) logo.append(picture);

  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.classList.add('partner-profile-name');
    details.append(heading);
  }

  const links = [...block.querySelectorAll('a[href]')];
  const social = document.createElement('ul');
  social.className = 'partner-profile-social';
  const website = document.createElement('p');
  website.className = 'partner-profile-website';

  links.forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary');
    const network = socialNetwork(a);
    if (network) {
      const li = document.createElement('li');
      const label = a.textContent.trim() || network;
      a.setAttribute('aria-label', label);
      a.textContent = '';
      const icon = document.createElement('span');
      icon.className = `icon icon-${network}`;
      a.append(icon);
      a.classList.add(`partner-profile-social-${network}`);
      li.append(a);
      social.append(li);
    } else if (!website.children.length && !a.closest('h1, h2, h3, h4, h5, h6')) {
      website.append(a);
    }
  });

  // Keep any other authored text (e.g. a short description) after the name.
  const leftovers = [...block.querySelectorAll(':scope > div > div > *')]
    .filter((el) => !el.querySelector('picture, img') && el.textContent.trim()
      && !el.matches('ul, ol') && !el.contains(heading));
  if (!heading && leftovers.length) {
    leftovers[0].classList.add('partner-profile-name');
  }
  details.append(...leftovers);
  if (website.children.length) details.append(website);
  if (social.children.length) details.append(social);

  const children = [];
  if (logo.children.length) children.push(logo);
  children.push(details);
  block.replaceChildren(...children);
  decorateIcons(block);
  optimizeImages(block);
}
