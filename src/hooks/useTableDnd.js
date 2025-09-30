import { useCallback } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

/**
 * Encapsulates dnd-kit sensors and drag-end handlers for the table.
 *
 * Usage:
 *   const { headerDnd, rowDnd } = useTableDnd({ headerIds, rowIds, moveColumn, moveRow });
 *   <DndContext {...headerDnd}>...</DndContext>
 *   <DndContext {...rowDnd}>...</DndContext>
 */
export default function useTableDnd({
  headerIds,
  rowIds,
  moveColumn,
  moveRow,
  dragDistance = 6, // small threshold so typing/selecting text isn't interrupted
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: dragDistance } })
  );

  const onHeaderDragEnd = useCallback(
    ({ active, over }) => {
      if (!over || active.id === over.id) return;
      const from = headerIds.indexOf(active.id);
      const to = headerIds.indexOf(over.id);
      if (from !== -1 && to !== -1) moveColumn(from, to);
    },
    [headerIds, moveColumn]
  );

  const onRowDragEnd = useCallback(
    ({ active, over }) => {
      if (!over || active.id === over.id) return;
      const from = rowIds.indexOf(active.id);
      const to = rowIds.indexOf(over.id);
      if (from !== -1 && to !== -1) moveRow(from, to);
    },
    [rowIds, moveRow]
  );

  return {
    headerDnd: { sensors, onDragEnd: onHeaderDragEnd },
    rowDnd: { sensors, onDragEnd: onRowDragEnd },
  };
}
