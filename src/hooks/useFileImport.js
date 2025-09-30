import { useState, useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { sanitizeHtml } from '@/utils/sanitize';

export default function useFileImport({ parseHtmlTable, setFromGrid, onError }) {
  const [storedTables, setStoredTables] = useState([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState('');

  const parserRef = useRef(typeof window !== 'undefined' ? new DOMParser() : null);

  const parseDoc = useCallback((html) => {
    const parser = parserRef.current ?? new DOMParser();
    return parser.parseFromString(sanitizeHtml(html), 'text/html');
  }, []);

  const processHtmlFile = useCallback((htmlText) => {
    const docHtml = parseDoc(htmlText);
    const tables = docHtml.querySelectorAll('table');
    if (!tables.length) {
      onError?.('V souboru nebyla nalezena validní tabulka.');
      return;
    }
    const htmlTables = Array.from(tables).map((t) => t.outerHTML);
    setStoredTables(htmlTables);
    setSelectedTableIndex('0');

    const grid = parseHtmlTable(tables[0]);
    if (grid) setFromGrid(grid);
    else onError?.('Nepodařilo se zpracovat tabulku.');
  }, [onError, parseDoc, parseHtmlTable, setFromGrid]);

  const processDocxFile = useCallback(async (arrayBuffer) => {
    try {
      const { convertToHtml } = await import('mammoth/mammoth.browser.js');
      const { value } = await convertToHtml({ arrayBuffer });
      const docHtml = parseDoc(value);
      const tables = docHtml.querySelectorAll('table');
      if (!tables.length) {
        onError?.('V souboru nebyla nalezena validní tabulka.');
        return;
      }
      const htmlTables = Array.from(tables).map((t) => t.outerHTML);
      setStoredTables(htmlTables);
      setSelectedTableIndex('0');

      const grid = parseHtmlTable(tables[0]);
      if (grid) setFromGrid(grid);
      else onError?.('Nepodařilo se zpracovat tabulku.');
    } catch (err) {
      console.error('Error processing DOCX file:', err);
      onError?.('Chyba zpracování souboru.');
    }
  }, [onError, parseDoc, parseHtmlTable, setFromGrid]);

  const handleFileUpload = useCallback((fileInputEvent) => {
    const file = fileInputEvent.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const name = file.name.toLowerCase();

    if (name.endsWith('.docx')) {
      reader.onload = (ev) => processDocxFile(ev.target.result);
      reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.html') || name.endsWith('.htm')) {
      reader.onload = (ev) => processHtmlFile(ev.target.result);
      reader.readAsText(file);
    } else {
      onError?.('Prosím vyberte DOCX nebo HTML soubor obsahující tabulku.');
    }

    // reset input so the same file can be reselected later
    fileInputEvent.target.value = '';
  }, [onError, processDocxFile, processHtmlFile]);

  const debouncedPopulateTable = useDebouncedCallback((idx) => {
    if (idx === '' || !storedTables.length) return;
    const i = Number(idx);
    const source = storedTables[i];
    const grid = parseHtmlTable(source);
    if (grid) setFromGrid(grid);
    else onError?.('Nepodařilo se zpracovat vybranou tabulku.');
  }, 150, { maxWait: 500 });

  const handleTableSelect = useCallback((e) => {
    const idx = e.target.value;
    setSelectedTableIndex(idx);
    debouncedPopulateTable(idx);
  }, [debouncedPopulateTable]);

  return {
    storedTables,
    selectedTableIndex,
    handleFileUpload,
    handleTableSelect,
    setStoredTables,
    setSelectedTableIndex,
  };
}
