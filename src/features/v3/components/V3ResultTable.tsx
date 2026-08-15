import React, { useRef, useState } from "react";
import { Trash2, Camera, Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { V3Summoner, V3Settings, V3MatchResult } from "@/features/v3/types/v3Types";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import { V3MatchCard } from "./V3MatchCard";
import { captureElements } from "@/lib/capture";
import { ScreenshotPreviewDialog } from "@/components/ScreenshotDialogs";
import { LaneRow } from "@/components/LaneRow";
import type { Champion } from "@/lib/lol-api";
import { V3CardHeader } from "@/features/v3/components/V3CardHeader";

import { V3ClearConfirmDialog } from "@/features/v3/components/V3ClearConfirmDialog";

import { SkeletonMatchCard } from "@/components/ui/skeleton";

type V3ResultTableProps = {
  summonerList: V3Summoner[];
  settings: V3Settings;
  matchResults: V3MatchResult[];
  isShufflingAnimation: boolean;
  isDataLoading?: boolean;
  isDisabled?: boolean;
  pendingOutcome: { matchResult: V3MatchResult } | null;
  animatingLaneIdx: number;
  championPool: Champion[];
  onShuffleClick: () => void;
  onLaneComplete: () => void;
  onStopShuffle: () => void;
  onDeleteMatch: (id: string) => void;
  onClearAllMatches: () => void;
};

export const V3ResultTable = ({
  summonerList,
  settings,
  matchResults,
  isShufflingAnimation,
  isDataLoading = false,
  isDisabled = false,
  pendingOutcome,
  animatingLaneIdx,
  championPool,
  onShuffleClick,
  onLaneComplete,
  onStopShuffle,
  onDeleteMatch,
  onClearAllMatches,
}: V3ResultTableProps) => {
  const v3Locales = useV3Locales();
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const activeSummoners = summonerList.slice(0, 10);
  const isShuffleDisabled = activeSummoners.length < 1 || isShufflingAnimation || isDisabled;

  const handleCaptureAll = async () => {
    if (!listContainerRef.current) return;
    try {
      const dataUrl = await captureElements([listContainerRef.current]);
      setPreviewDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to capture all matches screenshot:", err);
    }
  };

  const handleSaveScreenshot = () => {
    if (!previewDataUrl) return;
    const link = document.createElement("a");
    link.download = `lol-v3-matches-${Date.now()}.png`;
    link.href = previewDataUrl;
    link.click();
    setPreviewDataUrl(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Header Bar */}
      <div className="rounded-lg border border-gold/30 bg-card/90 p-4 shadow-xl hextech-frame flex flex-wrap items-center justify-between gap-3">
        <V3CardHeader
          title={v3Locales.matchResults.cardTitle}
          icon={<Swords className="w-4 h-4" />}
          className="py-0 flex-1 min-w-[180px]"
        />

        {/* Global Controls: Shuffle, Screenshot All, Clear All */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onShuffleClick}
            disabled={isShuffleDisabled}
            className={cn(
              "px-5 py-2 rounded font-display uppercase tracking-wider text-xs font-bold transition-all shadow-md flex items-center justify-center cursor-pointer",
              "bg-gradient-to-r from-gold/80 via-gold to-gold-bright text-black hover:brightness-110 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isShufflingAnimation && "animate-pulse",
            )}
          >
            <span>
              {isShufflingAnimation
                ? v3Locales.matchResults.shufflingText
                : v3Locales.matchResults.shuffleButton}
            </span>
          </button>

          {matchResults.length > 0 && (
            <>
              <button
                type="button"
                disabled={isDisabled}
                onClick={handleCaptureAll}
                className="px-3 py-2 rounded border border-gold/30 bg-background/80 hover:bg-gold/20 text-gold-bright transition-all text-xs font-display flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {v3Locales.matchResults.screenshotAllButton}
                </span>
              </button>

              <button
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) setIsClearConfirmOpen(true);
                }}
                className="px-3 py-2 rounded border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-red-300 transition-all text-xs font-display flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{v3Locales.matchResults.clearAllButton}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Shuffle Arena Animation Section */}
      {isShufflingAnimation && pendingOutcome && animatingLaneIdx >= 0 && (
        <div className="rounded-lg border border-gold/40 bg-card/90 p-4 shadow-xl hextech-frame space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gold/20 pb-2">
            <span className="font-display text-xs uppercase tracking-[0.2em] text-gold-bright flex items-center gap-2">
              {(() => {
                const activeLanes = pendingOutcome.matchResult.lanes.filter(
                  (lane) => lane.bluePlayer !== null || lane.redPlayer !== null,
                );
                const currentLane = pendingOutcome.matchResult.lanes[animatingLaneIdx];
                const currentStep =
                  activeLanes.findIndex((lane) => lane.role === currentLane?.role) + 1;
                const totalSteps = activeLanes.length;

                return (
                  <span>
                    {v3Locales.matchResults.shufflingText} Lane {currentStep > 0 ? currentStep : 1}{" "}
                    / {totalSteps > 0 ? totalSteps : 1}
                  </span>
                );
              })()}
            </span>
            <button
              type="button"
              onClick={onStopShuffle}
              className="px-2.5 py-1 rounded bg-destructive/20 hover:bg-destructive/30 text-destructive text-xs font-display uppercase tracking-wider font-bold border border-destructive/40 transition-colors cursor-pointer"
            >
              ✕ Stop
            </button>
          </div>

          <div className="flex items-center justify-center p-2 min-h-[200px]">
            {(() => {
              const currentLane = pendingOutcome.matchResult.lanes[animatingLaneIdx];
              if (!currentLane) return null;
              return (
                <div className="w-full">
                  <LaneRow
                    key={`v3-lane-anim-${animatingLaneIdx}`}
                    index={animatingLaneIdx}
                    finalRole={currentLane.role}
                    alphaName={currentLane.bluePlayer?.name ?? null}
                    betaName={currentLane.redPlayer?.name ?? null}
                    alphaChampion={currentLane.bluePlayer?.champion ?? null}
                    betaChampion={currentLane.redPlayer?.champion ?? null}
                    allMemberNames={activeSummoners.map((s) => s.name)}
                    championPool={championPool}
                    scale={1}
                    onComplete={onLaneComplete}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Match Results List Container */}
      <div
        ref={listContainerRef}
        data-capture-target="true"
        className="space-y-4 bg-background/30 p-2 rounded-lg border border-gold/10"
      >
        {isDataLoading ? (
          <div className="space-y-4">
            <SkeletonMatchCard />
            <SkeletonMatchCard />
          </div>
        ) : matchResults.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gold/20 bg-card/50 p-12 text-center text-muted-foreground/60 space-y-3">
            <Trophy className="w-10 h-10 mx-auto text-gold/30" />
            <p className="text-sm font-sans">{v3Locales.matchResults.noMatchText}</p>
          </div>
        ) : (
          matchResults.map((match, matchIndex) => (
            <V3MatchCard
              key={match.id}
              match={match}
              matchIndex={matchIndex}
              totalMatches={matchResults.length}
              onDelete={onDeleteMatch}
              onOpenScreenshotPreview={(dataUrl) => setPreviewDataUrl(dataUrl)}
            />
          ))
        )}
      </div>

      {/* Screenshot Preview Dialog */}
      <ScreenshotPreviewDialog
        isOpen={Boolean(previewDataUrl)}
        dataUrl={previewDataUrl}
        onClose={() => setPreviewDataUrl(null)}
        onSave={handleSaveScreenshot}
      />

      {/* Clear All Match Results Confirmation Dialog */}
      <V3ClearConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirmClear={onClearAllMatches}
      />
    </div>
  );
};
