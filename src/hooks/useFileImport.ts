import {
  useState,
  useCallback,
  useRef,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { sanitizeHtml } from '@/utils/sanitize';
import type { ParseHtmlTable, SetFromGrid, TableGrid } from '@/types/table';

type UseFileImportArgs = {
  parseHtmlTable: ParseHtmlTable;
  setFromGrid: SetFromGrid;
  onError?: (message: string) => void;
};

type UseFileImportResult = {
  storedTables: string[];
  selectedTableIndex: string;
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  handleTableSelect: (event: ChangeEvent<HTMLSelectElement>) => void;
  setStoredTables: Dispatch<SetStateAction<string[]>>;
  setSelectedTableIndex: Dispatch<SetStateAction<string>>;
};

export default function useFileImport({
  parseHtmlTable,
  setFromGrid,
  onError,
}: UseFileImportArgs): UseFileImportResult {
  const [storedTables, setStoredTables] = useState<string[]>([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState('');

  const parserRef = useRef<DOMParser | null>(typeof window !== 'undefined' ? new DOMParser() : null);

  const parseDoc = useCallback((html: string): Document => {
    const parser = parserRef.current ?? new DOMParser();
    return parser.parseFromString(sanitizeHtml(html), 'text/html');
  }, []);

  const handleGridSelection = useCallback(
    (grid: TableGrid | null) => {
      if (grid) setFromGrid(grid);
      else onError?.('Nepodařilo se zpracovat tabulku.');
    },
    [onError, setFromGrid]
  );

  const processHtmlFile = useCallback(
    (htmlText: string) => {
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
      handleGridSelection(grid);
    },
    [handleGridSelection, onError, parseDoc, parseHtmlTable]
  );

  const processDocxFile = useCallback(
    async (arrayBuffer: ArrayBuffer) => {
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
        handleGridSelection(grid);
      } catch (err) {
        console.error('Error processing DOCX file:', err);
        onError?.('Chyba zpracování souboru.');
      }
    },
    [handleGridSelection, onError, parseDoc, parseHtmlTable]
  );

  const handleFileUpload = useCallback(
    (fileInputEvent: ChangeEvent<HTMLInputElement>) => {
      const file = fileInputEvent.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      const name = file.name.toLowerCase();

      if (name.endsWith('.docx')) {
        reader.onload = (ev) => {
          const result = ev.target?.result;
          if (result instanceof ArrayBuffer) {
            void processDocxFile(result);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (name.endsWith('.html') || name.endsWith('.htm')) {
        reader.onload = (ev) => {
          const result = ev.target?.result;
          if (typeof result === 'string') {
            processHtmlFile(result);
          }
        };
        reader.readAsText(file);
      } else {
        onError?.('Prosím vyberte DOCX nebo HTML soubor obsahující tabulku.');
      }

      // reset input so the same file can be reselected later
      const target = fileInputEvent.target as HTMLInputElement;
      target.value = '';
    },
    [onError, processDocxFile, processHtmlFile]
  );

  const debouncedPopulateTable = useDebouncedCallback(
    (idx: string) => {
      if (idx === '' || !storedTables.length) return;
      const i = Number(idx);
      const source = storedTables[i];
      if (!source) {
        onError?.('Nepodařilo se zpracovat vybranou tabulku.');
        return;
      }
      const grid = parseHtmlTable(source);
      handleGridSelection(grid);
    },
    150,
    { maxWait: 500 }
  );

  const handleTableSelect = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const idx = e.target.value;
      setSelectedTableIndex(idx);
      debouncedPopulateTable(idx);
    },
    [debouncedPopulateTable]
  );

  return {
    storedTables,
    selectedTableIndex,
    handleFileUpload,
    handleTableSelect,
    setStoredTables,
    setSelectedTableIndex,
  };
}
