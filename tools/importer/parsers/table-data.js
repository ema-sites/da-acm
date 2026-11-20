/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the table-data block (Table convention: first block row is the block name,
 * each following row is one table row, one cell per column; the source header row stays
 * the first data row, which the block renders as the header).
 * Source: the cookie list table on the privacy page (.cms-content > table).
 */

function cellContent(cell) {
  const parts = [...cell.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
  return parts.length ? parts : [cell.textContent.trim()];
}

export default function parse(element, { document }) {
  const rows = [...element.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr')];
  const cells = rows
    .map((tr) => [...tr.querySelectorAll(':scope > th, :scope > td')].map(cellContent))
    .filter((row) => row.length && row.some((c) => c.length && `${c[0]}`.trim() !== ''));

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-data', cells });
  element.replaceWith(block);
}
