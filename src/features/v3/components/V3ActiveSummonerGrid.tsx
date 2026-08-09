import React from "react";
import { Swords, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import type { V3Summoner } from "@/features/v3/types/v3Types";
import { V3SummonerItem } from "@/features/v3/components/V3SummonerItem";
import { V3CardHeader } from "@/features/v3/components/V3CardHeader";

type V3ActiveSummonerGridProps = {
  summonerList: V3Summoner[];
  isEvaluatePowerEnabled: boolean;
  isDragDisabled?: boolean;
  draggedSourceIndex: number | null;
  previewDropTargetIndex: number | null;
  onEditClick: (summonerItem: V3Summoner) => void;
  onDeleteClick: (summonerItem: V3Summoner) => void;
  onClearAll: () => void;
  onDragStart: (itemIndex: number) => void;
  onDragOverTarget: (itemIndex: number) => void;
  onDragEndOrLeave: () => void;
  onDropOnTarget: (itemIndex: number) => void;
};

export const V3ActiveSummonerGrid = ({
  summonerList,
  isEvaluatePowerEnabled,
  isDragDisabled = false,
  draggedSourceIndex,
  previewDropTargetIndex,
  onEditClick,
  onDeleteClick,
  onClearAll,
  onDragStart,
  onDragOverTarget,
  onDragEndOrLeave,
  onDropOnTarget,
}: V3ActiveSummonerGridProps) => {
  const v3Locales = useV3Locales();
  const rowsArray = Array.from({ length: 5 });

  const totalTeamOnePower = summonerList
    .slice(0, 10)
    .filter((_, index) => index % 2 === 0)
    .reduce((accumulator, item) => accumulator + item.powerScore, 0);

  const totalTeamTwoPower = summonerList
    .slice(0, 10)
    .filter((_, index) => index % 2 === 1)
    .reduce((accumulator, item) => accumulator + item.powerScore, 0);

  const activeSummonerCount = summonerList.slice(0, 10).length;

  const removeAllButton = activeSummonerCount > 0 ? (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClearAll(); }}
      title={v3Locales.activeGrid.removeAllButton}
      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display uppercase tracking-wider text-red-400/80 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-400/40 transition-all duration-150"
    >
      <Trash2 className="w-3 h-3" />
      <span>{v3Locales.activeGrid.removeAllButton}</span>
    </button>
  ) : null;

  return (
    <div
      className={cn(
        "v3-active-grid-card",
        "rounded-lg border border-gold/30 bg-card/80 p-5 shadow-lg mb-5 hextech-frame",
      )}
    >
      <V3CardHeader
        title={v3Locales.activeGrid.cardTitle}
        icon={<Swords className="w-4 h-4" />}
        action={removeAllButton}
        className="mb-3 pb-3 border-b border-gold/20"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blue team Header */}
        <div className="pb-1.5 border-b-2 border-blue-500/50 text-xs font-display uppercase tracking-widest font-bold text-blue-400 flex items-center justify-between">
          <span>{v3Locales.activeGrid.teamOneTitle}</span>
          {isEvaluatePowerEnabled && (
            <span className="text-[10px] font-mono text-blue-300/90">
              Power: {totalTeamOnePower}
            </span>
          )}
        </div>

        {/* Red team Header */}
        <div className="pb-1.5 border-b-2 border-red-500/50 text-xs font-display uppercase tracking-widest font-bold text-red-400 flex items-center justify-between">
          <span>{v3Locales.activeGrid.teamTwoTitle}</span>
          {isEvaluatePowerEnabled && (
            <span className="text-[10px] font-mono text-red-300/90">
              Power: {totalTeamTwoPower}
            </span>
          )}
        </div>
      </div>

      {/* 5 Rows x 2 Columns Grid */}
      <div className="space-y-2.5 mt-3">
        {rowsArray.map((_, rowIndex) => {
          const teamOneSlotIndex = rowIndex * 2;
          const teamTwoSlotIndex = rowIndex * 2 + 1;

          const teamOneSummoner = summonerList[teamOneSlotIndex];
          const teamTwoSummoner = summonerList[teamTwoSlotIndex];

          return (
            <div key={`active-row-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Blue team Slot */}
              <div>
                {teamOneSummoner ? (
                  <V3SummonerItem
                    summonerItem={teamOneSummoner}
                    itemIndex={teamOneSlotIndex}
                    teamName="team1"
                    isActiveSlot={true}
                    isEvaluatePowerEnabled={isEvaluatePowerEnabled}
                    isDragDisabled={isDragDisabled}
                    isBeingDragged={draggedSourceIndex === teamOneSlotIndex}
                    isPreviewDropTarget={previewDropTargetIndex === teamOneSlotIndex}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onDragStart={onDragStart}
                    onDragOverTarget={onDragOverTarget}
                    onDragEndOrLeave={onDragEndOrLeave}
                    onDropOnTarget={onDropOnTarget}
                  />
                ) : (
                  <div
                    onDragOver={(event) => {
                      if (isDragDisabled) return;
                      event.preventDefault();
                      onDragOverTarget(teamOneSlotIndex);
                    }}
                    onDragLeave={onDragEndOrLeave}
                    onDrop={(event) => {
                      if (isDragDisabled) return;
                      event.preventDefault();
                      onDropOnTarget(teamOneSlotIndex);
                    }}
                    className={cn(
                      "h-[52px] rounded border border-dashed border-gold/30 bg-[#061821]/40",
                      "[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]",
                      "flex items-center justify-center text-xs text-muted-foreground/50 font-display uppercase tracking-wider",
                      !isDragDisabled &&
                        previewDropTargetIndex === teamOneSlotIndex &&
                        "border-gold ring-1 ring-gold/50 bg-gold/10",
                    )}
                  >
                    <span>{v3Locales.activeGrid.emptySlotText}</span>
                  </div>
                )}
              </div>

              {/* Red team Slot */}
              <div>
                {teamTwoSummoner ? (
                  <V3SummonerItem
                    summonerItem={teamTwoSummoner}
                    itemIndex={teamTwoSlotIndex}
                    teamName="team2"
                    isActiveSlot={true}
                    isEvaluatePowerEnabled={isEvaluatePowerEnabled}
                    isDragDisabled={isDragDisabled}
                    isBeingDragged={draggedSourceIndex === teamTwoSlotIndex}
                    isPreviewDropTarget={previewDropTargetIndex === teamTwoSlotIndex}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onDragStart={onDragStart}
                    onDragOverTarget={onDragOverTarget}
                    onDragEndOrLeave={onDragEndOrLeave}
                    onDropOnTarget={onDropOnTarget}
                  />
                ) : (
                  <div
                    onDragOver={(event) => {
                      if (isDragDisabled) return;
                      event.preventDefault();
                      onDragOverTarget(teamTwoSlotIndex);
                    }}
                    onDragLeave={onDragEndOrLeave}
                    onDrop={(event) => {
                      if (isDragDisabled) return;
                      event.preventDefault();
                      onDropOnTarget(teamTwoSlotIndex);
                    }}
                    className={cn(
                      "h-[52px] rounded border border-dashed border-gold/30 bg-[#061821]/40",
                      "[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]",
                      "flex items-center justify-center text-xs text-muted-foreground/50 font-display uppercase tracking-wider",
                      !isDragDisabled &&
                        previewDropTargetIndex === teamTwoSlotIndex &&
                        "border-gold ring-1 ring-gold/50 bg-gold/10",
                    )}
                  >
                    <span>{v3Locales.activeGrid.emptySlotText}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
