import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import { cn } from "@/lib/utils";

type V3ClearConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
};

export const V3ClearConfirmDialog = ({
  isOpen,
  onClose,
  onConfirmClear,
}: V3ClearConfirmDialogProps) => {
  const v3Locales = useV3Locales();

  const handleConfirmAction = () => {
    onConfirmClear();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-red-500/30 bg-card/95 backdrop-blur-lg hextech-frame max-w-md w-full overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display uppercase tracking-wide text-red-400 text-base">
            {v3Locales.dialogs.clearTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed">
            {v3Locales.dialogs.clearDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-5 flex items-center gap-2 justify-end">
          <AlertDialogCancel onClick={onClose} className="btn-hex text-xs py-1.5">
            {v3Locales.dialogs.cancelButton}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmAction}
            className={cn(
              "bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer",
            )}
          >
            {v3Locales.dialogs.confirmClearButton}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
