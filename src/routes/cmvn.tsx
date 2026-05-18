import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/cmvn")({
  head: () =>
    buildSeoMeta({
      title: "CMVN / CMDN — Classmethod Vietnam Gaming Community | Nghiện LOL",
      description:
        "Trang cộng đồng CMVN / CMDN — Classmethod Vietnam / Đà Nẵng. CLB nghiện game số 1 Đà Nẵng, tổ chức custom Liên Minh Huyền Thoại nội bộ.",
      path: "/cmvn",
    }),
  component: Cmvn,
});

function Cmvn() {
  return (
    <ComingSoon
      currentPath="/cmvn"
      h1="CMVN / CMDN — Classmethod Vietnam Gaming"
      intro="Trang dành riêng cho cộng đồng CMVN (Classmethod Vietnam) và CMDN (Classmethod Đà Nẵng) — CLB nghiện game tổ chức các trận custom Liên Minh Huyền Thoại nội bộ."
    />
  );
}
