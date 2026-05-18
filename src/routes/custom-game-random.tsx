import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/custom-game-random")({
  head: () =>
    buildSeoMeta({
      title: "Random Custom Game LOL — Chia Team Custom LMHT | Nghiện LOL",
      description:
        "Random custom game Liên Minh Huyền Thoại: chia 5v5 cân bằng, gán lane, random tướng cho phòng custom. Công cụ miễn phí dành cho đấu nội bộ, friend party, giải nội bộ công ty.",
      path: "/custom-game-random",
    }),
  component: CustomGame,
});

function CustomGame() {
  return (
    <ComingSoon
      currentPath="/custom-game-random"
      h1="Random Custom Game LOL — Chia Team Custom LMHT"
      intro="Trang chuyên cho phòng custom Liên Minh Huyền Thoại: chia 10 người thành 2 team 5v5, random vị trí và tướng. Dành cho đấu nội bộ, giải công ty, friend party."
    />
  );
}
