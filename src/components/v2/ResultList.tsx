import { ResultLane, type LaneResult } from "@/components/v2/ResultLane";

type ResultListProps = {
  lanes: LaneResult[];
};

export const ResultList = ({ lanes }: ResultListProps) => {
  if (lanes.length === 0) {
    return (
      <div className="hextech-frame flex min-h-[300px] flex-col items-center justify-center p-10 text-center">
        <div className="font-display text-2xl uppercase tracking-[0.3em] text-gold-bright text-glow-gold">
          Awaiting the draft
        </div>
        <div className="gold-divider my-4 w-24" />
        <p className="max-w-xs text-sm italic text-muted-foreground">
          Chỉnh settings bên trái rồi bấm{" "}
          <span className="text-gold-bright">Shuffle</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="hextech-frame overflow-hidden">
      <table className="w-full border-collapse text-sm" aria-label="Kết quả chia team">
        <thead>
          <tr className="bg-gold/10 text-[10px] uppercase tracking-[0.25em] text-gold">
            <th className="border-b border-gold/40 px-3 py-2 text-left">Lane</th>
            <th className="border-b border-gold/40 px-3 py-2 text-left">
              <span style={{ color: "var(--team-alpha)", textShadow: "0 0 8px var(--team-alpha)" }}>
                Team Alpha
              </span>
            </th>
            <th className="border-b border-gold/40 px-3 py-2 text-left">
              <span style={{ color: "var(--team-beta)", textShadow: "0 0 8px var(--team-beta)" }}>
                Team Beta
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lanes.map((lane, index) => (
            <ResultLane key={`${lane.role}-${index}`} lane={lane} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
