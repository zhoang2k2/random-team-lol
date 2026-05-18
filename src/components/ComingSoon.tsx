import { Link } from "@tanstack/react-router";
import { InternalNav } from "./InternalNav";

export function ComingSoon({
  h1,
  intro,
  currentPath,
  extraContent,
}: {
  h1: string;
  intro: string;
  currentPath: string;
  extraContent?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <article>
        <h1 className="font-display text-3xl uppercase tracking-[0.2em] text-gold-bright sm:text-4xl">
          {h1}
        </h1>
        <div className="gold-divider my-6 w-32" />
        <p className="text-base leading-relaxed text-muted-foreground">{intro}</p>

        <div className="my-10 rounded-lg border border-gold-bright/30 bg-card/50 p-8 text-center">
          <div className="font-display text-2xl uppercase tracking-[0.25em] text-gold-bright">
            Waiting for next update
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Tính năng này đang được phát triển. Trong khi chờ, bạn có thể dùng{" "}
            <Link to="/" className="text-gold-bright underline">
              tool random team chính
            </Link>
            .
          </p>
        </div>

        {extraContent}
      </article>

      <InternalNav currentPath={currentPath} />
    </main>
  );
}
