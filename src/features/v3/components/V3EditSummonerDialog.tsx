import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import type { V3Summoner } from "@/features/v3/types/v3Types";
import { PrimaryButton } from "@/components/PrimaryButton";

type V3EditSummonerDialogProps = {
  editingSummoner: V3Summoner | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEdit: (targetId: string, updatedName: string, updatedPowerScore: number) => void;
};

export const V3EditSummonerDialog = ({
  editingSummoner,
  isOpen,
  onClose,
  onConfirmEdit,
}: V3EditSummonerDialogProps) => {
  const v3Locales = useV3Locales();
  const [editedName, setEditedName] = useState<string>("");
  const [editedPowerScore, setEditedPowerScore] = useState<number | "">(100);

  useEffect(() => {
    if (editingSummoner) {
      setEditedName(editingSummoner.name);
      setEditedPowerScore(editingSummoner.powerScore);
    }
  }, [editingSummoner]);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSummoner) {
      return;
    }

    const trimmedName = editedName.trim();
    if (trimmedName) {
      const finalPowerScore = typeof editedPowerScore === "number" ? editedPowerScore : 0;
      onConfirmEdit(editingSummoner.id, trimmedName, finalPowerScore);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-gold/30 bg-card/95 backdrop-blur-lg hextech-frame max-w-md w-full overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display uppercase tracking-wide text-gold-bright text-base">
            {v3Locales.dialogs.editTitle}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 my-2">
          <div>
            <label
              htmlFor="v3-edit-name-input"
              className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              {v3Locales.dialogs.editNameLabel}
            </label>
            <input
              id="v3-edit-name-input"
              type="text"
              value={editedName}
              onChange={(event) => setEditedName(event.target.value)}
              className="w-full px-3 py-2 rounded bg-background/90 border border-gold/30 text-foreground text-xs input-hex"
              required
            />
          </div>

          <div>
            <label
              htmlFor="v3-edit-power-input"
              className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              {v3Locales.dialogs.editPowerLabel}
            </label>
            <input
              id="v3-edit-power-input"
              type="number"
              min={0}
              max={10000}
              step={10}
              value={editedPowerScore}
              onChange={(event) => {
                const val = event.target.value;
                if (val === "") {
                  setEditedPowerScore("");
                  return;
                }
                const parsedValue = parseInt(val, 10);
                setEditedPowerScore(
                  isNaN(parsedValue) ? 0 : Math.min(10000, Math.max(0, parsedValue)),
                );
              }}
              className="w-full px-3 py-2 rounded bg-background/90 border border-gold/30 text-foreground text-xs input-hex font-mono"
            />
          </div>

          <AlertDialogFooter className="mt-5 flex items-center gap-2 justify-end">
            <AlertDialogCancel type="button" onClick={onClose} className="btn-hex text-xs py-1.5">
              {v3Locales.dialogs.cancelButton}
            </AlertDialogCancel>
            <PrimaryButton type="submit" variant="primary" size="sm">
              {v3Locales.dialogs.confirmEditButton}
            </PrimaryButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
