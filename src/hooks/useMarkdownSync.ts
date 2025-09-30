import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { sanitizeText } from '@/utils/sanitize';
import type { SetFromGrid } from '@/types/table';

type UseMarkdownSyncResult = {
  markdown: string;
  setMarkdown: Dispatch<SetStateAction<string>>;
  generateMarkdown: () => void;
  onMarkdownChange: (value: string) => void;
};

export default function useMarkdownSync(
  headers: string[],
  rows: string[][],
  setFromGrid: SetFromGrid,
  delay = 300
): UseMarkdownSyncResult {
  const [markdown, setMarkdown] = useState('');

  const formatCell = useCallback((value: string) => sanitizeText(value).replace(/\n/g, ' / '), []);

  const generateMarkdown = useCallback(() => {
    const headerLine =
      '| ' + headers.map((h) => formatCell(h ?? '')).join(' | ') + ' |';
    const separatorLine = '| ' + headers.map(() => '---').join(' | ') + ' |';
    const rowLines = rows.map(
      (row) => '| ' + row.map((c) => formatCell(c ?? '')).join(' | ') + ' |'
    );
    setMarkdown([headerLine, separatorLine, ...rowLines].join('\n') + '\n');
  }, [formatCell, headers, rows]);

  const populateTableFromMarkdown = useCallback(
    (md: string) => {
      const lines = md.trim().split('\n');
      if (lines.length < 2) return;

      // header, separator, then rows
      const headerData = lines[0].split('|').slice(1, -1).map((cell) => cell.trim());
      const rowData = lines
        .slice(2)
        .map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()));

      const sanitizedHeaders = headerData.map((h) => sanitizeText(h.replace(/ \/ /g, ' ')));
      const sanitizedRows = rowData.map((row) => row.map((c) => sanitizeText(c.replace(/ \/ /g, ' '))));

      const columnCount = sanitizedHeaders.length;
      const normalizedRows = sanitizedRows.map((row) => {
        const newRow = [...row];
        while (newRow.length < columnCount) newRow.push('');
        return newRow;
      });

      setFromGrid([sanitizedHeaders, ...normalizedRows]);
    },
    [setFromGrid]
  );

  // Debounce the parser; auto-cancels on unmount
  const debouncedPopulate = useDebouncedCallback(
    (value: string) => {
      populateTableFromMarkdown(value);
    },
    delay,
    { maxWait: Math.max(delay * 3, 600) }
  );

  const onMarkdownChange = useCallback(
    (value: string) => {
      setMarkdown(value);
      debouncedPopulate(value);
    },
    [debouncedPopulate]
  );

  return { markdown, setMarkdown, generateMarkdown, onMarkdownChange };
}
