import React, { useState } from 'react';
import { withSwal } from 'react-sweetalert2';
import * as mammoth from 'mammoth/mammoth.browser.js';
import './App.css';

function App({ swal }) {
  const [headers, setHeaders] = useState(['', '', '']);
  const [rows, setRows] = useState([
    ['', '', ''],
    ['', '', ''],
  ]);
  const [markdown, setMarkdown] = useState('');
  const [storedTables, setStoredTables] = useState([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState('');

  const addRow = () => {
    setRows((prev) => [...prev, Array(headers.length).fill('')]);
  };

  const addColumn = () => {
    setHeaders((prev) => [...prev, '']);
    setRows((prev) => prev.map((row) => [...row, '']));
  };

  const updateHeader = (index, value) => {
    setHeaders((prev) => prev.map((h, i) => (i === index ? value : h)));
  };

  const updateCell = (rowIndex, cellIndex, value) => {
    setRows((prev) =>
      prev.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) => (c === cellIndex ? value : cell))
          : row
      )
    );
  };

  const generateMarkdown = () => {
    const headerLine =
      '| ' + headers.map((h) => (h || '').replace(/\n/g, ' / ')).join(' | ') + ' |';
    const separatorLine =
      '| ' + headers.map(() => '---').join(' | ') + ' |';
    const rowLines = rows.map(
      (row) =>
        '| ' + row.map((cell) => (cell || '').replace(/\n/g, ' / ')).join(' | ') + ' |'
    );
    const md = [headerLine, separatorLine, ...rowLines].join('\n') + '\n';
    setMarkdown(md);
  };

  const populateTableFromMarkdown = (md) => {
    const lines = md.trim().split('\n');
    if (lines.length < 2) return;
    const headerData = lines[0]
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);
    const rowData = lines
      .slice(2)
      .map((row) =>
        row
          .split('|')
          .map((cell) => cell.trim())
          .filter(Boolean)
      );
    setHeaders(headerData.map((h) => h.replace(/ \/ /g, ' ')));
    setRows(rowData.map((row) => row.map((c) => c.replace(/ \/ /g, ' '))));
  };

  const handleMarkdownChange = (e) => {
    const value = e.target.value;
    setMarkdown(value);
    populateTableFromMarkdown(value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        processDocxFile(ev.target.result);
      };
      reader.readAsArrayBuffer(file);
    } else {
      showError('Prosím vyberte DOCX soubor obsahující tabulku.');
    }
    e.target.value = '';
  };

  const processDocxFile = (arrayBuffer) => {
    mammoth
      .convertToHtml({ arrayBuffer })
      .then((result) => {
        const docHtml = new DOMParser().parseFromString(result.value, 'text/html');
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

  const populateFromHtmlTable = (html) => {
    const table =
      typeof html === 'string'
        ? new DOMParser().parseFromString(html, 'text/html').querySelector('table')
        : html;
    if (!table) return;
    let maxColumns = 0;
    Array.from(table.rows).forEach((row) => {
      if (row.cells.length > maxColumns) {
        maxColumns = row.cells.length;
      }
    });
    const headerRowCells = Array.from(table.rows[0].cells).map((cell) =>
      cleanText(cell.innerHTML)
    );
    const newHeaders = [...headerRowCells];
    while (newHeaders.length < maxColumns) {
      newHeaders.push('');
    }
    setHeaders(newHeaders);
    const dataRows = Array.from(table.rows)
      .slice(1)
      .map((htmlRow, rowIndex) => {
        const totalCells = htmlRow.cells.length;
        const leftPadding = Math.floor((maxColumns - totalCells) / 2);
        const rightPadding = maxColumns - totalCells - leftPadding;
        const rowData = [];
        for (let i = 0; i < leftPadding; i++) rowData.push('');
        Array.from(htmlRow.cells).forEach((cell) => {
          rowData.push(cleanText(cell.innerHTML));
        });
        for (let i = 0; i < rightPadding; i++) rowData.push('');
        return rowData;
      });
    setRows(dataRows);
  };

  const handleTableSelect = (e) => {
    const index = e.target.value;
    setSelectedTableIndex(index);
    if (index !== '') {
      populateFromHtmlTable(storedTables[index]);
    }
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
          <button onClick={addRow}>Přidat řádek</button>
          <button onClick={addColumn}>Přidat Sloupec</button>
        </div>
        <table id="inputTable">
          <tbody>
            <tr>
              {headers.map((header, i) => (
                <th key={i}>
                  <input
                    type="text"
                    value={header}
                    placeholder={`Nadpis ${i + 1}`}
                    onChange={(e) => updateHeader(i, e.target.value)}
                  />
                </th>
              ))}
            </tr>
          </tbody>
        </table>
        <hr className="separator" />
        <table id="inputTableRows">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    <input
                      type="text"
                      value={cell}
                      placeholder={`Řádek ${rowIndex + 1}, Sloupec ${cellIndex + 1}`}
                      onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="action-buttons">
          <button onClick={generateMarkdown}>Generovat/Formátovat Tabulku</button>
          <label className="upload-label">
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
