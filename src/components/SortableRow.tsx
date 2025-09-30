import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UniqueIdentifier } from '@dnd-kit/core';

export type SortableRowProps = {
  id: UniqueIdentifier;           // <-- was string
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

function SortableRowBase({ id, children, className, style, disabled = false }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const finalStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    cursor: disabled ? 'default' : 'grab',
  };
  return (
    <tr ref={setNodeRef} className={className} style={finalStyle} {...attributes} {...listeners}>
      {children}
    </tr>
  );
}

export default memo(SortableRowBase);
