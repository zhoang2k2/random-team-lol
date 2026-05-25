// Catalogue of in-game "Ông trời kêu vậy" events.
// `time` = minute mark in the match (null = no fixed time, e.g. triggered by Baron / item build).

export type GameEvent = {
  id: string;
  name: string; // short display name shown during the roll
  time: number | null; // minute mark; null = no specific time
  content: string; // full description
};

export const EVENTS: GameEvent[] = [
  {
    id: "naked-3min",
    name: "Khoả thân trong vòng 3 phút",
    time: 0,
    content: "Vào trận không được mua đồ cho đến phút thứ 3.",
  },
  {
    id: "cut-limbs",
    name: "Cụt tay cụt chân",
    time: 0,
    content: "Đốt toàn bộ phép bổ trợ ngay khi vào trận, càng sớm càng tốt.",
  },
  {
    id: "best-friend-jungle",
    name: "Best Friend with Jungle",
    time: 0,
    content: "Cả đội bám Jungle dọn sạch 2 cánh rừng trước khi về lane.",
  },
  {
    id: "support-tinder",
    name: "Support quẹt Tinder",
    time: 0,
    content: "Support chia tay ADC, đi roam tự do bất kỳ lane nào đến phút thứ 5.",
  },
  {
    id: "only-q",
    name: "Only Q trong vòng 3 phút",
    time: 5,
    content: "Trong 3 phút chỉ được dùng kỹ năng Q.",
  },
  {
    id: "only-w",
    name: "Only W trong vòng 3 phút",
    time: 5,
    content: "Trong 3 phút chỉ được dùng kỹ năng W.",
  },
  {
    id: "only-e",
    name: "Only E trong vòng 3 phút",
    time: 5,
    content: "Trong 3 phút chỉ được dùng kỹ năng E.",
  },
  {
    id: "make-aram",
    name: "Make it ARAM",
    time: 5,
    content: "Tất cả tụ tập Mid lane đến phút 10, sau đó trở về lane gốc.",
  },
  {
    id: "fragile-peace",
    name: "Hoà bình mỏng manh",
    time: 7,
    content:
      "Trong 2 phút, cấm gây sát thương lên người chơi địch. Ai vi phạm phải chạy vào trụ địch tự sát.",
  },
  {
    id: "baron-deathmatch",
    name: "Tử chiến Baron",
    time: null,
    content:
      "Khi Baron xuất hiện: ngưng giao tranh, tập hợp đủ 10 người tại Baron rồi tử chiến đến người sống sót cuối cùng.",
  },
  {
    id: "redemption-first",
    name: "Vừa đấm vừa xoa",
    time: null,
    content:
      "Tất cả lên 'Dây chuyền Chuộc tội' làm món đầu tiên. Jungle & Support lên ở món thứ hai.",
  },
  {
    id: "poor-is-sin",
    name: "Nghèo chắc chắn là một cái tội",
    time: 0,
    content: "Summoner không có skin bắt buộc AFK trong vòng 2 phút.",
  },
  {
    id: "simplify",
    name: "Đơn giản hoá",
    time: 7,
    content: "Summoner không được sử dụng ultimate skill trong vòng 4 phút.",
  },
  {
    id: "dirty-feet",
    name: "Chân dơ vãi",
    time: null,
    content: "Summoner không được mua bất kì món giày/dép nào trong trận này.",
  },
  {
    id: "long-way-home",
    name: "Đường về nhà xa quá",
    time: 7,
    content:
      "Summoner truyền tống về bệ đá trong vòng 3 phút, chỉ cho phép hồi sinh hoặc đi bộ về.",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `n` distinct events. Events with a concrete time must not share a time
 * within the same selection; events with time=null are unconstrained.
 * Result is sorted ascending by time (null = last).
 */
export function pickEvents(n: number): GameEvent[] {
  const count = Math.max(0, Math.min(n, EVENTS.length));
  if (count === 0) return [];

  const pool = shuffle(EVENTS);
  const picked: GameEvent[] = [];
  const usedTimes = new Set<number>();

  for (const ev of pool) {
    if (picked.length >= count) break;
    if (ev.time === null) {
      picked.push(ev);
    } else if (!usedTimes.has(ev.time)) {
      usedTimes.add(ev.time);
      picked.push(ev);
    }
  }

  picked.sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time - b.time;
  });

  return picked;
}

export function formatEventTime(time: number | null): string {
  if (time === null) return "SPECIAL";
  const mm = String(time).padStart(2, "0");
  return `Phút ${mm}:00`;
}
