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
import { PrimaryButton } from "@/components/PrimaryButton";
import { Trash2 } from "lucide-react";

type V3ClearRosterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const V3ClearRosterDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: V3ClearRosterDialogProps) => {
  const v3Locales = useV3Locales();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-red-500/30 bg-card/95 backdrop-blur-lg hextech-frame max-w-md w-full overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display uppercase tracking-wide text-red-400 text-base flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            {v3Locales.activeGrid.clearRosterTitle}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <p className="text-xs text-muted-foreground font-sans my-2">
          {v3Locales.activeGrid.clearRosterDescription}
        </p>

        <AlertDialogFooter className="mt-5 flex items-center gap-2 justify-end">
          <AlertDialogCancel onClick={onClose} className="btn-hex text-xs py-1.5">
            {v3Locales.dialogs.cancelButton}
          </AlertDialogCancel>
          <PrimaryButton type="button" variant="danger" size="sm" onClick={handleConfirm}>
            {v3Locales.activeGrid.confirmClearRosterButton}
          </PrimaryButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
