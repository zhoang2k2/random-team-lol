import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/huong-dan")({
  head: () =>
    buildSeoMeta({
      title: "Hướng Dẫn Random Team LOL — Cách Chia Team LMHT Công Bằng | Nghiện LOL",
      description:
        "Hướng dẫn sử dụng tool random team Liên Minh Huyền Thoại: cách chia team công bằng, random lane, random tướng cho custom game và ARAM. Mẹo tổ chức đấu nội bộ.",
      path: "/huong-dan",
    }),
  component: HuongDan,
});

function HuongDan() {
  return (
    <ComingSoon
      currentPath="/huong-dan"
      h1="Hướng Dẫn Random Team LOL — Cách Chia Team LMHT"
      intro="Hướng dẫn chi tiết cách dùng tool random team Liên Minh Huyền Thoại: từ nhập summoner, chọn kích thước team, bật/tắt random lane, đến tổ chức custom game và ARAM nội bộ."
    />
  );
}
