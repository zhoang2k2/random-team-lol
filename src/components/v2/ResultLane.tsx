import { ROLE_META, type Role } from "@/lib/lol-api";
import { cn } from "@/lib/utils";

export type LaneResult = {
  role: Role;
  alphaName: string | null;
  betaName: string | null;
};

type ResultLaneProps = {
  lane: LaneResult;
};

const TeamCell = ({
  name,
  side,
}: {
  name: string | null;
  side: "alpha" | "beta";
}) => {
  const color = side === "alpha" ? "var(--team-alpha)" : "var(--team-beta)";
  const label = side === "alpha" ? "Alpha" : "Beta";

  if (!name) {
    return (
      <td className="px-3 py-2 text-muted-foreground italic text-xs">—</td>
    );
  }

  return (
    <td className="px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="font-display text-xs uppercase tracking-[0.15em] font-bold shrink-0"
          style={{
            color,
            textShadow: `0 0 8px ${color}`,
          }}
          aria-label={`Team ${label}`}
        >
          {label[0]}
        </span>
        <span className="text-sm text-foreground truncate">{name}</span>
      </div>
    </td>
  );
};

export const ResultLane = ({ lane }: ResultLaneProps) => {
  const meta = ROLE_META[lane.role];

  return (
    <tr
      className={cn(
        "border-b border-gold/20 last:border-b-0 align-middle animate-fade-in",
      )}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <img
            src={meta.iconUrl}
            alt={meta.label}
            className="h-5 w-5"
            style={{ filter: "drop-shadow(0 0 3px var(--gold))" }}
          />
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-gold-bright">
            {meta.label}
          </span>
        </div>
      </td>
      <TeamCell name={lane.alphaName} side="alpha" />
      <TeamCell name={lane.betaName} side="beta" />
    </tr>
  );
};
