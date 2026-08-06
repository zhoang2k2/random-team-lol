import { useState } from "react";

import { ROLE_META } from "@/lib/lol-api";
import { cn } from "@/lib/utils";
import type { ShuffleRound } from "@/hooks/useShuffleEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

// Re-export so consumers that imported LaneResult from here still work
export type { ShuffleRound };

// ── TeamHeading ───────────────────────────────────────────────────────────────

const TeamHeading = ({ side }: { side: "alpha" | "beta" }) => {
  const isAlpha = side === "alpha";
  const color = isAlpha ? "var(--team-alpha)" : "var(--team-beta)";
  const label = isAlpha ? "Team Alpha" : "Team Beta";
  return (
    <span
      className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.25em]"
      style={{ color, textShadow: `0 0 8px ${color}` }}
    >
      {isAlpha ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14.5 17.5 21 21l-1-4-3.5-3.5" /><path d="m3 3 7.5 7.5" />
          <path d="M9.5 17.5 3 21l1-4 3.5-3.5" /><path d="m21 3-7.5 7.5" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )}
      {label}
    </span>
  );
};

// ── TeamCell ──────────────────────────────────────────────────────────────────

const TeamCell = ({
  name,
  champName,
  champTitle,
  champSquareUrl,
  color,
}: {
  name: string | null;
  champName?: string | null;
  champTitle?: string | null;
  champSquareUrl?: string | null;
  color: string;
}) => {
  if (!name) {
    return <td className="px-3 py-3 text-muted-foreground italic">—</td>;
  }
  return (
    <td className="px-3 py-3">
      <div className="flex items-center gap-3">
        {champSquareUrl && (
          <div className="h-12 w-12 shrink-0 overflow-hidden border border-gold/50">
            <img src={champSquareUrl} alt={champName ?? ""} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <div
            className="font-display text-sm tracking-wide truncate"
            style={{ color, textShadow: `0 0 8px ${color}` }}
          >
            {name}
          </div>
          {champName && (
            <div className="text-xs text-gold-bright truncate">{champName}</div>
          )}
          {champTitle && (
            <div className="text-[10px] italic text-muted-foreground truncate">{champTitle}</div>
          )}
        </div>
      </div>
    </td>
  );
};

// ── ConfirmDialog (inline, lightweight) ───────────────────────────────────────

const ConfirmDeleteDialog = ({
  open,
  roundNumber,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  roundNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="hextech-frame p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg text-gold-bright uppercase tracking-widest">Delete Round?</h3>
        <p className="font-serif text-sm text-muted-foreground">
          Round {roundNumber} will be permanently removed.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-hex text-xs px-3 py-1.5 cursor-pointer" onClick={onCancel}>
            Keep
          </button>
          <button type="button" className="btn-hex btn-hex-danger text-xs px-3 py-1.5 cursor-pointer" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ── RoundView ─────────────────────────────────────────────────────────────────

const RoundView = ({
  round,
  roundNumber,
  onDelete,
  disabled,
}: {
  round: ShuffleRound;
  roundNumber: number;
  onDelete?: () => void;
  disabled?: boolean;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const visibleLanes = round.lanes.slice(0, round.revealed);

  return (
    <div className="hextech-frame p-5">
      {/* Round header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.4em] text-gold">
          Round {roundNumber}
        </h3>
        {onDelete && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 cursor-pointer"
            aria-label={`Delete round ${roundNumber}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        )}
      </div>

      <div className="gold-divider my-4" />

      {visibleLanes.length === 0 ? (
        <div className="py-6 text-center text-xs italic uppercase tracking-[0.3em] text-muted-foreground">
          Awaiting first lane reveal…
        </div>
      ) : (
        <div className="overflow-hidden border border-gold/40">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gold/10 text-xs uppercase tracking-[0.25em] text-gold">
                <th className="border-b border-gold/40 px-3 py-2 text-left">Lane</th>
                <th className="border-b border-gold/40 px-3 py-2 text-left">
                  <TeamHeading side="alpha" />
                </th>
                <th className="border-b border-gold/40 px-3 py-2 text-left">
                  <TeamHeading side="beta" />
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleLanes.map((lane, index) => (
                <tr
                  key={`${round.id}-${index}`}
                  className="animate-fade-in border-b border-gold/20 last:border-b-0 align-middle"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={ROLE_META[lane.role].iconUrl}
                        alt={lane.role}
                        className="h-6 w-6"
                        style={{ filter: "drop-shadow(0 0 4px var(--gold))" }}
                      />
                      <span className="font-display text-xs uppercase tracking-[0.2em] text-gold-bright">
                        {ROLE_META[lane.role].label}
                      </span>
                    </div>
                  </td>
                  <TeamCell
                    name={lane.alphaName}
                    champName={lane.alphaChamp?.name}
                    champTitle={lane.alphaChamp?.title}
                    champSquareUrl={lane.alphaChamp?.squareUrl}
                    color="var(--team-alpha)"
                  />
                  <TeamCell
                    name={lane.betaName}
                    champName={lane.betaChamp?.name}
                    champTitle={lane.betaChamp?.title}
                    champSquareUrl={lane.betaChamp?.squareUrl}
                    color="var(--team-beta)"
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {round.revealed < round.lanes.length && (
        <div className="mt-3 text-center text-xs italic uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Drafting lane {round.revealed + 1} of {round.lanes.length}…
        </div>
      )}

      <ConfirmDeleteDialog
        open={confirmOpen}
        roundNumber={roundNumber}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete?.();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

// ── ResultList ────────────────────────────────────────────────────────────────

type ResultListProps = {
  rounds: ShuffleRound[];
  onDeleteRound?: (roundId: number) => void;
  disabled?: boolean;
};

export const ResultList = ({ rounds, onDeleteRound, disabled }: ResultListProps) => {
  if (rounds.length === 0) {
    return (
      <div className="hextech-frame flex min-h-[200px] flex-col items-center justify-center p-10 text-center">
        <div className="font-display text-2xl uppercase tracking-[0.3em] text-gold-bright text-glow-gold">
          Awaiting the draft
        </div>
        <div className="gold-divider my-4 w-24" />
        <p className="max-w-xs text-sm italic text-muted-foreground">
          Bấm <span className="text-gold-bright">Shuffle</span> để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map((round, index) => (
        <RoundView
          key={round.id}
          round={round}
          roundNumber={index + 1}
          onDelete={onDeleteRound ? () => onDeleteRound(round.id) : undefined}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
