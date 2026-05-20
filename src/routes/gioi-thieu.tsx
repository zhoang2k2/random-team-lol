import { createFileRoute } from "@tanstack/react-router";
import { InternalNav } from "@/components/InternalNav";

export const Route = createFileRoute("/gioi-thieu")({
  component: GioiThieuRoute,
});

const HOME_FAQ = [
  {
    q: "Công cụ này có an toàn cho tài khoản Riot không?",
    a: "Có. Tool hoạt động hoàn toàn trên trình duyệt, không yêu cầu đăng nhập tài khoản Riot Games.",
  },
  {
    q: "Hỗ trợ tối đa bao nhiêu người?",
    a: "Tối đa 10 summoner cho một lượt random, đủ cho custom game 5v5.",
  },
  {
    q: "Thuật toán random hoạt động thế nào?",
    a: "Sử dụng Fisher-Yates Shuffle để đảm bảo tính ngẫu nhiên và công bằng tuyệt đối.",
  },
];

function GioiThieuRoute() {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <p className="font-display text-xs uppercase tracking-[0.5em] text-gold">
            Giới thiệu
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.2em] text-gold-bright text-glow-gold md:text-5xl">
            Về Random Team LOL
          </h1>
          <div className="gold-divider mx-auto mt-3 max-w-md" />
        </header>

        <section className="mx-auto mt-12 max-w-3xl space-y-8 px-2 text-sm leading-relaxed text-muted-foreground">
          <header>
            <h1 className="font-display text-3xl uppercase tracking-[0.2em] text-gold-bright sm:text-4xl">
              Random Team LOL — Chia Team Liên Minh Huyền Thoại Online
            </h1>
            <div className="gold-divider my-4 w-32" />
            <p>
              <strong className="text-foreground">Random Team LOL</strong> là công cụ miễn phí giúp
              bạn chia team Liên Minh Huyền Thoại cho các trận custom game, ARAM hoặc đấu nội bộ
              giữa bạn bè. Chỉ cần nhập tên các summoner, tool sẽ tự động random thành hai đội
              Alpha và Beta, gán lane (Top, Jungle, Mid, ADC, Support) và tướng ngẫu nhiên từ pool
              160+ champion của Liên Minh Huyền Thoại.
            </p>
          </header>

          <div>
            <h2 className="font-display text-xl uppercase tracking-[0.18em] text-gold-bright">
              Tính năng chính
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>
                <strong>Random chia team cân bằng</strong> — hỗ trợ 2v2, 3v3, 4v4, 5v5.
              </li>
              <li>
                <strong>Random lane LOL</strong> — gán vị trí ngẫu nhiên cho từng người.
              </li>
              <li>
                <strong>Random tướng (champion)</strong> — chọn champion ngẫu nhiên từ data chính
                thức Riot Data Dragon.
              </li>
              <li>
                <strong>ARAM mode</strong> — bỏ random lane để random tướng kiểu Howling Abyss.
              </li>
              <li>
                <strong>Exclusion pairs</strong> — tránh ghép hai người không hợp vào cùng team.
              </li>
              <li>
                <strong>Special events</strong> — sự kiện ngẫu nhiên trong trận (ARAM mode, Only Q,
                Khoả thân, Tử chiến Baron...) để tăng độ vui.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase tracking-[0.18em] text-gold-bright">
              Dùng khi nào?
            </h2>
            <h3 className="mt-3 font-semibold text-foreground">Custom game LMHT với bạn bè</h3>
            <p>
              Khi tổ chức custom 5v5, 4v4 hoặc 3v3 mà không biết chia team sao cho công bằng,
              Random Team LOL giúp loại bỏ tranh cãi — máy random, không ai cãi được.
            </p>
            <h3 className="mt-3 font-semibold text-foreground">Đấu nội bộ ARAM</h3>
            <p>
              Bật ARAM mode để tool random tướng ngẫu nhiên cho mọi người chơi — đúng tinh thần
              Howling Abyss.
            </p>
            <h3 className="mt-3 font-semibold text-foreground">
              Giải đấu nội bộ công ty (CMVN, CMDN, Classmethod)
            </h3>
            <p>
              Dùng cho các sự kiện gaming nội bộ, team building, giải đấu công ty — fair play,
              minh bạch.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase tracking-[0.18em] text-gold-bright">
              Câu hỏi thường gặp
            </h2>
            <dl className="mt-3 space-y-4">
              {HOME_FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <InternalNav currentPath="/gioi-thieu" />
        
        <footer className="mt-16 text-center text-xs text-muted-foreground">
          <p>
            Champions, roles & artwork via{" "}
            <a
              href="https://developer.riotgames.com/docs/lol#data-dragon"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-gold-bright"
            >
              Riot Data Dragon
            </a>
            . Not endorsed by Riot Games.
          </p>
        </footer>
      </div>
    </div>
  );
}
