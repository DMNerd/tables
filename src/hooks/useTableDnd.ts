import { useCallback } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';

export type ID = UniqueIdentifier;

export type UseTableDndParams = {
  headerIds: ID[];
  rowIds: ID[];
  onReorderColumns: (fromIndex: number, toIndex: number) => void; 
  onReorderRows: (fromIndex: number, toIndex: number) => void;    
};

export type UseTableDndReturn = {
  handleDragStart: (e: DragStartEvent) => void;
  handleDragOver: (e: DragOverEvent) => void;
  handleDragEnd: (e: DragEndEvent) => void;
};

function indexOfId(ids: ID[], id: ID): number {
  const i = ids.indexOf(id);
  return i < 0 ? -1 : i;
}

export default function useTableDnd({
  headerIds,
  rowIds,
  onReorderColumns,
  onReorderRows,
}: UseTableDndParams): UseTableDndReturn {
  const handleDragStart = useCallback((_e: DragStartEvent) => {}, []);

  const handleDragOver = useCallback((_e: DragOverEvent) => {}, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) return;

      const activeId = active.id as ID;
      const overId = over.id as ID;
      if (activeId === overId) return;

      // headers?
      const fromHeader = indexOfId(headerIds, activeId);
      const toHeader = indexOfId(headerIds, overId);
      if (fromHeader !== -1 && toHeader !== -1) {
        onReorderColumns(fromHeader, toHeader);
        return;
      }

      // rows?
      const fromRow = indexOfId(rowIds, activeId);
      const toRow = indexOfId(rowIds, overId);
      if (fromRow !== -1 && toRow !== -1) {
        onReorderRows(fromRow, toRow);
        return;
      }
    },
    [headerIds, rowIds, onReorderColumns, onReorderRows]
  );

  return { handleDragStart, handleDragOver, handleDragEnd };
}
