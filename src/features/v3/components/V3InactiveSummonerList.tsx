import React, { useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import type { V3Summoner } from "@/features/v3/types/v3Types";
import { V3SummonerItem } from "@/features/v3/components/V3SummonerItem";
import { V3CardHeader } from "@/features/v3/components/V3CardHeader";
import { SkeletonSummonerSlot } from "@/components/ui/skeleton";

type V3InactiveSummonerListProps = {
  summonerList: V3Summoner[];
  isEvaluatePowerEnabled: boolean;
  isDragDisabled?: boolean;
  isDataLoading?: boolean;
  isDisabled?: boolean;
  draggedSourceIndex: number | null;
  previewDropTargetIndex: number | null;
  onEditClick: (summonerItem: V3Summoner) => void;
  onDeleteClick: (summonerItem: V3Summoner) => void;
  onDragStart: (itemIndex: number) => void;
  onDragOverTarget: (itemIndex: number) => void;
  onDragEndOrLeave: () => void;
  onDropOnTarget: (itemIndex: number) => void;
};

export const V3InactiveSummonerList = ({
  summonerList,
  isEvaluatePowerEnabled,
  isDragDisabled = false,
  isDataLoading = false,
  isDisabled = false,
  draggedSourceIndex,
  previewDropTargetIndex,
  onEditClick,
  onDeleteClick,
  onDragStart,
  onDragOverTarget,
  onDragEndOrLeave,
  onDropOnTarget,
}: V3InactiveSummonerListProps) => {
  const v3Locales = useV3Locales();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const inactiveSummoners = summonerList.slice(10);
  const effectiveDragDisabled = isDragDisabled || isDisabled;

  return (
    <div
      className={cn(
        "v3-inactive-list-card",
        "rounded-lg border border-gold/30 bg-card/80 p-5 shadow-lg mb-5 hextech-frame transition-all",
      )}
    >
      <V3CardHeader
        title={`${v3Locales.inactiveList.cardTitle} (${inactiveSummoners.length})`}
        icon={<Users className="w-4 h-4" />}
        isCollapsible={true}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <div className="mt-3 border-t border-gold/20 pt-3 animate-fade-in">
          {isDataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonSummonerSlot key={`inactive-skeleton-${idx}`} />
              ))}
            </div>
          ) : inactiveSummoners.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground/60 italic border border-dashed border-gold/20 rounded">
              {v3Locales.inactiveList.emptyListText}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {inactiveSummoners.map((summonerItem, offsetIndex) => {
                const actualIndex = 10 + offsetIndex;

                return (
                  <V3SummonerItem
                    key={summonerItem.id}
                    summonerItem={summonerItem}
                    itemIndex={actualIndex}
                    isActiveSlot={false}
                    isEvaluatePowerEnabled={isEvaluatePowerEnabled}
                    isDragDisabled={effectiveDragDisabled}
                    isBeingDragged={draggedSourceIndex === actualIndex}
                    isPreviewDropTarget={previewDropTargetIndex === actualIndex}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onDragStart={onDragStart}
                    onDragOverTarget={onDragOverTarget}
                    onDragEndOrLeave={onDragEndOrLeave}
                    onDropOnTarget={onDropOnTarget}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
