import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UniqueIdentifier } from '@dnd-kit/core';
import clsx from 'clsx';

export type SortableHeaderCellProps = {
  id: UniqueIdentifier;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  as?: 'th' | 'div';
};

function SortableHeaderCellBase({
  id,
  children,
  className,
  style,
  disabled = false,
  as = 'th',
}: SortableHeaderCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const finalStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const classes = clsx(className, 'sortable-header', {
    'is-dragging': isDragging,
    'is-dnd-disabled': disabled,
    'is-draggable': !disabled,
  });

  const Comp: any = as;

  return (
    <Comp
      ref={setNodeRef}
      className={classes}
      style={finalStyle}
      {...attributes}
      {...listeners}   // whole header cell is the drag target
    >
      {children}
    </Comp>
  );
}

export default memo(SortableHeaderCellBase);
