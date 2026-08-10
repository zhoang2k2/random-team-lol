import React, { useRef, useState } from "react";
import { Camera, Trash2, Swords } from "lucide-react";
import { ROLE_META } from "@/lib/lol-api";
import type { V3MatchResult } from "@/features/v3/types/v3Types";
import { captureElements } from "@/lib/capture";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type V3MatchCardProps = {
  match: V3MatchResult;
  matchIndex: number;
  totalMatches: number;
  onDelete: (id: string) => void;
  onOpenScreenshotPreview: (dataUrl: string) => void;
};

export const V3MatchCard = ({
  match,
  matchIndex,
  totalMatches,
  onDelete,
  onOpenScreenshotPreview,
}: V3MatchCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const v3Locales = useV3Locales();

  const handleCaptureSingle = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await captureElements([cardRef.current]);
      onOpenScreenshotPreview(dataUrl);
    } catch (err) {
      console.error("Failed to capture match card screenshot:", err);
    }
  };

  const matchNumber = matchIndex + 1;

  return (
    <>
      <div
        ref={cardRef}
        data-capture-target="true"
        className="rounded-lg border border-gold/30 bg-card/90 p-5 shadow-xl hextech-frame space-y-4 animate-fade-in text-foreground"
      >
        {/* Card Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 border border-gold/30 rounded text-gold-bright font-display text-xs font-bold uppercase tracking-wider">
              <Swords className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>
                {v3Locales.matchCard.matchTitle} #{matchNumber}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{match.createdAt}</span>
          </div>

          {/* Action Buttons: Screenshot & Delete (ignored during capture) */}
          <div className="flex items-center gap-2" data-capture-ignore="true">
            <button
              type="button"
              onClick={handleCaptureSingle}
              title={v3Locales.matchResults.screenshotButton}
              className="px-2.5 py-1 rounded border border-gold/30 bg-background/80 hover:bg-gold/20 text-gold-bright hover:text-white transition-all text-xs font-display flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{v3Locales.matchResults.screenshotButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              title={v3Locales.matchResults.deleteButton}
              className="px-2.5 py-1 rounded border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-red-300 transition-all text-xs font-display flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{v3Locales.matchResults.deleteButton}</span>
            </button>
          </div>
        </div>

        {/* Power Score Banner if enabled */}
        {match.isPowerEvaluateActive && (
          <div className="p-2.5 rounded bg-background/80 border border-gold/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-blue-300">
                <span className="font-display uppercase text-[9px] text-blue-400 font-semibold">
                  {v3Locales.matchCard.blueTeam}:
                </span>
                <span className="font-semibold text-[11px] inline-flex items-center gap-1">
                  <span>{match.blueTotalPower}</span>
                  <img
                    src="/images/banana-power.png"
                    alt="banana"
                    className="w-6 h-6 object-contain rotate-[-20deg]"
                    style={{ transform: "rotate(-20deg)" }}
                  />
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-red-300">
                <span className="font-display uppercase text-[9px] text-red-400 font-semibold">
                  {v3Locales.matchCard.redTeam}:
                </span>
                <span className="font-semibold text-[11px] inline-flex items-center gap-1">
                  <span>{match.redTotalPower}</span>
                  <img
                    src="/images/banana-power.png"
                    alt="banana"
                    className="w-6 h-6 object-contain rotate-[-20deg]"
                    style={{ transform: "rotate(-20deg)" }}
                  />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
              <span>{v3Locales.matchResults.powerDiffLabel}:</span>
              <span className="font-bold text-gold-bright inline-flex items-center gap-1">
                <span>{match.powerDiff}</span>
                <img
                  src="/images/banana-power.png"
                  alt="banana"
                  className="w-5 h-5 object-contain rotate-[-20deg]"
                  style={{ transform: "rotate(-20deg)" }}
                />
              </span>
            </div>
          </div>
        )}

        {/* 5 Lanes Detail Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[10px] font-display uppercase tracking-wider font-bold text-muted-foreground px-2 py-1">
            <div className="w-[42%] text-left text-blue-400">{v3Locales.matchCard.blueTeam}</div>
            <div className="w-[16%] text-center text-gold-bright shrink-0">
              {v3Locales.matchCard.lane}
            </div>
            <div className="w-[42%] text-right text-red-400">{v3Locales.matchCard.redTeam}</div>
          </div>

          {match.lanes.map((lane) => {
            const meta = ROLE_META[lane.role];
            return (
              <div
                key={lane.role}
                className="flex items-center justify-between gap-2 p-3 rounded bg-background/60 border border-gold/15 hover:border-gold/30 transition-colors"
              >
                {/* Blue Player + Champion */}
                <div className="w-[42%] min-w-0 text-left">
                  {lane.bluePlayer ? (
                    <div className="flex items-center gap-3">
                      {lane.bluePlayer.champion ? (
                        <img
                          src={lane.bluePlayer.champion.squareUrl}
                          alt={lane.bluePlayer.champion.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded border-2 border-blue-500/60 object-cover shrink-0 shadow-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-blue-950/50 border-2 border-blue-500/30 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-medium text-sm sm:text-base truncate text-blue-200">
                          {lane.bluePlayer.name}
                        </div>
                        <div className="text-xs sm:text-sm text-blue-300/90 truncate font-serif italic">
                          {lane.bluePlayer.champion?.name || "---"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">---</span>
                  )}
                </div>

                {/* Lane Icon Only */}
                <div className="w-[16%] text-center flex items-center justify-center shrink-0">
                  <div className="p-1.5 sm:p-2 rounded-full bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-colors">
                    <img
                      src={meta.iconUrl}
                      alt={meta.label}
                      title={meta.label}
                      className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0"
                    />
                  </div>
                </div>

                {/* Red Player + Champion */}
                <div className="w-[42%] min-w-0 text-right">
                  {lane.redPlayer ? (
                    <div className="flex items-center justify-end gap-3">
                      <div className="min-w-0 flex-1 text-right">
                        <div className="font-display font-medium text-sm sm:text-base truncate text-red-200">
                          {lane.redPlayer.name}
                        </div>
                        <div className="text-xs sm:text-sm text-red-300/90 truncate font-serif italic">
                          {lane.redPlayer.champion?.name || "---"}
                        </div>
                      </div>
                      {lane.redPlayer.champion ? (
                        <img
                          src={lane.redPlayer.champion.squareUrl}
                          alt={lane.redPlayer.champion.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded border-2 border-red-500/60 object-cover shrink-0 shadow-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-red-950/50 border-2 border-red-500/30 shrink-0" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">---</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Single Match Confirmation Dialog */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => !open && setIsDeleteConfirmOpen(false)}
      >
        <AlertDialogContent className="border-red-500/30 bg-card/95 backdrop-blur-lg hextech-frame max-w-md w-full overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-wide text-red-400 text-base">
              {v3Locales.matchCard.deleteConfirmTitle} #{matchNumber}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed">
              {v3Locales.dialogs.clearDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center gap-2 justify-end">
            <AlertDialogCancel
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="text-xs btn-hex"
            >
              {v3Locales.dialogs.cancelButton}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                onDelete(match.id);
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {v3Locales.matchCard.deleteMatch}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
