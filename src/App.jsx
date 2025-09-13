import React, { useState, useMemo, useCallback, useRef } from 'react';
import { withSwal } from 'react-sweetalert2';
import * as mammoth from 'mammoth/mammoth.browser.js';
import DOMPurify from 'dompurify';
import debounce from 'debounce';
import { FaPlus, FaColumns, FaFileAlt, FaUpload, FaTrash } from 'react-icons/fa';
import './App.css';

function App({ swal }) {
  const idRef = useRef(0);
  const getId = () => idRef.current++;
  const [headers, setHeaders] = useState(['', '', '']);
  const [rows, setRows] = useState([
    ['', '', ''],
    ['', '', ''],
  ]);
  const [headerIds, setHeaderIds] = useState([getId(), getId(), getId()]);
  const [rowIds, setRowIds] = useState([getId(), getId()]);
  const [markdown, setMarkdown] = useState('');
  const [storedTables, setStoredTables] = useState([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState('');

  const sanitizeInput = (input) => DOMPurify.sanitize(input);

  const addRow = () => {
    setRows((prev) => [...prev, Array(headers.length).fill('')]);
    setRowIds((prev) => [...prev, getId()]);
  };

  const addColumn = () => {
    setHeaders((prev) => [...prev, '']);
    setHeaderIds((prev) => [...prev, getId()]);
    setRows((prev) => prev.map((row) => [...row, '']));
  };

  const deleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setRowIds((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteColumn = (index) => {
    if (headers.length <= 1) {
      showError('Nelze odstranit poslední sloupec.');
      return;
    }
    setHeaders((prev) => prev.filter((_, i) => i !== index));
    setHeaderIds((prev) => prev.filter((_, i) => i !== index));
    setRows((prev) => prev.map((row) => row.filter((_, i) => i !== index)));
  };

  const updateHeader = (index, value) => {
    const sanitized = sanitizeInput(value);
    setHeaders((prev) => prev.map((h, i) => (i === index ? sanitized : h)));
  };

  const updateCell = (rowIndex, cellIndex, value) => {
    const sanitized = sanitizeInput(value);
    setRows((prev) =>
      prev.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) => (c === cellIndex ? sanitized : cell))
          : row
      )
    );
  };

  const generateMarkdown = () => {
    const headerLine =
      '| ' +
      headers
        .map((h) => sanitizeInput(h || '').replace(/\n/g, ' / '))
        .join(' | ') +
      ' |';
    const separatorLine =
      '| ' + headers.map(() => '---').join(' | ') + ' |';
    const rowLines = rows.map(
      (row) =>
        '| ' +
        row
          .map((cell) => sanitizeInput(cell || '').replace(/\n/g, ' / '))
          .join(' | ') +
        ' |'
    );
    const md = [headerLine, separatorLine, ...rowLines].join('\n') + '\n';
    setMarkdown(md);
  };

  const populateTableFromMarkdown = useCallback((md) => {
    const lines = md.trim().split('\n');
    if (lines.length < 2) return;
    const headerData = lines[0]
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    const rowData = lines.slice(2).map((row) =>
      row
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
    );
    const sanitizedHeaders = headerData.map((h) =>
      sanitizeInput(h.replace(/ \/ /g, ' '))
    );
    const sanitizedRows = rowData.map((row) =>
      row.map((c) => sanitizeInput(c.replace(/ \/ /g, ' ')))
    );
    const columnCount = sanitizedHeaders.length;
    const normalizedRows = sanitizedRows.map((row) => {
      const newRow = [...row];
      while (newRow.length < columnCount) newRow.push('');
      return newRow;
    });
    setHeaders(sanitizedHeaders);
    setRows(normalizedRows);
    setHeaderIds(sanitizedHeaders.map(() => getId()));
    setRowIds(normalizedRows.map(() => getId()));
  }, [sanitizeInput]);

  const debouncedPopulateFromMarkdown = useMemo(
    () => debounce(populateTableFromMarkdown, 300),
    [populateTableFromMarkdown]
  );

  const handleMarkdownChange = (e) => {
    const value = e.target.value;
    setMarkdown(value);
    debouncedPopulateFromMarkdown(value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    const name = file.name.toLowerCase();
    if (name.endsWith('.docx')) {
      reader.onload = (ev) => {
        processDocxFile(ev.target.result);
      };
      reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.html') || name.endsWith('.htm')) {
      reader.onload = (ev) => {
        processHtmlFile(ev.target.result);
      };
      reader.readAsText(file);
    } else {
      showError('Prosím vyberte DOCX nebo HTML soubor obsahující tabulku.');
    }
    e.target.value = '';
  };

  const processDocxFile = (arrayBuffer) => {
    mammoth
      .convertToHtml({ arrayBuffer })
      .then((result) => {
        const sanitizedHtml = DOMPurify.sanitize(result.value, {
          ADD_TAGS: ['table', 'tr', 'td', 'th'],
        });
        const docHtml = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
        const tables = docHtml.querySelectorAll('table');
        if (tables.length > 0) {
          setStoredTables(Array.from(tables).map((t) => t.outerHTML));
          setSelectedTableIndex('0');
          populateFromHtmlTable(tables[0]);
        } else {
          showError('V souboru nebyla nalezena validní tabulka.');
        }
      })
      .catch((error) => {
        console.error('Error processing DOCX file:', error);
        showError('Chyba zpracování souboru.');
      });
  };

  const processHtmlFile = (htmlText) => {
    const sanitizedHtml = DOMPurify.sanitize(htmlText, {
      ADD_TAGS: ['table', 'tr', 'td', 'th'],
    });
    const docHtml = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    const tables = docHtml.querySelectorAll('table');
    if (tables.length > 0) {
      setStoredTables(Array.from(tables).map((t) => t.outerHTML));
      setSelectedTableIndex('0');
      populateFromHtmlTable(tables[0]);
    } else {
      showError('V souboru nebyla nalezena validní tabulka.');
    }
  };

  const populateFromHtmlTable = (html) => {
    const table =
      typeof html === 'string'
        ? new DOMParser()
            .parseFromString(
              DOMPurify.sanitize(html, {
                ADD_TAGS: ['table', 'tr', 'td', 'th'],
              }),
              'text/html'
            )
            .querySelector('table')
        : html;
    if (!table) return;

    const grid = [];
    Array.from(table.rows).forEach((htmlRow, rowIndex) => {
      grid[rowIndex] = grid[rowIndex] || [];
      let colIndex = 0;
      while (grid[rowIndex][colIndex] !== undefined) colIndex++;
      Array.from(htmlRow.cells).forEach((cell) => {
        while (grid[rowIndex][colIndex] !== undefined) colIndex++;
        const content = sanitizeInput(cleanText(cell.innerHTML));
        const colspan = parseInt(cell.getAttribute('colspan')) || 1;
        const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
        grid[rowIndex][colIndex] = content;
        for (let c = 1; c < colspan; c++) {
          grid[rowIndex][colIndex + c] = '';
        }
        for (let r = 1; r < rowspan; r++) {
          grid[rowIndex + r] = grid[rowIndex + r] || [];
          for (let c = 0; c < colspan; c++) {
            grid[rowIndex + r][colIndex + c] = '';
          }
        }
        colIndex += colspan;
      });
    });

    const maxColumns = grid.reduce((max, row) => Math.max(max, row.length), 0);
    const normalizedGrid = grid.map((row) => {
      const newRow = [...row];
      while (newRow.length < maxColumns) newRow.push('');
      return newRow;
    });
    if (normalizedGrid.length === 0) return;
    setHeaders(normalizedGrid[0]);
    setRows(normalizedGrid.slice(1));
    setHeaderIds(normalizedGrid[0].map(() => getId()));
    setRowIds(normalizedGrid.slice(1).map(() => getId()));
  };

  const debouncedPopulateTable = useMemo(
    () =>
      debounce((idx) => {
        if (idx !== '') {
          populateFromHtmlTable(storedTables[idx]);
        }
      }, 150),
    [populateFromHtmlTable, storedTables]
  );

  const handleTableSelect = (e) => {
    const index = e.target.value;
    setSelectedTableIndex(index);
    debouncedPopulateTable(index);
  };

  const cleanText = (text) => {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const showError = (message) => {
    swal.fire({ icon: 'error', title: 'Chyba', text: message, confirmButtonText: 'OK' });
  };

  return (
    <div>
      <h1>Generátor Tabulek (pro vložení do markdown)</h1>
      <div className="table-container">
        <div className="buttons">
          <button className="primary-btn" onClick={addRow}>
            <FaPlus /> Přidat řádek
          </button>
          <button className="primary-btn" onClick={addColumn}>
            <FaColumns /> Přidat Sloupec
          </button>
        </div>
        <table id="inputTable">
          <tbody>
            <tr>
              {headers.map((header, i) => (
                <th key={headerIds[i]}>
                  <input
                    type="text"
                    value={header}
                    placeholder={`Nadpis ${i + 1}`}
                    onChange={(e) => updateHeader(i, e.target.value)}
                  />
                </th>
              ))}
              <th className="delete-cell" />
            </tr>
          </tbody>
        </table>
        <hr className="separator" />
        <table id="inputTableRows">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIds[rowIndex]}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIds[rowIndex]}-${headerIds[cellIndex]}`}>
                    <input
                      type="text"
                      value={cell}
                      placeholder={`Řádek ${rowIndex + 1}, Sloupec ${cellIndex + 1}`}
                      onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                    />
                  </td>
                ))}
                <td className="delete-cell">
                  <button
                    className="delete-row-btn"
                    onClick={() => deleteRow(rowIndex)}
                    title="Smazat řádek"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="column-delete-row">
              {headers.map((_, i) => (
                <td key={headerIds[i]} className="delete-column-cell">
                  <button
                    className="delete-column-btn"
                    onClick={() => deleteColumn(i)}
                    disabled={headers.length <= 1}
                    title="Smazat sloupec"
                  >
                    <FaTrash />
                  </button>
                </td>
              ))}
              <td className="delete-cell" />
            </tr>
          </tbody>
        </table>
        <div className="action-buttons">
          <button className="primary-btn" onClick={generateMarkdown}>
            <FaFileAlt /> Generovat/Formátovat Tabulku
          </button>
          <label className="upload-label">
            <FaUpload />
            <input type="file" accept=".html,.htm,.docx" onChange={handleFileUpload} />
            Nahrát soubor
          </label>
        </div>
        <div className="table-selector-container">
          <label htmlFor="tableSelector">Výběr tabulky ze souboru:</label>
          <select
            id="tableSelector"
            value={selectedTableIndex}
            onChange={handleTableSelect}
            disabled={storedTables.length === 0}
          >
            <option value="" disabled>
              Nejdříve nahrajte soubor
            </option>
            {storedTables.map((_, index) => (
              <option key={index} value={index}>
                Tabulka {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="output-container">
        <textarea
          id="output"
          value={markdown}
          onChange={handleMarkdownChange}
          placeholder="Formátovaná tabulka se zobrazí zde..."
        />
      </div>
    </div>
  );
}

export default withSwal(App);
