import React, { useState } from "react";
import { UserPlus, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import { PrimaryButton } from "@/components/PrimaryButton";
import { V3CardHeader } from "@/features/v3/components/V3CardHeader";

type V3AddSummonerInputProps = {
  isEvaluatePowerEnabled: boolean;
  onAddSummoner: (summonerName: string, initialPowerScore?: number) => boolean;
  isGuestMaxReached?: boolean;
};

export const V3AddSummonerInput = ({
  isEvaluatePowerEnabled,
  onAddSummoner,
  isGuestMaxReached = false,
}: V3AddSummonerInputProps) => {
  const v3Locales = useV3Locales();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [inputSummonerName, setInputSummonerName] = useState<string>("");
  const [inputPowerScore, setInputPowerScore] = useState<number | "">(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (isGuestMaxReached) {
      setErrorMessage(v3Locales.addSummoner.guestLimitReached);
      return;
    }

    const trimmedName = inputSummonerName.trim();
    if (!trimmedName) {
      setErrorMessage(v3Locales.addSummoner.inputRequiredError);
      return;
    }

    const rawPower = typeof inputPowerScore === "number" ? inputPowerScore : 5;
    const powerToSubmit = Math.min(10, Math.max(1, rawPower));
    const isSuccess = onAddSummoner(trimmedName, powerToSubmit);
    if (isSuccess) {
      setInputSummonerName("");
      setInputPowerScore(5);
      setErrorMessage(null);
    } else if (isGuestMaxReached) {
      setErrorMessage(v3Locales.addSummoner.guestLimitReached);
    }
  };

  return (
    <div
      className={cn(
        "v3-add-card",
        "rounded-lg border border-gold/30 bg-card/80 p-5 shadow-lg mb-5 hextech-frame transition-all",
      )}
    >
      <V3CardHeader
        title={v3Locales.addSummoner.cardTitle}
        icon={<UserPlus className="w-4 h-4" />}
        isCollapsible={true}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <form
          onSubmit={handleFormSubmit}
          className="space-y-4 mt-3 border-t border-gold/20 pt-4 animate-fade-in"
        >
          {isGuestMaxReached && (
            <div className="p-3 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{v3Locales.addSummoner.guestLimitNotice}</span>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-gold/20 hover:bg-gold/30 text-gold-bright text-[11px] font-display uppercase tracking-wider font-semibold whitespace-nowrap border border-gold/40 transition-colors shrink-0"
              >
                {v3Locales.addSummoner.loginToUnlock}
              </Link>
            </div>
          )}

          <div>
            <label
              htmlFor="v3-summoner-name-input"
              className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              {v3Locales.dialogs.editNameLabel}
            </label>
            <input
              id="v3-summoner-name-input"
              type="text"
              disabled={isGuestMaxReached}
              value={inputSummonerName}
              onChange={(event) => {
                setInputSummonerName(event.target.value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
              placeholder={
                isGuestMaxReached
                  ? v3Locales.addSummoner.guestLimitNotice
                  : v3Locales.addSummoner.inputPlaceholder
              }
              className={cn(
                "w-full px-3 py-2 rounded bg-background/90 border text-foreground text-xs input-hex disabled:opacity-50 disabled:cursor-not-allowed",
                errorMessage ? "border-red-500" : "border-gold/30",
              )}
            />
            {errorMessage && (
              <p className="text-[11px] text-red-400 mt-1 font-sans">{errorMessage}</p>
            )}
          </div>

          {isEvaluatePowerEnabled && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="v3-power-score-input"
                  className="block text-xs font-display uppercase tracking-wider text-muted-foreground"
                >
                  {v3Locales.addSummoner.powerScoreLabel}
                </label>
                <span className="text-xs font-mono font-bold text-gold-bright bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                  {inputPowerScore === "" ? 0 : inputPowerScore}
                </span>
              </div>
              <input
                id="v3-power-score-input"
                type="number"
                disabled={isGuestMaxReached}
                min={1}
                max={10}
                step={1}
                value={inputPowerScore}
                onChange={(event) => {
                  const val = event.target.value;
                  if (val === "") {
                    setInputPowerScore("");
                    return;
                  }
                  const parsedValue = parseInt(val, 10);
                  setInputPowerScore(
                    isNaN(parsedValue) ? 1 : Math.min(10, Math.max(1, parsedValue)),
                  );
                }}
                className="w-full px-3 py-1.5 rounded bg-background/90 border border-gold/30 text-foreground text-xs input-hex font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          <PrimaryButton
            type="submit"
            variant="primary"
            size="md"
            disabled={isGuestMaxReached}
            className="w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {v3Locales.addSummoner.addButtonLabel}
          </PrimaryButton>
        </form>
      )}
    </div>
  );
};
