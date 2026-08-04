import { useState } from "react";

export function ScreenshotChooserDialog({
  open,
  onSelectAll,
  onSelectPick,
  onCancel,
}: {
  open: boolean;
  onSelectAll: () => void;
  onSelectPick: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="hextech-frame p-6 max-w-sm w-full mx-4 space-y-4 animate-fade-in">
        <h3 className="font-display text-gold-bright uppercase tracking-widest text-sm">
          Screenshot Results
        </h3>
        <p className="font-serif text-sm text-muted-foreground">Choose what to capture:</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-hex btn-hex-primary w-full cursor-pointer"
            onClick={onSelectAll}
          >
            Select All Rounds
          </button>
          <button type="button" className="btn-hex w-full cursor-pointer" onClick={onSelectPick}>
            Select Rounds
          </button>
        </div>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground hover:text-gold-bright transition-colors font-display uppercase tracking-widest cursor-pointer"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ScreenshotPreviewDialog({
  dataUrl,
  onSave,
  onDiscard,
}: {
  dataUrl: string | null;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!dataUrl) return null;

  const handleCopy = async () => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      alert("Không thể sao chép ảnh vào clipboard. Vui lòng tải ảnh về thiết bị.");
    }
  };

  const handleSaveAndCopy = async () => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    } catch {
      // ignore clipboard error during download
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="hextech-frame p-5 max-w-xl w-full mx-auto space-y-4 animate-fade-in">
        <h3 className="font-display text-gold-bright uppercase tracking-widest text-sm">
          Save Screenshot?
        </h3>
        <div className="border border-gold/30 overflow-hidden max-h-[60vh] overflow-y-auto">
          <img src={dataUrl} alt="Screenshot preview" className="w-full h-auto" />
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            className="btn-hex text-xs px-4 py-1.5 border-destructive/50 text-destructive cursor-pointer"
            onClick={onDiscard}
          >
            Discard
          </button>
          <button
            type="button"
            className={`btn-hex text-xs px-4 py-1.5 cursor-pointer transition-all ${
              copied ? "border-green-500 text-green-400" : ""
            }`}
            onClick={handleCopy}
          >
            {copied ? "Copied! ✓" : "Copy to Clipboard"}
          </button>
          <button
            type="button"
            className="btn-hex btn-hex-primary text-xs px-4 py-1.5 cursor-pointer"
            onClick={handleSaveAndCopy}
          >
            Save to Device
          </button>
        </div>
      </div>
    </div>
  );
}
