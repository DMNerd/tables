import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { CSSProperties, PropsWithChildren } from 'react';

type SortableRowProps = PropsWithChildren<{
  id: UniqueIdentifier;
}>;

export default function SortableRow({ id, children }: SortableRowProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform ?? null),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    cursor: 'grab',
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
}
