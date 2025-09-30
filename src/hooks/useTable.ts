import { useState, useCallback } from 'react';
import useIdFactory from '@/hooks/useIdFactory';
import { sanitizeText } from '@/utils/sanitize';
import type { TableGrid, SetFromGrid } from '@/types/table';

// small immutable mover
const arrayMove = <T,>(arr: T[], from: number, to: number): T[] => {
  if (from === to) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

type UseTableResult = {
  headers: string[];
  rows: string[][];
  headerIds: number[];
  rowIds: number[];
  addRow: () => void;
  addColumn: () => void;
  deleteRow: (index: number) => void;
  deleteColumn: (index: number) => boolean;
  updateHeader: (index: number, value: string) => void;
  updateCell: (rowIndex: number, cellIndex: number, value: string) => void;
  setFromGrid: SetFromGrid;
  moveRow: (from: number, to: number) => void;
  moveColumn: (from: number, to: number) => void;
};

export default function useTable(initialCols = 3, initialRows = 2): UseTableResult {
  const getId = useIdFactory();

  // IMPORTANT: use Array.from, not Array(n).map(...)
  const [headers, setHeaders] = useState<string[]>(
    Array.from({ length: initialCols }, () => '')
  );
  const [rows, setRows] = useState<string[][]>(
    Array.from({ length: initialRows }, () =>
      Array.from({ length: initialCols }, () => '')
    )
  );
  const [headerIds, setHeaderIds] = useState<number[]>(
    Array.from({ length: initialCols }, () => getId())
  );
  const [rowIds, setRowIds] = useState<number[]>(
    Array.from({ length: initialRows }, () => getId())
  );

  const setFromGrid = useCallback<SetFromGrid>(
    (grid) => {
      if (!grid.length) return;
      const [h, ...r] = grid;

      const safeHeaders = Array.isArray(h) ? h : [];
      const colCount = safeHeaders.length;

      setHeaders(safeHeaders);
      setHeaderIds(Array.from({ length: colCount }, () => getId()));

      const normalizedRows = r.map((row) => {
        const base = Array.from({ length: colCount }, () => '');
        for (let i = 0; i < Math.min(colCount, row.length); i++) base[i] = row[i];
        return base;
      });

      setRows(normalizedRows);
      setRowIds(Array.from({ length: normalizedRows.length }, () => getId()));
    },
    [getId]
  );

  // -------- CRUD: columns --------
  const addColumn = useCallback(() => {
    setHeaders((prev) => [...prev, '']);
    setHeaderIds((prev) => [...prev, getId()]);
    setRows((prev) => prev.map((row) => [...row, '']));
  }, [getId]);

  const deleteColumn = useCallback((index: number) => {
    // return false if we would remove the last column
    let ok = true;
    setHeaders((prev) => {
      if (prev.length <= 1) {
        ok = false;
        return prev;
      }
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    if (!ok) return false;

    setHeaderIds((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setRows((prev) =>
      prev.map((row) => {
        const next = [...row];
        next.splice(index, 1);
        return next;
      })
    );
    return true;
  }, []);

  // -------- CRUD: rows --------
  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      Array.from({ length: headers.length }, () => ''),
    ]);
    setRowIds((prev) => [...prev, getId()]);
  }, [headers.length, getId]);

  const deleteRow = useCallback((index: number) => {
    setRows((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setRowIds((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  // -------- Updates --------
  const updateHeader = useCallback((index: number, value: string) => {
    const v = sanitizeText(value);
    setHeaders((prev) => prev.map((h, i) => (i === index ? v : h)));
  }, []);

  const updateCell = useCallback((rowIndex: number, cellIndex: number, value: string) => {
    const v = sanitizeText(value);
    setRows((prev) =>
      prev.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) => (c === cellIndex ? v : cell))
          : row
      )
    );
  }, []);

  // -------- Reorder (DnD) --------
  const moveRow = useCallback((from: number, to: number) => {
    setRows((prev) => arrayMove(prev, from, to));
    setRowIds((prev) => arrayMove(prev, from, to));
  }, []);

  const moveColumn = useCallback((from: number, to: number) => {
    if (from === to) return;
    setHeaders((prev) => arrayMove(prev, from, to));
    setHeaderIds((prev) => arrayMove(prev, from, to));
    setRows((prev) =>
      prev.map((row) => {
        const copy = [...row];
        const [cell] = copy.splice(from, 1);
        copy.splice(to, 0, cell);
        return copy;
      })
    );
  }, []);

  return {
    headers,
    rows,
    headerIds,
    rowIds,

    // expose CRUD
    addRow,
    addColumn,
    deleteRow,
    deleteColumn,

    // expose updates
    updateHeader,
    updateCell,
    setFromGrid,

    // expose reordering
    moveRow,
    moveColumn,
  };
}
