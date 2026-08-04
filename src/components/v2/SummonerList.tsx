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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { SummonerItem } from "@/components/v2/SummonerItem";
import { type Summoner } from "@/hooks/useV2Store";

const MAX_SUMMONERS = 10;

type SummonerListProps = {
  summoners: Summoner[];
  showPowerInput?: boolean;
  draggable?: boolean;
  onRemove?: (id: string) => void;
  onReorder?: (orderedIds: string[]) => void;
  onPowerChange?: (id: string, power: number) => void;
};

const SortableSummonerItem = ({
  summoner,
  index,
  showPowerInput,
  onRemove,
  onPowerChange,
}: {
  summoner: Summoner;
  index: number;
  showPowerInput?: boolean;
  onRemove?: () => void;
  onPowerChange?: (power: number) => void;
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
        index={index}
        showPowerInput={showPowerInput}
        power={summoner.power}
        onPowerChange={onPowerChange}
        onRemove={onRemove}
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
}: SummonerListProps) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = summoners.findIndex((summoner) => summoner.id === active.id);
    const newIndex = summoners.findIndex((summoner) => summoner.id === over.id);
    const reordered = arrayMove(summoners, oldIndex, newIndex);
    onReorder?.(reordered.map((summoner) => summoner.id));
  };

  const emptySlots = Array.from({
    length: Math.max(0, MAX_SUMMONERS - summoners.length),
  });

  const listContent = (
    <div className="space-y-1">
      {summoners.map((summoner, index) =>
        draggable ? (
          <SortableSummonerItem
            key={summoner.id}
            summoner={summoner}
            index={index}
            showPowerInput={showPowerInput}
            onRemove={onRemove ? () => onRemove(summoner.id) : undefined}
            onPowerChange={
              onPowerChange ? (power) => onPowerChange(summoner.id, power) : undefined
            }
          />
        ) : (
          <SummonerItem
            key={summoner.id}
            name={summoner.name}
            index={index}
            showPowerInput={showPowerInput}
            power={summoner.power}
            onRemove={onRemove ? () => onRemove(summoner.id) : undefined}
            onPowerChange={
              onPowerChange ? (power) => onPowerChange(summoner.id, power) : undefined
            }
          />
        ),
      )}

      {emptySlots.map((_, index) => (
        <SummonerItem key={`empty-${index}`} index={summoners.length + index} />
      ))}
    </div>
  );

  if (!draggable) return listContent;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={summoners.map((summoner) => summoner.id)}
        strategy={verticalListSortingStrategy}
      >
        {listContent}
      </SortableContext>
    </DndContext>
  );
};
