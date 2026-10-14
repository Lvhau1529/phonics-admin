import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface SortableHandleProps extends HTMLAttributes<HTMLElement> {
  ref: (node: HTMLElement | null) => void;
}

export interface SortableRenderState {
  /** Gắn vào nút kéo (icon ⋮⋮) */
  handleProps: SortableHandleProps;
  isDragging: boolean;
}

interface SortableListProps {
  /** Id ổn định theo thứ tự hiện tại */
  items: readonly string[];
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
  gap?: number;
  children: (id: string, state: SortableRenderState, index: number) => ReactNode;
}

interface RowProps {
  id: string;
  index: number;
  disabled: boolean;
  render: SortableListProps['children'];
}

function SortableRow({ id, index, disabled, render }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  };
  const handleProps: SortableHandleProps = {
    ref: setActivatorNodeRef,
    ...attributes,
    ...listeners,
    style: { cursor: disabled ? 'default' : 'grab', touchAction: 'none' },
  };
  return (
    <div ref={setNodeRef} style={style}>
      {render(id, { handleProps, isDragging }, index)}
    </div>
  );
}

/**
 * Danh sách kéo-thả dọc (dnd-kit): sắp xếp lựa chọn / câu / Part. Kéo bằng chuột, chạm hoặc bàn phím (Space + mũi tên).
 * Dùng với Form.List: `items = fields.map(f => String(f.key))`, `onMove = move`.
 */
export function SortableList({ items, onMove, disabled = false, gap = 8, children }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.indexOf(String(active.id));
    const to = items.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onMove(from, to);
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={[...items]} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {items.map((id, index) => (
            <SortableRow key={id} id={id} index={index} disabled={disabled} render={children} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/** Icon tay cầm chuẩn cho hàng kéo thả */
export function DragHandle({ handleProps }: { handleProps: SortableHandleProps }) {
  const { token } = theme.useToken();
  const { ref, ...rest } = handleProps;
  return (
    <span
      ref={ref}
      {...rest}
      aria-label="drag"
      style={{ ...rest.style, color: token.colorTextTertiary, padding: 4 }}
    >
      <HolderOutlined />
    </span>
  );
}
