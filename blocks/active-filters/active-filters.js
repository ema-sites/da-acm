/**
 * Results heading bar: a heading (e.g. "All Products") with links on the right
 * (e.g. "Back to top", or active filter chips). Rows and cells are merged:
 * headings form the title, links form the action list, other text is kept.
 * @param {Element} block
 */
export default function decorate(block) {
  const title = document.createElement('div');
  title.className = 'active-filters-title';
  const actions = document.createElement('ul');
  actions.className = 'active-filters-actions';

  const parts = [...block.querySelectorAll(':scope > div > div')].flatMap((cell) => {
    if (!cell.children.length && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      return [p];
    }
    return [...cell.children];
  });

  parts.forEach((el) => {
    const links = el.matches('a[href]') ? [el] : [...el.querySelectorAll('a[href]')];
    const onlyLinks = links.length && el.textContent.trim() === links.map((a) => a.textContent.trim()).join('');
    if (el.matches('h1, h2, h3, h4, h5, h6') || (!links.length && !title.children.length)) {
      title.append(el);
    } else if (onlyLinks) {
      links.forEach((a) => {
        const li = document.createElement('li');
        a.classList.remove('button');
        a.parentElement?.classList.remove('button-container');
        const hash = a.getAttribute('href');
        if (/^#(top)?$/.test(hash) || hash.endsWith('#top')) {
          a.classList.add('active-filters-top');
          a.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
        li.append(a);
        actions.append(li);
      });
    } else {
      title.append(el);
    }
  });

  const children = [title];
  if (actions.children.length) children.push(actions);
  block.replaceChildren(...children);
}
