import React from "react";
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

type V3DeleteSummonerDialogProps = {
  deletingSummoner: V3Summoner | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (targetId: string) => void;
};

export const V3DeleteSummonerDialog = ({
  deletingSummoner,
  isOpen,
  onClose,
  onConfirmDelete,
}: V3DeleteSummonerDialogProps) => {
  const v3Locales = useV3Locales();

  const handleConfirmAction = () => {
    if (deletingSummoner) {
      onConfirmDelete(deletingSummoner.id);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-red-500/30 bg-card/95 backdrop-blur-lg hextech-frame max-w-md w-full overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display uppercase tracking-wide text-red-400 text-base">
            {v3Locales.dialogs.deleteTitle}
          </AlertDialogTitle>
        </AlertDialogHeader>

        {deletingSummoner && (
          <div className="my-2 p-2.5 rounded bg-background/80 border border-red-500/20 text-xs font-display text-foreground">
            {deletingSummoner.name}
          </div>
        )}

        <AlertDialogFooter className="mt-5 flex items-center gap-2 justify-end">
          <AlertDialogCancel onClick={onClose} className="btn-hex text-xs py-1.5">
            {v3Locales.dialogs.cancelButton}
          </AlertDialogCancel>
          <PrimaryButton type="button" variant="danger" size="sm" onClick={handleConfirmAction}>
            {v3Locales.dialogs.confirmDeleteButton}
          </PrimaryButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
