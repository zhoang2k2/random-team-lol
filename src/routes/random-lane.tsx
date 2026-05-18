import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/random-lane")({
  head: () =>
    buildSeoMeta({
      title: "Random Lane LOL — Random Vị Trí Top/Mid/ADC/Support | Nghiện LOL",
      description:
        "Random lane Liên Minh Huyền Thoại: gán ngẫu nhiên vị trí Top, Jungle, Mid, ADC, Support cho từng summoner trong team custom. Miễn phí, nhanh, công bằng.",
      path: "/random-lane",
    }),
  component: RandomLane,
});

function RandomLane() {
  return (
    <ComingSoon
      currentPath="/random-lane"
      h1="Random Lane LOL — Random Vị Trí Liên Minh Huyền Thoại"
      intro="Tool random lane LMHT: gán Top, Jungle, Mid, ADC, Support ngẫu nhiên cho từng người chơi. Hữu ích khi cả team không chịu nhường lane chính."
    />
  );
}
