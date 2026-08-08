import { useRef, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { useV2StoreContext } from "@/contexts/V2StoreContext";
import { useShuffleEngine } from "@/hooks/useShuffleEngine";
import { captureElements } from "@/lib/capture";
import { cn } from "@/lib/utils";

import { V2Header } from "@/components/v2/V2Header";
import { SummonerList } from "@/components/v2/SummonerList";
import { DefaultRolePicker } from "@/components/DefaultRolePicker";
import { PrimaryButton } from "@/components/v2/PrimaryButton";
import { ToggleRow } from "@/components/ToggleRow";
import { NeverSameTeam } from "@/components/v2/NeverSameTeam";
import { TextInput } from "@/components/v2/TextInput";
import { LaneRow } from "@/components/LaneRow";
import { ResultList } from "@/components/v2/ResultList";
import {
  ScreenshotPreviewDialog,
} from "@/components/ScreenshotDialogs";

// ── Icons ─────────────────────────────────────────────────────────────────────

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("transition-transform duration-300", open ? "rotate-180" : "")}
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CameraIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const V2RandomPage = () => {
  const {
    summoners,
    settings,
    members,
    removeSummoner,
    reorderSummoners,
    updatePower,
    updateSettings,
    renameSummoner,
    addSummoner,
    isAtMax,
  } = useV2StoreContext();

  const engine = useShuffleEngine({
    members,
    randomMembers: settings.evaluatePower ? true : settings.shuffleTeam,
    exclusions: settings.exclusion ? [settings.exclusion] : [],
    defaultRoles: settings.defaultRoles,
    skipAnimation: settings.skipAnimation,
    laneSeconds: settings.animationSeconds,
    evaluatePower: settings.evaluatePower,
    powerEntries: settings.evaluatePower
      ? summoners.map((s) => ({ name: s.name, power: s.power }))
      : undefined,
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isAtMax) return;
    addSummoner(trimmed);
    setInputValue("");
  };

  const handleScreenshot = async () => {
    if (!resultsRef.current) return;
    try {
      const dataUrl = await captureElements([resultsRef.current]);
      setScreenshotPreview(dataUrl);
    } catch (error) {
      console.error("Screenshot failed:", error);
    }
  };

  const handleSaveScreenshot = () => {
    if (!screenshotPreview) return;
    const link = document.createElement("a");
    link.href = screenshotPreview;
    const timestamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
    link.download = `xom-ngheo-${timestamp}.png`;
    link.click();
    setScreenshotPreview(null);
  };

  const draggable = !settings.shuffleTeam && !engine.shuffling;
  const hasResults = engine.rounds.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <V2Header currentPath="/v2/random" />

      <main className="flex-1 px-4 py-6 md:px-8 max-w-6xl mx-auto w-full space-y-6">

        {/* ── Section 1: General information (expandable) ── */}
        <section aria-label="General information">
          <button
            type="button"
            onClick={() => setGeneralOpen((prev) => !prev)}
            className="btn-hex w-full flex items-center justify-between px-4 py-2.5 cursor-pointer"
            aria-expanded={generalOpen}
            aria-controls="general-info-panel"
          >
            <span className="font-display text-xs uppercase tracking-[0.3em] text-gold-bright">
              General information
              {summoners.length > 0 && (
                <span className="ml-3 normal-case font-sans tracking-normal text-gold/60 text-[10px]">
                  {summoners.length}/10 summoners
                </span>
              )}
            </span>
            <ChevronIcon open={generalOpen} />
          </button>

          <div
            id="general-info-panel"
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              generalOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-x border-b border-gold/20 bg-background/10 p-4">

                {/* Left: summoner list */}
                <div className="hextech-frame p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-sm uppercase tracking-[0.3em] text-gold-bright">
                      Summoners
                      <span className="ml-2 text-gold/50 normal-case font-sans text-[10px]">
                        {summoners.length}/10
                      </span>
                    </h2>
                    <div className="flex items-center gap-2">
                      {engine.champsError && (
                        <span className="text-[10px] text-destructive italic">Champions failed</span>
                      )}
                      {engine.loadingChamps && (
                        <span className="text-[10px] text-muted-foreground italic animate-pulse">
                          Loading…
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="gold-divider" />

                  {/* Add summoner */}
                  <div className="flex gap-2">
                    <TextInput
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAdd();
                        }
                      }}
                      placeholder="Điền tên con nghiện..."
                      disabled={isAtMax || engine.shuffling}
                      maxLength={32}
                      className="h-9 text-xs"
                      aria-label="Tên summoner"
                    />
                    <PrimaryButton
                      onClick={handleAdd}
                      disabled={isAtMax || !inputValue.trim() || engine.shuffling}
                      variant="primary"
                      size="sm"
                      className="shrink-0"
                    >
                      Add
                    </PrimaryButton>
                  </div>

                  <SummonerList
                    summoners={summoners}
                    showPowerInput={settings.evaluatePower}
                    draggable={draggable}
                    onRemove={removeSummoner}
                    onReorder={reorderSummoners}
                    onPowerChange={updatePower}
                    onRename={renameSummoner}
                  />
                </div>

                {/* Right: Default role */}
                <div className="hextech-frame p-5">
                  <DefaultRolePicker
                    members={members}
                    teamSize={5}
                    value={settings.defaultRoles}
                    onChange={(defaultRoles) => updateSettings({ defaultRoles })}
                    disabled={engine.shuffling}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Advanced settings (expandable) ── */}
        <section aria-label="Advanced settings">
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="btn-hex w-full flex items-center justify-between px-4 py-2.5 cursor-pointer"
            aria-expanded={settingsOpen}
            aria-controls="advanced-settings-panel"
          >
            <span className="font-display text-xs uppercase tracking-[0.3em] text-gold-bright">
              Advanced settings
            </span>
            <ChevronIcon open={settingsOpen} />
          </button>

          {/* CSS grid row transition — no fixed padding outside overflow-hidden */}
          <div
            id="advanced-settings-panel"
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              settingsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-x border-b border-gold/20 bg-background/20">

                {/* Left: toggles + NeverSameTeam */}
                <div className="p-4 space-y-2 border-r border-gold/10">
                  <ToggleRow
                    label="Shuffle team"
                    hint={settings.evaluatePower ? "Bắt buộc khi Evaluate Power" : "Xáo trộn ngẫu nhiên"}
                    value={settings.evaluatePower ? true : settings.shuffleTeam}
                    onChange={(value) => updateSettings({ shuffleTeam: value })}
                    disabled={engine.shuffling || settings.evaluatePower}
                  />
                  <ToggleRow
                    label="Skip animation"
                    hint={
                      settings.skipAnimation
                        ? "Hiện kết quả ngay"
                        : `Delay ${settings.animationSeconds}s`
                    }
                    value={settings.skipAnimation}
                    onChange={(value) => {
                      updateSettings({
                        skipAnimation: value,
                        animationSeconds: value ? 0 : 2,
                      });
                    }}
                    disabled={engine.shuffling}
                  />
                  <ToggleRow
                    label="Evaluate Power"
                    hint="Chấm điểm summoner"
                    value={settings.evaluatePower}
                    onChange={(value) => {
                      updateSettings({
                        evaluatePower: value,
                        // force shuffleTeam on when evaluate power is enabled
                        ...(value ? { shuffleTeam: true } : {}),
                      });
                    }}
                    disabled={engine.shuffling}
                  />
                  <div className="pt-2">
                    <NeverSameTeam
                      members={members}
                      value={settings.exclusion}
                      onChange={(exclusion) => updateSettings({ exclusion })}
                      disabled={engine.shuffling}
                    />
                  </div>
                </div>

                {/* Right: power balance preview */}
                <div
                  className={cn(
                    "p-4 flex flex-col gap-3 min-h-[160px] transition-opacity duration-200",
                    settings.evaluatePower ? "opacity-100" : "opacity-25 pointer-events-none",
                  )}
                >
                  <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Power balance preview
                  </label>

                  {engine.balancedTeams && settings.evaluatePower ? (
                    <div className="space-y-3">
                      {/* Alpha team */}
                      <div className="space-y-1">
                        <div
                          className="font-display text-[10px] uppercase tracking-[0.25em]"
                          style={{ color: "var(--team-alpha)" }}
                        >
                          Team Alpha — {engine.balancedTeams.alphaTotalPower.toFixed(1)} pts
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {engine.balancedTeams.alpha.map((name) => {
                            const entry = summoners.find((s) => s.name === name);
                            return (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 text-[10px] border border-gold/20 bg-background/40 px-1.5 py-0.5 font-display"
                              >
                                {name}
                                <span className="text-gold/50">{entry?.power ?? 1}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Beta team */}
                      <div className="space-y-1">
                        <div
                          className="font-display text-[10px] uppercase tracking-[0.25em]"
                          style={{ color: "var(--team-beta)" }}
                        >
                          Team Beta — {engine.balancedTeams.betaTotalPower.toFixed(1)} pts
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {engine.balancedTeams.beta.map((name) => {
                            const entry = summoners.find((s) => s.name === name);
                            return (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 text-[10px] border border-gold/20 bg-background/40 px-1.5 py-0.5 font-display"
                              >
                                {name}
                                <span className="text-gold/50">{entry?.power ?? 1}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Diff */}
                      <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Diff:{" "}
                        <span
                          className={
                            engine.balancedTeams.powerDiff === 0
                              ? "text-green-400"
                              : engine.balancedTeams.powerDiff <= 2
                              ? "text-gold-bright"
                              : "text-destructive/70"
                          }
                        >
                          {engine.balancedTeams.powerDiff.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/40 text-center mt-auto mb-auto">
                      Bật Evaluate Power
                      <br />
                      <span className="text-[9px] normal-case tracking-normal font-serif italic">
                        để xem phân bổ team
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Arena (always visible, fixed height) ── */}
        <section
          className="border border-gold/30 bg-background/60 min-h-[120px]"
          aria-label="Shuffle arena"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20">
            <span className="font-display text-xs uppercase tracking-[0.4em] text-gold">
              {engine.shuffling && engine.activeRound && engine.activeLane
                ? `Round ${engine.rounds.findIndex((r) => r.id === engine.activeRoundId) + 1} · Lane ${engine.activeLaneIdx + 1} / ${engine.activeRound.lanes.length}`
                : engine.shuffling
                ? "Channeling…"
                : "Shuffle Arena"}
            </span>
            <div className="flex items-center gap-2">
              {engine.shuffling && (
                <PrimaryButton
                  onClick={engine.handleStopShuffle}
                  variant="danger"
                  size="sm"
                >
                  ✕ Stop
                </PrimaryButton>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center px-4 py-4 min-h-[330px]">
            {engine.shuffling && engine.activeLane && engine.activeRound ? (
              <div className="w-full max-w-3xl mx-auto">
                <LaneRow
                  key={`${engine.activeRound.id}-${engine.activeLaneIdx}`}
                  index={engine.activeLaneIdx}
                  finalRole={engine.activeLane.role}
                  alphaName={engine.activeLane.alphaName}
                  betaName={engine.activeLane.betaName}
                  alphaChampion={engine.activeLane.alphaChamp}
                  betaChampion={engine.activeLane.betaChamp}
                  allMemberNames={members}
                  championPool={engine.champions}
                  scale={Math.max(0.1, (engine.laneSeconds ?? 2) / 2)}
                  onComplete={engine.handleLaneComplete}
                />
              </div>
            ) : (
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/40">
                {engine.shuffling ? "Channeling…" : "Ready to shuffle"}
              </p>
            )}
          </div>

          {/* Action buttons inside arena */}
          <div className="flex items-center gap-3 flex-wrap px-4 pb-4">
            <PrimaryButton
              onClick={engine.handleShuffle}
              disabled={!engine.canShuffle}
              variant="primary"
              size="lg"
              className="flex-1 min-w-[120px]"
            >
              {engine.shuffling
                ? "Shuffling…"
                : `Shuffle — Round ${engine.rounds.length + 1}`}
            </PrimaryButton>

            {hasResults && !engine.shuffling && (
              <>
                <PrimaryButton
                  onClick={engine.clearRounds}
                  variant="danger"
                  size="lg"
                >
                  Clear
                </PrimaryButton>

                <PrimaryButton
                  onClick={handleScreenshot}
                  variant="default"
                  size="lg"
                  className="flex items-center gap-1.5"
                >
                  <CameraIcon />
                  Screenshot
                </PrimaryButton>
              </>
            )}
          </div>
        </section>

        {/* ── Results — each round rendered separately ── */}
        <section ref={resultsRef} aria-label="Result" className="min-h-[50vh]">
          <ResultList
            rounds={engine.rounds}
            onDeleteRound={engine.deleteRound}
            disabled={engine.shuffling}
          />
        </section>

      </main>

      {/* Screenshot preview modal */}
      <ScreenshotPreviewDialog
        dataUrl={screenshotPreview}
        onSave={handleSaveScreenshot}
        onDiscard={() => setScreenshotPreview(null)}
      />
    </div>
  );
};

export const Route = createFileRoute("/v2/random")({
  component: V2RandomPage,
});
