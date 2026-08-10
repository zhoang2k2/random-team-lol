import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useV3Store } from "@/features/v3/hooks/useV3Store";
import type { V3Summoner } from "@/features/v3/types/v3Types";
import { buildSeoMeta } from "@/lib/seo";
import { useV3Locales } from "@/features/v3/locales/v3Locales";

import { SiteHeader } from "@/components/SiteHeader";
import { V3AddSummonerInput } from "@/features/v3/components/V3AddSummonerInput";
import { V3AnimatedTitleHeader } from "@/features/v3/components/V3AnimatedTitleHeader";
import { V3SettingsCard } from "@/features/v3/components/V3SettingsCard";
import { V3ActiveSummonerGrid } from "@/features/v3/components/V3ActiveSummonerGrid";
import { V3InactiveSummonerList } from "@/features/v3/components/V3InactiveSummonerList";
import { V3ResultTable } from "@/features/v3/components/V3ResultTable";
import { V3EditSummonerDialog } from "@/features/v3/components/V3EditSummonerDialog";
import { V3DeleteSummonerDialog } from "@/features/v3/components/V3DeleteSummonerDialog";
import { V3ClearRosterDialog } from "@/features/v3/components/V3ClearRosterDialog";

const RandomLolPage = () => {
  const v3Locales = useV3Locales();
  const { locale } = Route.useParams();

  const {
    isLoggedIn,
    summonerList,
    settings,
    matchResults,
    draggedSourceIndex,
    previewDropTargetIndex,
    isShufflingAnimation,
    pendingOutcome,
    animatingLaneIdx,
    championPool,
    handleAddSummoner,
    handleUpdateSummoner,
    handleDeleteSummoner,
    handleClearAllSummoners,
    handleShuffleTeams,
    handleLaneComplete,
    handleStopShuffle,
    handleDeleteMatchResult,
    handleClearAllMatchResults,
    handleTogglePowerEvaluate,
    handleToggleShuffleTeam,
    handleToggleSkipAnimation,
    handleChangeDefaultRoles,
    handleChangeNeverSameTeam,
    handleDragStart,
    handleDragOverTarget,
    handleDragEndOrLeave,
    handleDropOnTarget,
  } = useV3Store();

  const [editingSummonerItem, setEditingSummonerItem] = useState<V3Summoner | null>(null);
  const [deletingSummonerItem, setDeletingSummonerItem] = useState<V3Summoner | null>(null);
  const [isClearRosterDialogOpen, setIsClearRosterDialogOpen] = useState(false);

  const activeMemberNames = summonerList.slice(0, 10).map((summoner) => summoner.name);
  const isDragDisabled = settings.isEvaluatePowerEnabled || settings.isShuffleTeamEnabled;
  const isGuestMaxReached = !isLoggedIn && summonerList.length >= 10;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader currentPath={`/${locale}/random-lol`} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6">
        <V3AnimatedTitleHeader
          mainHeading={v3Locales.header.mainHeading}
          defaultBadgeText={v3Locales.header.customBadge}
        />

        {/* 12 Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 space-y-5">
            <V3AddSummonerInput
              isEvaluatePowerEnabled={settings.isEvaluatePowerEnabled}
              onAddSummoner={handleAddSummoner}
              isGuestMaxReached={isGuestMaxReached}
            />

            <V3ActiveSummonerGrid
              summonerList={summonerList}
              isEvaluatePowerEnabled={settings.isEvaluatePowerEnabled}
              isDragDisabled={isDragDisabled}
              draggedSourceIndex={draggedSourceIndex}
              previewDropTargetIndex={previewDropTargetIndex}
              onEditClick={(summonerItem) => setEditingSummonerItem(summonerItem)}
              onDeleteClick={(summonerItem) => setDeletingSummonerItem(summonerItem)}
              onClearAll={() => setIsClearRosterDialogOpen(true)}
              onDragStart={handleDragStart}
              onDragOverTarget={handleDragOverTarget}
              onDragEndOrLeave={handleDragEndOrLeave}
              onDropOnTarget={handleDropOnTarget}
            />

            {isLoggedIn && (
              <V3InactiveSummonerList
                summonerList={summonerList}
                isEvaluatePowerEnabled={settings.isEvaluatePowerEnabled}
                isDragDisabled={isDragDisabled}
                draggedSourceIndex={draggedSourceIndex}
                previewDropTargetIndex={previewDropTargetIndex}
                onEditClick={(summonerItem) => setEditingSummonerItem(summonerItem)}
                onDeleteClick={(summonerItem) => setDeletingSummonerItem(summonerItem)}
                onDragStart={handleDragStart}
                onDragOverTarget={handleDragOverTarget}
                onDragEndOrLeave={handleDragEndOrLeave}
                onDropOnTarget={handleDropOnTarget}
              />
            )}

            <V3SettingsCard
              settings={settings}
              activeMemberNames={activeMemberNames}
              onToggleShuffleTeam={handleToggleShuffleTeam}
              onTogglePowerEvaluate={handleTogglePowerEvaluate}
              onToggleSkipAnimation={handleToggleSkipAnimation}
              onChangeDefaultRoles={handleChangeDefaultRoles}
              onChangeNeverSameTeam={handleChangeNeverSameTeam}
            />
          </section>

          <section className="lg:col-span-7">
            <V3ResultTable
              summonerList={summonerList}
              settings={settings}
              matchResults={matchResults}
              isShufflingAnimation={isShufflingAnimation}
              pendingOutcome={pendingOutcome}
              animatingLaneIdx={animatingLaneIdx}
              championPool={championPool}
              onShuffleClick={handleShuffleTeams}
              onLaneComplete={handleLaneComplete}
              onStopShuffle={handleStopShuffle}
              onDeleteMatch={handleDeleteMatchResult}
              onClearAllMatches={handleClearAllMatchResults}
            />
          </section>
        </div>
      </main>

      <V3EditSummonerDialog
        editingSummoner={editingSummonerItem}
        isOpen={Boolean(editingSummonerItem)}
        onClose={() => setEditingSummonerItem(null)}
        onConfirmEdit={handleUpdateSummoner}
      />

      <V3DeleteSummonerDialog
        deletingSummoner={deletingSummonerItem}
        isOpen={Boolean(deletingSummonerItem)}
        onClose={() => setDeletingSummonerItem(null)}
        onConfirmDelete={handleDeleteSummoner}
      />

      <V3ClearRosterDialog
        isOpen={isClearRosterDialogOpen}
        onClose={() => setIsClearRosterDialogOpen(false)}
        onConfirm={handleClearAllSummoners}
      />
    </div>
  );
};

export const Route = createFileRoute("/$locale/random-lol")({
  head: ({ params }) => {
    const locale = params.locale === "en" ? "en" : "vi";
    return buildSeoMeta({ path: "/random-lol", locale });
  },
  component: RandomLolPage,
});
