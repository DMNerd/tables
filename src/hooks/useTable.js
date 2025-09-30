import { useState, useCallback } from 'react';
import useIdFactory from '@/hooks/useIdFactory';
import { sanitizeText } from '@/utils/sanitize';

export default function useTable(initialCols = 3, initialRows = 2) {
  const getId = useIdFactory();
  const [headers, setHeaders] = useState(Array(initialCols).fill(''));
  const [rows, setRows] = useState(Array.from({ length: initialRows }, () => Array(initialCols).fill('')));
  const [headerIds, setHeaderIds] = useState(Array(initialCols).map(() => getId()));
  const [rowIds, setRowIds] = useState(Array(initialRows).map(() => getId()));

  const setFromGrid = useCallback((grid) => {
    if (!grid?.length) return;
    const [h, ...r] = grid;
    setHeaders(h);
    setRows(r);
    setHeaderIds(h.map(() => getId()));
    setRowIds(r.map(() => getId()));
  }, [getId]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, Array(headers.length).fill('')]);
    setRowIds((prev) => [...prev, getId()]);
  }, [headers.length, getId]);

  const addColumn = useCallback(() => {
    setHeaders((prev) => [...prev, '']);
    setHeaderIds((prev) => [...prev, getId()]);
    setRows((prev) => prev.map((row) => [...row, '']));
  }, [getId]);

  const deleteRow = useCallback((index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setRowIds((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const deleteColumn = useCallback((index) => {
    if (headers.length <= 1) return false; // signal not allowed
    setHeaders((prev) => prev.filter((_, i) => i !== index));
    setHeaderIds((prev) => prev.filter((_, i) => i !== index));
    setRows((prev) => prev.map((row) => row.filter((_, i) => i !== index)));
    return true;
  }, [headers.length]);

  const updateHeader = useCallback((index, value) => {
    const sanitized = sanitizeText(value);
    setHeaders((prev) => prev.map((h, i) => (i === index ? sanitized : h)));
  }, []);

  const updateCell = useCallback((rowIndex, cellIndex, value) => {
    const sanitized = sanitizeText(value);
    setRows((prev) =>
      prev.map((row, r) =>
        r === rowIndex ? row.map((cell, c) => (c === cellIndex ? sanitized : cell)) : row
      )
    );
  }, []);

  return {
    headers, rows, headerIds, rowIds,
    addRow, addColumn, deleteRow, deleteColumn,
    updateHeader, updateCell, setFromGrid,
  };
}
