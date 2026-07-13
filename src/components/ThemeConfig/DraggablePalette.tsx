import React, { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Sortable Item Component ──────────────────────────────────────────────────

interface SortableColorProps {
  id: string;
  color: string;
  roleLabel: string;
  size: number;
}

const SortableColor: React.FC<SortableColorProps> = ({ id, color, roleLabel, size }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col items-center gap-1.5 ${isDragging ? "opacity-90" : ""}`}
    >
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
        {roleLabel}
      </span>
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded-xl border border-black/10 shadow-sm active:cursor-grabbing active:scale-110 active:shadow-md transition-shadow"
        style={{
          backgroundColor: color,
          width: size,
          height: size,
        }}
        title={`Kéo thả để di chuyển màu ${color}`}
      />
      <span className="text-[10px] font-mono text-gray-600 dark:text-gray-300">
        {color.toUpperCase()}
      </span>
    </div>
  );
};

// ─── Main Draggable Palette Component ─────────────────────────────────────────

interface DraggablePaletteProps {
  colors: string[];
  onChange: (reordered: string[]) => void;
  size?: number;
}

const ROLES = ["Chính", "Phụ", "Nổi bật", "Nền"];

const DraggablePalette: React.FC<DraggablePaletteProps> = ({
  colors,
  onChange,
  size = 44,
}) => {
  // We need unique IDs for dnd-kit. Using the color + index ensures stability
  // even if colors are duplicated, though duplicate colors in a palette are rare.
  const items = useMemo(
    () => colors.map((color, index) => ({ id: `${color}-${index}`, color })),
    [colors]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      onChange(reorderedItems.map((item) => item.color));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          {items.map((item, index) => (
            <SortableColor
              key={item.id}
              id={item.id}
              color={item.color}
              roleLabel={ROLES[index] || ""}
              size={size}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};

export default DraggablePalette;
