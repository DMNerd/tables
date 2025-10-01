// src/App.tsx
import React from 'react';
import { withSwal } from 'react-sweetalert2';
import { FaPlus, FaColumns, FaFileAlt, FaUpload, FaTrash } from 'react-icons/fa';
import clsx from 'clsx';
import type Swal from 'sweetalert2';
import '@/styles/App.css';

import useTable from '@/hooks/useTable';
import useHtmlTableParser from '@/hooks/useHtmlTableParser';
import useMarkdownSync from '@/hooks/useMarkdownSync';
import useFileImport from '@/hooks/useFileImport';
import useTableDnd from '@/hooks/useTableDnd';

// dnd-kit
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import SortableHeaderCell from '@/components/SortableHeaderCell';
import SortableRow from '@/components/SortableRow';

type AppProps = {
  swal: typeof Swal;
};

function App({ swal }: AppProps): JSX.Element {
  const showError = (message: string) =>
    swal.fire({ icon: 'error', title: 'Chyba', text: message, confirmButtonText: 'OK' });

  const { parse } = useHtmlTableParser();

  const {
    headers,
    rows,
    headerIds,
    rowIds,
    addRow,
    addColumn,
    deleteRow,
    deleteColumn,
    updateHeader,
    updateCell,
    setFromGrid,
    moveRow,
    moveColumn,
  } = useTable(3, 2);

  const { markdown, generateMarkdown, onMarkdownChange } = useMarkdownSync(
    headers,
    rows,
    setFromGrid
  );

  const {
    storedTables,
    selectedTableIndex,
    handleFileUpload,
    handleTableSelect,
  } = useFileImport({
    parseHtmlTable: parse,
    setFromGrid,
    onError: showError,
  });

  const { handleDragStart, handleDragOver, handleDragEnd } = useTableDnd({
    headerIds,
    rowIds,
    onReorderColumns: moveColumn,
    onReorderRows: moveRow,
  });

  // Small threshold so clicks focus inputs, drags require slight movement
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDeleteColumn = (i: number) => {
    const ok = deleteColumn(i);
    if (!ok) showError('Nelze odstranit poslední sloupec.');
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

        {/* Columns: whole header cells are draggable; inputs stop pointer propagation */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={headerIds} strategy={horizontalListSortingStrategy}>
            <table id="inputTable">
              <tbody>
                <tr>
                  {headers.map((header, i) => (
                    <SortableHeaderCell key={headerIds[i]} id={headerIds[i]}>
                      <input
                        type="text"
                        value={header}
                        placeholder={`Nadpis ${i + 1}`}
                        onChange={(e) => updateHeader(i, e.target.value)}
                        onPointerDown={(e) => e.stopPropagation()}
                      />
                    </SortableHeaderCell>
                  ))}
                  <th className="delete-cell" />
                </tr>
              </tbody>
            </table>
          </SortableContext>
        </DndContext>

        <hr className="separator" />

        {/* Rows: whole rows are draggable; inputs stop pointer propagation */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <table id="inputTableRows">
              <tbody>
                {rows.map((row, rowIndex) => (
                  <SortableRow key={rowIds[rowIndex]} id={rowIds[rowIndex]}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIds[rowIndex]}-${headerIds[cellIndex]}`}>
                        <input
                          type="text"
                          value={cell}
                          placeholder={`Řádek ${rowIndex + 1}, Sloupec ${cellIndex + 1}`}
                          onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      </td>
                    ))}
                    <td className="delete-cell">
                      <button
                        className="delete-row-btn"
                        onClick={() => deleteRow(rowIndex)}
                        title="Smazat řádek"
                        aria-label={`Smazat řádek ${rowIndex + 1}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </SortableRow>
                ))}

                {/* Column delete controls row (stays in sync with headerIds order) */}
                <tr className="column-delete-row">
                  {headers.map((_, i) => (
                    <td key={headerIds[i]} className="delete-column-cell">
                      <button
                        className={clsx('delete-column-btn', {
                          disabled: headers.length <= 1,
                        })}
                        onClick={() => handleDeleteColumn(i)}
                        disabled={headers.length <= 1}
                        aria-disabled={headers.length <= 1}
                        title="Smazat sloupec"
                        aria-label={`Smazat sloupec ${i + 1}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  ))}
                  <td className="delete-cell" />
                </tr>
              </tbody>
            </table>
          </SortableContext>
        </DndContext>

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
            className={clsx({ disabled: storedTables.length === 0 })}
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
          onChange={(e) => onMarkdownChange(e.target.value)}
          placeholder="Formátovaná tabulka se zobrazí zde..."
        />
      </div>
    </div>
  );
}

export default withSwal(App);
