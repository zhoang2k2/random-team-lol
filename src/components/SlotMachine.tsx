import { useEffect, useRef, useState } from "react";

type Props<T> = {
  items: T[];
  finalItem: T;
  spinDurationMs: number;
  renderItem: (item: T) => React.ReactNode;
  itemHeight?: number;
  onDone?: () => void;
};

/**
 * Vertical slot machine: rolls through `items` and stops on `finalItem`.
 */
export function SlotMachine<T>({
  items,
  finalItem,
  spinDurationMs,
  renderItem,
  itemHeight = 64,
  onDone,
}: Props<T>) {
  const [translateY, setTranslateY] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const reel = useRef<T[]>([]);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    // build a long reel ending with finalItem
    const repeats = 18;
    const base: T[] = [];
    for (let i = 0; i < repeats; i++) {
      for (const it of items) base.push(it);
    }
    base.push(finalItem);
    reel.current = base;

    // start at 0, then transition to last item
    setTranslateY(0);
    setTransitioning(false);
    const startTimer = setTimeout(() => {
      setTransitioning(true);
      setTranslateY((reel.current.length - 1) * itemHeight);
    }, 30);

    const doneTimer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    }, spinDurationMs + 60);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalItem]);

  return (
    <div className="relative overflow-hidden hextech-frame" style={{ height: itemHeight }}>
      <div
        className="absolute left-0 right-0"
        style={{
          transform: `translateY(-${translateY}px)`,
          transition: transitioning
            ? `transform ${spinDurationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`
            : "none",
        }}
      >
        {reel.current.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center"
            style={{ height: itemHeight }}
          >
            {renderItem(it)}
          </div>
        ))}
      </div>
      {/* top/bottom shaders */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-background/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-background/90 to-transparent" />
    </div>
  );
}
