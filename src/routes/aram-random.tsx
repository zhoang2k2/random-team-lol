import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/aram-random")({
  head: () =>
    buildSeoMeta({
      title: "ARAM Random Team — Random Tướng ARAM LMHT | Nghiện LOL",
      description:
        "Tool random ARAM Liên Minh Huyền Thoại: chia team Howling Abyss, random tướng hoàn toàn ngẫu nhiên, không cần chọn lane. Miễn phí, không cần đăng nhập.",
      path: "/aram-random",
    }),
  component: AramRandom,
});

function AramRandom() {
  return (
    <ComingSoon
      currentPath="/aram-random"
      h1="ARAM Random Team — Random Tướng ARAM Liên Minh"
      intro="Trang dành riêng cho chế độ ARAM (All Random All Mid) của Liên Minh Huyền Thoại. Tự động random tướng Howling Abyss cho hai team, không cần chọn lane, đúng tinh thần đập đá."
    />
  );
}
