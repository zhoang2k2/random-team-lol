import { Link } from "@tanstack/react-router";

type NavItem = { to: string; label: string; desc: string };

const ITEMS: NavItem[] = [
  { to: "/", label: "Random Team", desc: "Chia team LMHT chính" },
  { to: "/aram-random", label: "ARAM Random", desc: "Random tướng cho ARAM" },
  { to: "/custom-game-random", label: "Custom Game", desc: "Random custom 5v5" },
  { to: "/random-lane", label: "Random Lane", desc: "Random vị trí Top/Mid/ADC" },
  { to: "/chia-team-lien-minh", label: "Chia Team LMHT", desc: "Phiên bản tiếng Việt" },
  { to: "/huong-dan", label: "Hướng dẫn", desc: "Cách dùng tool" },
  { to: "/faq", label: "FAQ", desc: "Câu hỏi thường gặp" },
  { to: "/cmvn", label: "CMVN / CMDN", desc: "Cộng đồng Classmethod" },
];

export function InternalNav({ currentPath }: { currentPath?: string }) {
  const items = ITEMS.filter((i) => i.to !== currentPath);
  return (
    <nav
      aria-label="Tools liên quan"
      className="mt-16 rounded-lg border border-gold-bright/20 bg-card/40 p-6 hidden"
      style={{ display: "none" }}
    >
      <h2 className="mb-4 font-display text-xl uppercase tracking-[0.2em] text-gold-bright">
        Tools liên quan
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <li key={i.to}>
            <Link
              to={i.to}
              className="block rounded-md border border-border/50 bg-background/40 p-3 transition hover:border-gold-bright/60 hover:bg-background/70"
            >
              <div className="font-semibold text-foreground">{i.label}</div>
              <div className="text-xs text-muted-foreground">{i.desc}</div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
