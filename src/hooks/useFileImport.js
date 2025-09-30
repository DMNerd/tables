import { useState, useMemo, useCallback } from 'react';
import debounce from 'debounce';
import * as mammoth from 'mammoth/mammoth.browser.js';
import { sanitizeHtml } from '@/utils/sanitize';

export default function useFileImport({ parseHtmlTable, setFromGrid, onError }) {
  const [storedTables, setStoredTables] = useState([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState('');

  const processHtmlFile = useCallback((htmlText) => {
    const docHtml = new DOMParser().parseFromString(sanitizeHtml(htmlText), 'text/html');
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
  }, [onError, parseHtmlTable, setFromGrid]);

  const processDocxFile = useCallback(async (arrayBuffer) => {
    try {
      const { value } = await mammoth.convertToHtml({ arrayBuffer });
      const docHtml = new DOMParser().parseFromString(sanitizeHtml(value), 'text/html');
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
  }, [onError, parseHtmlTable, setFromGrid]);

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

  const debouncedPopulateTable = useMemo(
    () => debounce((idx) => {
      if (idx === '' || !storedTables.length) return;
      const grid = parseHtmlTable(storedTables[idx]);
      if (grid) setFromGrid(grid);
      else onError?.('Nepodařilo se zpracovat vybranou tabulku.');
    }, 150),
    [parseHtmlTable, setFromGrid, storedTables, onError]
  );

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
    setStoredTables, // exposed in case you need manual control
    setSelectedTableIndex,
  };
}
