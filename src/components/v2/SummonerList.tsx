import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { SummonerItem } from "@/components/v2/SummonerItem";
import { type Summoner } from "@/hooks/useV2Store";

const MAX_SUMMONERS = 10;
const TOTAL_SLOTS = 10;

type SummonerListProps = {
  summoners: Summoner[];
  showPowerInput?: boolean;
  draggable?: boolean;
  onRemove?: (id: string) => void;
  onReorder?: (orderedIds: string[]) => void;
  onPowerChange?: (id: string, power: number) => void;
  onRename?: (id: string, name: string) => void;
};

const SortableSummonerItem = ({
  summoner,
  showPowerInput,
  onRemove,
  onPowerChange,
  onRename,
}: {
  summoner: Summoner;
  showPowerInput?: boolean;
  onRemove?: () => void;
  onPowerChange?: (power: number) => void;
  onRename?: (name: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: summoner.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SummonerItem
        name={summoner.name}
        showPowerInput={showPowerInput}
        power={summoner.power}
        onPowerChange={onPowerChange}
        onRemove={onRemove}
        onRename={onRename}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
};

export const SummonerList = ({
  summoners,
  showPowerInput = false,
  draggable = false,
  onRemove,
  onReorder,
  onPowerChange,
  onRename,
}: SummonerListProps) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = summoners.findIndex((s) => s.id === active.id);
    const newIndex = summoners.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(summoners, oldIndex, newIndex);
    onReorder?.(reordered.map((s) => s.id));
  };

  // Pad to TOTAL_SLOTS with empty entries
  const emptyCount = Math.max(0, TOTAL_SLOTS - summoners.length);
  const emptyKeys = Array.from({ length: emptyCount }, (_, index) => `empty-${index}`);

  const grid = (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {summoners.map((summoner) =>
        draggable ? (
          <SortableSummonerItem
            key={summoner.id}
            summoner={summoner}
            showPowerInput={showPowerInput}
            onRemove={onRemove ? () => onRemove(summoner.id) : undefined}
            onPowerChange={onPowerChange ? (power) => onPowerChange(summoner.id, power) : undefined}
            onRename={onRename ? (name) => onRename(summoner.id, name) : undefined}
          />
        ) : (
          <SummonerItem
            key={summoner.id}
            name={summoner.name}
            showPowerInput={showPowerInput}
            power={summoner.power}
            onRemove={onRemove ? () => onRemove(summoner.id) : undefined}
            onPowerChange={onPowerChange ? (power) => onPowerChange(summoner.id, power) : undefined}
            onRename={onRename ? (name) => onRename(summoner.id, name) : undefined}
          />
        ),
      )}

      {emptyKeys.map((key) => (
        <SummonerItem key={key} />
      ))}
    </div>
  );

  if (!draggable) return grid;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={summoners.map((s) => s.id)}
        strategy={rectSortingStrategy}
      >
        {grid}
      </SortableContext>
    </DndContext>
  );
};
