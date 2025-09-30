import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { sanitizeText } from '@/utils/sanitize';

export default function useMarkdownSync(headers, rows, setFromGrid, delay = 300) {
  const [markdown, setMarkdown] = useState('');

  const generateMarkdown = useCallback(() => {
    const headerLine = '| ' + headers.map((h) => sanitizeText(h || '').replace(/\n/g, ' / ')).join(' | ') + ' |';
    const separatorLine = '| ' + headers.map(() => '---').join(' | ') + ' |';
    const rowLines = rows.map(
      (row) => '| ' + row.map((c) => sanitizeText(c || '').replace(/\n/g, ' / ')).join(' | ') + ' |'
    );
    setMarkdown([headerLine, separatorLine, ...rowLines].join('\n') + '\n');
  }, [headers, rows]);

  const populateTableFromMarkdown = useCallback((md) => {
    const lines = md.trim().split('\n');
    if (lines.length < 2) return;

    // header, separator, then rows
    const headerData = lines[0].split('|').slice(1, -1).map((cell) => cell.trim());
    const rowData = lines.slice(2).map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()));

    const sanitizedHeaders = headerData.map((h) => sanitizeText(h.replace(/ \/ /g, ' ')));
    const sanitizedRows = rowData.map((row) => row.map((c) => sanitizeText(c.replace(/ \/ /g, ' '))));

    const columnCount = sanitizedHeaders.length;
    const normalizedRows = sanitizedRows.map((row) => {
      const newRow = [...row];
      while (newRow.length < columnCount) newRow.push('');
      return newRow;
    });

    setFromGrid([sanitizedHeaders, ...normalizedRows]);
  }, [setFromGrid]);

  // Debounce the parser; auto-cancels on unmount
  const debouncedPopulate = useDebouncedCallback((value) => {
    populateTableFromMarkdown(value);
  }, delay, { maxWait: Math.max(delay * 3, 600) });

  const onMarkdownChange = useCallback((value) => {
    setMarkdown(value);
    debouncedPopulate(value);
  }, [debouncedPopulate]);

  return { markdown, setMarkdown, generateMarkdown, onMarkdownChange };
}
