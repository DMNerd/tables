import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UniqueIdentifier } from '@dnd-kit/core';
import clsx from 'clsx';

export type SortableRowProps = {
  id: UniqueIdentifier;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

function SortableRowBase({
  id,
  children,
  className,
  style,
  disabled = false,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const finalStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const classes = clsx(className, 'sortable-row', {
    'is-dragging': isDragging,
    'is-dnd-disabled': disabled,
    'is-draggable': !disabled,
  });

  return (
    <tr
      ref={setNodeRef}
      className={classes}
      style={finalStyle}
      {...attributes}
      {...listeners}   // entire row is the drag target
    >
      {children}
    </tr>
  );
}

export default memo(SortableRowBase);
