import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    buildSeoMeta({
      title: "FAQ — Câu Hỏi Thường Gặp Random Team LOL | Nghiện LOL",
      description:
        "Câu hỏi thường gặp về tool random team Liên Minh Huyền Thoại: cách dùng, ARAM, custom game, bảo mật dữ liệu, các tính năng nâng cao.",
      path: "/faq",
    }),
  component: Faq,
});

function Faq() {
  return (
    <ComingSoon
      currentPath="/faq"
      h1="FAQ — Câu Hỏi Thường Gặp Về Random Team LOL"
      intro="Tổng hợp các câu hỏi thường gặp về tool chia team Liên Minh Huyền Thoại: bảo mật, ARAM, custom game, tính năng sự kiện ngẫu nhiên..."
    />
  );
}
