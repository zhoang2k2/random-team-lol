import React, { useState } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import type { V3Settings } from "@/features/v3/types/v3Types";
import { DefaultRolePicker, type DefaultRoleConfig } from "@/components/DefaultRolePicker";
import { V3NeverSameTeam } from "./V3NeverSameTeam";
import type { ExclusionPair } from "@/lib/randomize";
import { V3CardHeader } from "@/features/v3/components/V3CardHeader";
import { useI18n } from "@/i18n/I18nContext";
import { SkeletonInput, SkeletonText, SkeletonButton } from "@/components/ui/skeleton";

type V3SettingsCardProps = {
  settings: V3Settings;
  activeMemberNames: string[];
  isDataLoading?: boolean;
  isDisabled?: boolean;
  onToggleShuffleTeam: (isEnabled: boolean) => void;
  onTogglePowerEvaluate: (isEnabled: boolean) => void;
  onToggleSkipAnimation: (isEnabled: boolean) => void;
  onChangeDefaultRoles: (roles: DefaultRoleConfig) => void;
  onChangeNeverSameTeam: (pair: ExclusionPair | null) => void;
};

export const V3SettingsCard = ({
  settings,
  activeMemberNames,
  isDataLoading = false,
  isDisabled = false,
  onToggleShuffleTeam,
  onTogglePowerEvaluate,
  onToggleSkipAnimation,
  onChangeDefaultRoles,
  onChangeNeverSameTeam,
}: V3SettingsCardProps) => {
  const v3Locales = useV3Locales();
  const { locale } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const isShuffleTeamActive = settings.isEvaluatePowerEnabled || settings.isShuffleTeamEnabled;
  const isShuffleTeamDisabled = settings.isEvaluatePowerEnabled || isDisabled;

  return (
    <div
      className={cn(
        "v3-settings-card",
        "rounded-lg border border-gold/30 bg-card/80 p-5 shadow-lg mb-5 hextech-frame transition-all",
      )}
    >
      <V3CardHeader
        title={v3Locales.settings.cardTitle}
        icon={<Settings className="w-4 h-4" />}
        isCollapsible={true}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <div className="space-y-6 mt-3 border-t border-gold/20 pt-4 animate-fade-in">
          {isDataLoading ? (
            <div className="space-y-4">
              <div className="p-3 rounded bg-background/80 border border-gold/20 flex items-center justify-between">
                <SkeletonText className="h-4 w-40" />
                <SkeletonButton className="h-5 w-10 rounded-full" />
              </div>
              <div className="p-3 rounded bg-background/80 border border-gold/20 flex items-center justify-between">
                <SkeletonText className="h-4 w-44" />
                <SkeletonButton className="h-5 w-10 rounded-full" />
              </div>
              <div className="p-3 rounded bg-background/80 border border-gold/20 flex items-center justify-between">
                <SkeletonText className="h-4 w-36" />
                <SkeletonButton className="h-5 w-10 rounded-full" />
              </div>
              <SkeletonInput className="h-44 w-full" />
            </div>
          ) : (
            <>
              {/* Main Mode Toggles */}
              <div className="space-y-3">
                {/* Shuffle Team Toggle */}
                <div className="p-3 rounded bg-background/80 border border-gold/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display uppercase tracking-wider text-foreground font-semibold">
                      {v3Locales.settings.shuffleTeamLabel}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isShuffleTeamActive}
                      disabled={isShuffleTeamDisabled}
                      onClick={() => {
                        if (!isShuffleTeamDisabled) {
                          onToggleShuffleTeam(!settings.isShuffleTeamEnabled);
                        }
                      }}
                      className={cn(
                        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-gold/40 transition-colors duration-200 ease-in-out focus:outline-none",
                        isShuffleTeamActive ? "bg-gold" : "bg-muted/80",
                        isShuffleTeamDisabled && "opacity-60 cursor-not-allowed",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5",
                          isShuffleTeamActive
                            ? "translate-x-5 bg-black"
                            : "translate-x-0 bg-gold-bright",
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80">
                    {v3Locales.settings.shuffleTeamHint}
                    {settings.isEvaluatePowerEnabled && (
                      <span className="block text-amber-400/90 font-medium mt-0.5">
                        {locale === "en"
                          ? "(Automatically enabled when Power Balance is active)"
                          : "(Tự động kích hoạt khi bật Cân Bằng Sức Mạnh)"}
                      </span>
                    )}
                  </p>
                </div>

                {/* Power Evaluate Toggle */}
                <div className="p-3 rounded bg-background/80 border border-gold/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display uppercase tracking-wider text-foreground font-semibold">
                      {v3Locales.settings.powerEvaluateLabel}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.isEvaluatePowerEnabled}
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          onTogglePowerEvaluate(!settings.isEvaluatePowerEnabled);
                        }
                      }}
                      className={cn(
                        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-gold/40 transition-colors duration-200 ease-in-out focus:outline-none",
                        settings.isEvaluatePowerEnabled ? "bg-gold" : "bg-muted/80",
                        isDisabled && "opacity-60 cursor-not-allowed",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5",
                          settings.isEvaluatePowerEnabled
                            ? "translate-x-5 bg-black"
                            : "translate-x-0 bg-gold-bright",
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80">
                    {v3Locales.settings.powerEvaluateHint}
                  </p>
                </div>

                {/* Skip Animation Toggle */}
                <div className="p-3 rounded bg-background/80 border border-gold/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display uppercase tracking-wider text-foreground font-semibold">
                      {v3Locales.settings.skipAnimationLabel}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.isSkipAnimationEnabled}
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          onToggleSkipAnimation(!settings.isSkipAnimationEnabled);
                        }
                      }}
                      className={cn(
                        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-gold/40 transition-colors duration-200 ease-in-out focus:outline-none",
                        settings.isSkipAnimationEnabled ? "bg-gold" : "bg-muted/80",
                        isDisabled && "opacity-60 cursor-not-allowed",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5",
                          settings.isSkipAnimationEnabled
                            ? "translate-x-5 bg-black"
                            : "translate-x-0 bg-gold-bright",
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80">
                    {v3Locales.settings.skipAnimationHint}
                  </p>
                </div>
              </div>

              {/* Reused Default Role Component */}
              <div className="pt-2 border-t border-gold/20">
                <DefaultRolePicker
                  members={activeMemberNames}
                  teamSize={5}
                  value={settings.defaultRoles}
                  onChange={onChangeDefaultRoles}
                  disabled={isDisabled}
                />
              </div>

              {/* Reused Never On The Same Team Component */}
              <div className="pt-2 border-t border-gold/20">
                <V3NeverSameTeam
                  members={activeMemberNames}
                  value={settings.neverSameTeam}
                  onChange={onChangeNeverSameTeam}
                  disabled={isDisabled}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
