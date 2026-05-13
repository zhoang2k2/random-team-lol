import { useEffect, useRef, useState } from "react";
import type { Champion } from "@/lib/lol-api";

type Props = {
  pool: Champion[];
  finalChampion: Champion;
  durationMs: number;
  onDone?: () => void;
};

const ITEM_W = 96;
const ITEM_GAP = 8;
const STEP = ITEM_W + ITEM_GAP;

/**
 * CSGO/CS2-style horizontal champion roll: slow → fast → slow,
 * landing centered on `finalChampion`.
 */
export function ChampionStrip({ pool, finalChampion, durationMs, onDone }: Props) {
  const [reel, setReel] = useState<Champion[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;

    // Build a long reel of random champions; place `finalChampion` near the end.
    const reelLen = 80;
    const built: Champion[] = [];
    for (let i = 0; i < reelLen; i++) {
      built.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    const finalIndex = reelLen - 6;
    built[finalIndex] = finalChampion;
    setReel(built);

    setTranslateX(0);
    setTransitioning(false);

    const startTimer = setTimeout(() => {
      const containerW = containerRef.current?.clientWidth ?? 600;
      // position so final item sits centered, with a tiny offset for realism
      const jitter = (Math.random() - 0.5) * (ITEM_W * 0.6);
      const target =
        finalIndex * STEP - containerW / 2 + ITEM_W / 2 + jitter;
      setTransitioning(true);
      setTranslateX(target);
    }, 30);

    const doneTimer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        // snap to centered exact position
        const containerW = containerRef.current?.clientWidth ?? 600;
        setTransitioning(false);
        setTranslateX(finalIndex * STEP - containerW / 2 + ITEM_W / 2);
        onDone?.();
      }
    }, durationMs + 80);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalChampion]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden hextech-frame csgo-strip-mask"
      style={{ height: ITEM_W + 16 }}
    >
      {/* center marker */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-20"
        style={{ width: 2, transform: "translateX(-1px)" }}
      >
        <div className="h-full w-full bg-gold animate-pulse-glow" />
        <div
          className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gold"
          style={{ boxShadow: "0 0 8px var(--gold-bright)" }}
        />
        <div
          className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gold"
          style={{ boxShadow: "0 0 8px var(--gold-bright)" }}
        />
      </div>

      <div
        className="absolute top-1/2 -translate-y-1/2 flex"
        style={{
          gap: ITEM_GAP,
          transform: `translate(-${translateX}px, -50%)`,
          transition: transitioning
            ? `transform ${durationMs}ms cubic-bezier(0.08, 0.85, 0.16, 1)`
            : "none",
        }}
      >
        {reel.map((c, i) => (
          <div
            key={i}
            className="shrink-0 overflow-hidden border border-gold/40"
            style={{ width: ITEM_W, height: ITEM_W }}
          >
            <img
              src={c.squareUrl}
              alt={c.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
