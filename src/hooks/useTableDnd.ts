import { useCallback } from 'react';
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';

type DraggableId = string | number;

type UseTableDndArgs = {
  headerIds: DraggableId[];
  rowIds: DraggableId[];
  moveColumn: (from: number, to: number) => void;
  moveRow: (from: number, to: number) => void;
  dragDistance?: number;
};

type UseTableDndResult = {
  headerDnd: {
    sensors: ReturnType<typeof useSensors>;
    onDragEnd: (event: DragEndEvent) => void;
  };
  rowDnd: {
    sensors: ReturnType<typeof useSensors>;
    onDragEnd: (event: DragEndEvent) => void;
  };
};

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
}: UseTableDndArgs): UseTableDndResult {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: dragDistance } })
  );

  const onHeaderDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const from = headerIds.indexOf(active.id as DraggableId);
      const to = headerIds.indexOf(over.id as DraggableId);
      if (from !== -1 && to !== -1) moveColumn(from, to);
    },
    [headerIds, moveColumn]
  );

  const onRowDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const from = rowIds.indexOf(active.id as DraggableId);
      const to = rowIds.indexOf(over.id as DraggableId);
      if (from !== -1 && to !== -1) moveRow(from, to);
    },
    [rowIds, moveRow]
  );

  return {
    headerDnd: { sensors, onDragEnd: onHeaderDragEnd },
    rowDnd: { sensors, onDragEnd: onRowDragEnd },
  };
}
