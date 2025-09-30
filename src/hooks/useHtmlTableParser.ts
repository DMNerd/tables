import { useCallback, useRef } from 'react';
import { sanitizeHtml, sanitizeText } from '@/utils/sanitize';
import type { TableGrid } from '@/types/table';

function cleanText(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html.replace(/<br\s*\/?>/gi, ' ');
  return (tmp.textContent ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function useHtmlTableParser() {
  const parserRef = useRef<DOMParser | null>(typeof window !== 'undefined' ? new DOMParser() : null);

  const parse = useCallback(
    (htmlOrEl: string | HTMLTableElement): TableGrid | null => {
      let table: HTMLTableElement | null;

      if (typeof htmlOrEl === 'string') {
        const parser = parserRef.current ?? new DOMParser();
        const doc = parser.parseFromString(sanitizeHtml(htmlOrEl), 'text/html');
        table = doc.querySelector('table');
      } else {
        table = htmlOrEl;
      }

      if (!table) return null;

      const grid: TableGrid = [];

      Array.from(table.rows).forEach((htmlRow, rowIndex) => {
        grid[rowIndex] = grid[rowIndex] || [];
        let colIndex = 0;

        // skip filled cells (from rowspan/colspan)
        while (grid[rowIndex][colIndex] !== undefined) colIndex++;

        Array.from(htmlRow.cells).forEach((cell) => {
          while (grid[rowIndex][colIndex] !== undefined) colIndex++;

          const content = sanitizeText(cleanText(cell.innerHTML));
          const colspan = parseInt(cell.getAttribute('colspan') ?? '', 10) || 1;
          const rowspan = parseInt(cell.getAttribute('rowspan') ?? '', 10) || 1;

          grid[rowIndex][colIndex] = content;

          // fill colspan blanks
          for (let c = 1; c < colspan; c++) grid[rowIndex][colIndex + c] = '';

          // fill rowspan blanks
          for (let r = 1; r < rowspan; r++) {
            grid[rowIndex + r] = grid[rowIndex + r] || [];
            for (let c = 0; c < colspan; c++) {
              grid[rowIndex + r][colIndex + c] = '';
            }
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
    },
    []
  );

  return { parse };
}
