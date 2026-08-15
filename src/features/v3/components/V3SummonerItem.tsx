import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { DragDropVerticalIcon, Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { V3Summoner } from "@/features/v3/types/v3Types";
import { BananaPowerDisplay } from "@/features/v3/components/BananaPowerDisplay";

type V3SummonerItemProps = {
  summonerItem: V3Summoner;
  itemIndex: number;
  teamName?: "team1" | "team2";
  isActiveSlot: boolean;
  isEvaluatePowerEnabled: boolean;
  isDragDisabled?: boolean;
  isBeingDragged: boolean;
  isPreviewDropTarget: boolean;
  onEditClick: (summonerItem: V3Summoner) => void;
  onDeleteClick: (summonerItem: V3Summoner) => void;
  onDragStart: (itemIndex: number) => void;
  onDragOverTarget: (itemIndex: number) => void;
  onDragEndOrLeave: () => void;
  onDropOnTarget: (itemIndex: number) => void;
};

export const V3SummonerItem = ({
  summonerItem,
  itemIndex,
  teamName,
  isActiveSlot,
  isEvaluatePowerEnabled,
  isDragDisabled = false,
  isBeingDragged,
  isPreviewDropTarget,
  onEditClick,
  onDeleteClick,
  onDragStart,
  onDragOverTarget,
  onDragEndOrLeave,
  onDropOnTarget,
}: V3SummonerItemProps) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDragDisabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", itemIndex.toString());
    event.dataTransfer.effectAllowed = "move";
    onDragStart(itemIndex);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDragDisabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragOverTarget(itemIndex);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDragDisabled) return;
    event.preventDefault();
    onDropOnTarget(itemIndex);
  };

  return (
    <div
      draggable={!isDragDisabled}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={onDragEndOrLeave}
      onDragEnd={onDragEndOrLeave}
      onDrop={handleDrop}
      className={cn(
        "v3-summoner-item",
        "group relative flex items-center justify-between px-3 py-2 min-h-[52px] transition-all duration-150 select-none border",
        isDragDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        // Clip-path hex cut corners
        "[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]",
        "bg-[#061821] border-gold/30 text-gold-bright hover:border-gold/60",
        isBeingDragged && "opacity-40 scale-[0.98] border-gold-bright",
        isPreviewDropTarget && "ring-1 ring-gold bg-gold/20 border-gold-bright",
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Drag Drop Icon */}
        <div
          className={cn(
            "transition-colors shrink-0",
            isDragDisabled
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-muted-foreground/60 group-hover:text-gold-bright cursor-grab",
          )}
          title={
            isDragDisabled
              ? "Drag & drop bị tắt khi Shuffle Team hoặc Power Evaluate bật"
              : "Kéo thả để đổi vị trí"
          }
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} className="w-3.5 h-3.5" />
        </div>

        {/* Power and Name in Flex Column */}
        <div className="flex flex-col min-w-0 justify-center gap-0.5">
          <span className="font-display font-medium text-sm sm:text-base tracking-wide truncate">
            {summonerItem.name}
          </span>
          {isEvaluatePowerEnabled && <BananaPowerDisplay powerScore={summonerItem.powerScore} />}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Action icons: Edit and Delete */}
        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEditClick(summonerItem);
            }}
            title="Sửa summoner"
            className="p-1 rounded hover:bg-gold/20 text-muted-foreground hover:text-gold-bright transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Edit02Icon} className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteClick(summonerItem);
            }}
            title="Xóa summoner"
            className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
