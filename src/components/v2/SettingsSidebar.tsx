import { ShuffleTeamToggle } from "@/components/ShuffleTeamToggle";
import { DefaultRolePicker } from "@/components/DefaultRolePicker";
import { SkipAnimationToggle } from "@/components/v2/SkipAnimationToggle";
import { EvaluatePowerToggle } from "@/components/v2/EvaluatePowerToggle";
import { NeverSameTeam } from "@/components/v2/NeverSameTeam";
import { SummonerList } from "@/components/v2/SummonerList";

import type { Summoner, V2Settings } from "@/hooks/useV2Store";

type SettingsSidebarProps = {
  summoners: Summoner[];
  settings: V2Settings;
  disabled?: boolean;
  onRemoveSummoner: (id: string) => void;
  onReorderSummoners: (orderedIds: string[]) => void;
  onPowerChange: (id: string, power: number) => void;
  onSettingsChange: (patch: Partial<V2Settings>) => void;
};

export const SettingsSidebar = ({
  summoners,
  settings,
  disabled = false,
  onRemoveSummoner,
  onReorderSummoners,
  onPowerChange,
  onSettingsChange,
}: SettingsSidebarProps) => {
  const members = summoners.map((summoner) => summoner.name);

  return (
    <aside
      className="w-72 shrink-0 flex flex-col gap-6 bg-background/70 border-r border-gold/30 backdrop-blur-sm p-4 overflow-y-auto"
      aria-label="Match settings"
    >
      {/* Summoners section */}
      <section aria-labelledby="sidebar-summoners-heading">
        <h3
          id="sidebar-summoners-heading"
          className="font-display text-xs uppercase tracking-[0.3em] text-gold-bright mb-3"
        >
          Summoners
        </h3>
        <SummonerList
          summoners={summoners}
          showPowerInput={settings.evaluatePower}
          draggable={!disabled}
          onRemove={onRemoveSummoner}
          onReorder={onReorderSummoners}
          onPowerChange={onPowerChange}
        />
      </section>

      <div className="gold-divider" />

      {/* Match Settings section */}
      <section aria-labelledby="sidebar-settings-heading" className="space-y-4">
        <h3
          id="sidebar-settings-heading"
          className="font-display text-xs uppercase tracking-[0.3em] text-gold-bright"
        >
          Match Settings
        </h3>

        <ShuffleTeamToggle
          value={settings.shuffleTeam}
          onChange={(value) => onSettingsChange({ shuffleTeam: value })}
          disabled={disabled}
        />

        <SkipAnimationToggle
          value={settings.skipAnimation}
          animationSeconds={settings.animationSeconds}
          onChange={(value) => onSettingsChange({ skipAnimation: value })}
          onSecondsChange={(seconds) => onSettingsChange({ animationSeconds: seconds })}
          disabled={disabled}
        />

        <EvaluatePowerToggle
          value={settings.evaluatePower}
          onChange={(value) => onSettingsChange({ evaluatePower: value })}
          disabled={disabled}
        />

        <DefaultRolePicker
          members={members}
          teamSize={5}
          value={settings.defaultRoles}
          onChange={(defaultRoles) => onSettingsChange({ defaultRoles })}
          disabled={disabled}
        />

        <NeverSameTeam
          members={members}
          value={settings.exclusion}
          onChange={(exclusion) => onSettingsChange({ exclusion })}
          disabled={disabled}
        />
      </section>
    </aside>
  );
};
