import { createOptimizedPicture } from '../../scripts/aem.js';

let carouselId = 0;

function optimizeImages(block) {
  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]));
  });
}

function setActive(block, index) {
  const slides = [...block.querySelectorAll('.carousel-promo-slide')];
  if (!slides.length) return;
  const active = ((index % slides.length) + slides.length) % slides.length;
  block.dataset.activeSlide = active;
  slides.forEach((slide, i) => {
    const hidden = i !== active;
    slide.setAttribute('aria-hidden', hidden);
    slide.querySelectorAll('a, button').forEach((el) => {
      if (hidden) el.setAttribute('tabindex', '-1');
      else el.removeAttribute('tabindex');
    });
  });
  block.querySelectorAll('.carousel-promo-indicator button').forEach((btn, i) => {
    if (i === active) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
}

function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-promo-slide');
  if (!slides.length) return;
  const active = ((index % slides.length) + slides.length) % slides.length;
  block.querySelector('.carousel-promo-slides').scrollTo({
    top: 0,
    left: slides[active].offsetLeft,
    behavior: 'smooth',
  });
  setActive(block, active);
}

function createSlide(row, index, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-promo-slide';
  slide.id = `carousel-promo-${id}-slide-${index}`;
  slide.dataset.slideIndex = index;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  [...row.children].forEach((cell) => {
    const onlyImage = cell.querySelector('picture, img') && !cell.textContent.trim();
    cell.className = onlyImage ? 'carousel-promo-slide-image' : 'carousel-promo-slide-content';
    slide.append(cell);
  });

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.id) slide.setAttribute('aria-labelledby', heading.id);
  else slide.setAttribute('aria-label', `Slide ${index + 1}`);
  return slide;
}

/**
 * Promotional banner carousel. One row per slide: a content cell (logo, heading,
 * text, call to action) and an image cell, in either order.
 * @param {Element} block
 */
export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture, img'));

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');

  const slides = document.createElement('ul');
  slides.className = 'carousel-promo-slides';
  rows.forEach((row, i) => slides.append(createSlide(row, i, id)));

  const container = document.createElement('div');
  container.className = 'carousel-promo-slides-container';
  container.append(slides);
  block.replaceChildren(container);
  optimizeImages(block);

  if (rows.length < 2) {
    block.classList.add('carousel-promo-single');
    return;
  }

  const nav = document.createElement('div');
  nav.className = 'carousel-promo-navigation';
  nav.innerHTML = `
    <button type="button" class="carousel-promo-prev" aria-label="Previous slide"></button>
    <button type="button" class="carousel-promo-next" aria-label="Next slide"></button>`;
  container.append(nav);

  const indicators = document.createElement('ol');
  indicators.className = 'carousel-promo-indicators';
  rows.forEach((_, i) => {
    const li = document.createElement('li');
    li.className = 'carousel-promo-indicator';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Show slide ${i + 1} of ${rows.length}`);
    btn.textContent = i + 1;
    btn.addEventListener('click', () => showSlide(block, i));
    li.append(btn);
    indicators.append(li);
  });
  const indicatorsNav = document.createElement('nav');
  indicatorsNav.setAttribute('aria-label', 'Carousel slide controls');
  indicatorsNav.append(indicators);
  block.append(indicatorsNav);

  const current = () => parseInt(block.dataset.activeSlide || '0', 10);
  nav.querySelector('.carousel-promo-prev').addEventListener('click', () => showSlide(block, current() - 1));
  nav.querySelector('.carousel-promo-next').addEventListener('click', () => showSlide(block, current() + 1));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(block, parseInt(entry.target.dataset.slideIndex, 10));
    });
  }, { root: slides, threshold: 0.5 });
  slides.querySelectorAll('.carousel-promo-slide').forEach((slide) => observer.observe(slide));
  setActive(block, 0);
}
