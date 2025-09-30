import { useCallback } from 'react';
import { sanitizeHtml, sanitizeText } from '@/utils/sanitize';

function cleanText(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function useHtmlTableParser() {
  const parse = useCallback((htmlOrEl) => {
    const table =
      typeof htmlOrEl === 'string'
        ? new DOMParser()
            .parseFromString(sanitizeHtml(htmlOrEl), 'text/html')
            .querySelector('table')
        : htmlOrEl;

    if (!table) return null;

    const grid = [];
    Array.from(table.rows).forEach((htmlRow, rowIndex) => {
      grid[rowIndex] = grid[rowIndex] || [];
      let colIndex = 0;
      while (grid[rowIndex][colIndex] !== undefined) colIndex++;

      Array.from(htmlRow.cells).forEach((cell) => {
        while (grid[rowIndex][colIndex] !== undefined) colIndex++;

        const content = sanitizeText(cleanText(cell.innerHTML));
        const colspan = parseInt(cell.getAttribute('colspan')) || 1;
        const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;

        grid[rowIndex][colIndex] = content;

        for (let c = 1; c < colspan; c++) grid[rowIndex][colIndex + c] = '';
        for (let r = 1; r < rowspan; r++) {
          grid[rowIndex + r] = grid[rowIndex + r] || [];
          for (let c = 0; c < colspan; c++) grid[rowIndex + r][colIndex + c] = '';
        }

        colIndex += colspan;
      });
    });

    const maxColumns = grid.reduce((m, row) => Math.max(m, row.length), 0);
    const normalized = grid.map((row) => {
      const newRow = [...row];
      while (newRow.length < maxColumns) newRow.push('');
      return newRow;
    });

    return normalized.length ? normalized : null;
  }, []);

  return { parse };
}
