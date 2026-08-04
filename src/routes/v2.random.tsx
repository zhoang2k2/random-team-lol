import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { buildLanePairings } from "@/lib/randomize";
import { V2StoreProvider, useV2StoreContext } from "@/contexts/V2StoreContext";
import { V2Header } from "@/components/v2/V2Header";
import { SettingsSidebar } from "@/components/v2/SettingsSidebar";
import { ResultList } from "@/components/v2/ResultList";
import { PrimaryButton } from "@/components/v2/PrimaryButton";
import type { LaneResult } from "@/components/v2/ResultLane";

export const Route = createFileRoute("/v2/random")({
  component: V2RandomPageWrapper,
});

const V2RandomPageWrapper = () => (
  <V2StoreProvider>
    <V2RandomPage />
  </V2StoreProvider>
);

const V2RandomPage = () => {
  const {
    summoners,
    settings,
    results,
    members,
    removeSummoner,
    reorderSummoners,
    updatePower,
    updateSettings,
    setResults,
    clearResults,
  } = useV2StoreContext();

  const [isShuffling, setIsShuffling] = useState(false);

  const handleShuffle = () => {
    if (members.length < 2) return;
    setIsShuffling(true);

    const exclusions = settings.exclusion ? [settings.exclusion] : [];
    const teamSize = Math.min(5, Math.ceil(members.length / 2));

    const pairings = buildLanePairings(
      members,
      teamSize,
      false,
      settings.shuffleTeam,
      exclusions,
      settings.defaultRoles,
    );

    const nextResults: LaneResult[] = pairings.map((pairing) => ({
      role: pairing.role,
      alphaName: pairing.alpha,
      betaName: pairing.beta,
    }));

    setResults(nextResults);
    setIsShuffling(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <V2Header currentPath="/v2/random" />

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        {/* Left sidebar */}
        <SettingsSidebar
          summoners={summoners}
          settings={settings}
          disabled={isShuffling}
          onRemoveSummoner={removeSummoner}
          onReorderSummoners={reorderSummoners}
          onPowerChange={updatePower}
          onSettingsChange={updateSettings}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
          <div className="flex items-center gap-3">
            <PrimaryButton
              onClick={handleShuffle}
              disabled={members.length < 2 || isShuffling}
              variant="primary"
              className="flex-1 py-3 text-base"
            >
              {isShuffling ? "Đang shuffle…" : "Shuffle Team"}
            </PrimaryButton>

            {results.length > 0 && (
              <PrimaryButton
                onClick={clearResults}
                disabled={isShuffling}
                variant="danger"
                className="py-3"
              >
                Clear
              </PrimaryButton>
            )}
          </div>

          <ResultList lanes={results} />
        </main>
      </div>
    </div>
  );
};
