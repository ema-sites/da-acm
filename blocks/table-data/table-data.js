/**
 * Data table. Each block row is a table row and each cell a table cell;
 * the first row is the header row. Rows with fewer cells are padded.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length);
  if (!rows.length) return;
  const columns = Math.max(...rows.map((row) => row.children.length));

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    const isHeader = rowIndex === 0 && rows.length > 1;
    const cells = [...row.children];
    for (let i = 0; i < columns; i += 1) {
      const cell = document.createElement(isHeader ? 'th' : 'td');
      if (isHeader) cell.scope = 'col';
      const source = cells[i];
      if (source) {
        // Unwrap a single paragraph so cells hold inline content.
        if (source.children.length === 1 && source.firstElementChild.tagName === 'P') {
          cell.append(...source.firstElementChild.childNodes);
        } else {
          cell.append(...source.childNodes);
        }
      }
      tr.append(cell);
    }
    (isHeader ? thead : tbody).append(tr);
  });

  if (thead.children.length) table.append(thead);
  table.append(tbody);

  const wrapper = document.createElement('div');
  wrapper.className = 'table-data-scroll';
  wrapper.append(table);
  block.replaceChildren(wrapper);
}
