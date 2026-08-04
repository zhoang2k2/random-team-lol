import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { V2StoreProvider, useV2StoreContext } from "@/contexts/V2StoreContext";
import { V2Header } from "@/components/v2/V2Header";
import { SummonerList } from "@/components/v2/SummonerList";
import { TextInput } from "@/components/v2/TextInput";
import { PrimaryButton } from "@/components/v2/PrimaryButton";

const V2LandingPageWrapper = () => (
  <V2StoreProvider>
    <V2LandingPage />
  </V2StoreProvider>
);

export const Route = createFileRoute("/v2")({
  component: V2LandingPageWrapper,
});

const V2LandingPage = () => {
  const navigate = useNavigate();
  const { summoners, addSummoner, removeSummoner, canComplete, isAtMax } = useV2StoreContext();
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isAtMax) return;
    addSummoner(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleComplete = () => {
    if (!canComplete) return;
    navigate({ to: "/v2/random" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <V2Header currentPath="/v2" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <section className="w-full max-w-md space-y-8" aria-labelledby="landing-heading">
          {/* Hero text */}
          <div className="text-center space-y-3">
            <h2
              id="landing-heading"
              className="font-display text-3xl md:text-4xl font-bold uppercase tracking-[0.15em] text-gold-bright text-glow-gold"
            >
              Xóm Nghẹo Chào Bạn
            </h2>
            <p className="font-serif text-sm italic text-muted-foreground">
              Vĩ nhân nào không có 1 quá khứ, Kẻ nghiện nào chẳng còn 1 tương lai
            </p>
          </div>

          {/* Add summoner form */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleAdd();
            }}
            className="space-y-3"
            aria-label="Thêm summoner"
          >
            <div className="flex gap-2">
              <TextInput
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Điền tên con nghiện..."
                disabled={isAtMax}
                maxLength={32}
                aria-label="Tên summoner"
              />
              <PrimaryButton
                onClick={handleAdd}
                disabled={isAtMax || !inputValue.trim()}
                variant="primary"
                className="shrink-0"
              >
                Add
              </PrimaryButton>
            </div>

            {isAtMax && (
              <p className="text-xs text-muted-foreground italic text-center">
                Đã đạt tối đa 10 summoner.
              </p>
            )}
          </form>

          {/* Summoner list — always 10 slots */}
          <div
            className="hextech-frame p-3"
            role="list"
            aria-label="Danh sách summoner"
          >
            <SummonerList
              summoners={summoners}
              onRemove={removeSummoner}
            />
          </div>

          {/* Complete button */}
          <PrimaryButton
            onClick={handleComplete}
            disabled={!canComplete}
            variant="primary"
            className="w-full py-3 text-base"
          >
            Complete — Bắt đầu
          </PrimaryButton>
        </section>
      </main>
    </div>
  );
};
