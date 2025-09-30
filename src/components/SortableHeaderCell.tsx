import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UniqueIdentifier } from '@dnd-kit/core';

export type SortableHeaderCellProps = {
  id: UniqueIdentifier;           // <-- was string
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  as?: 'th' | 'div';
};

function SortableHeaderCellBase({ id, children, className, style, disabled = false, as = 'th' }: SortableHeaderCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const finalStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    cursor: disabled ? 'default' : 'grab',
    userSelect: 'none',
  };
  const Comp: any = as;
  return (
    <Comp ref={setNodeRef} className={className} style={finalStyle} {...attributes} {...listeners}>
      {children}
    </Comp>
  );
}

export default memo(SortableHeaderCellBase);
