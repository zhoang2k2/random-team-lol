import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/chia-team-lien-minh")({
  head: () =>
    buildSeoMeta({
      title: "Chia Team Liên Minh Huyền Thoại — Random Đội Hình LMHT | Nghiện LOL",
      description:
        "Chia team Liên Minh Huyền Thoại online: random đội hình, chia 2 team Alpha/Beta cân bằng, gán lane và tướng. Phiên bản tiếng Việt cho cộng đồng LMHT Việt Nam.",
      path: "/chia-team-lien-minh",
    }),
  component: ChiaTeam,
});

function ChiaTeam() {
  return (
    <ComingSoon
      currentPath="/chia-team-lien-minh"
      h1="Chia Team Liên Minh Huyền Thoại — Random Đội Hình LMHT"
      intro="Trang tiếng Việt cho công cụ chia team Liên Minh Huyền Thoại. Random đội hình cho custom game, ARAM, đấu nội bộ — không cần cãi nhau chia team."
    />
  );
}
