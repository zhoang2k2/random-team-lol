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
  isOpen,
  dataUrl,
  onSave,
  onDiscard,
  onClose,
}: {
  isOpen?: boolean;
  dataUrl: string | null;
  onSave: () => void;
  onDiscard?: () => void;
  onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const isVisible = (isOpen === undefined ? Boolean(dataUrl) : isOpen) && Boolean(dataUrl);
  if (!isVisible || !dataUrl) return null;

  const handleClose = onDiscard || onClose || (() => {});

  const handleCopy = async () => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
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
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch {
      // ignore clipboard error during download
    }
    onSave();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="hextech-frame p-5 max-w-2xl w-full mx-auto space-y-4 animate-fade-in bg-card/95 border border-gold/40 shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/20 pb-2">
          <h3 className="font-display text-gold-bright uppercase tracking-widest text-sm font-bold">
            Xem Trước Ảnh Chụp
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-gold-bright text-xs font-display px-2 py-0.5 rounded hover:bg-gold/10 transition-colors cursor-pointer"
          >
            ✕ Đóng
          </button>
        </div>

        <div className="border border-gold/30 rounded overflow-hidden max-h-[65vh] overflow-y-auto bg-black/40 p-2">
          <img
            src={dataUrl}
            alt="Screenshot preview"
            className="w-full h-auto rounded object-contain mx-auto"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-end pt-1">
          <button
            type="button"
            className="btn-hex text-xs px-4 py-2 border-destructive/50 text-destructive hover:bg-destructive/10 cursor-pointer rounded transition-colors"
            onClick={handleClose}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            className={`btn-hex text-xs px-4 py-2 cursor-pointer transition-all rounded ${
              copied
                ? "border-green-500 text-green-400 bg-green-950/30"
                : "border-gold/40 text-gold-bright hover:bg-gold/10"
            }`}
            onClick={handleCopy}
          >
            {copied ? "Đã Sao Chép! ✓" : "Sao Chép Vào Khay Nhớ Tạm"}
          </button>
          <button
            type="button"
            className="btn-hex btn-hex-primary text-xs px-4 py-2 cursor-pointer rounded font-bold"
            onClick={handleSaveAndCopy}
          >
            Tải Ảnh Về Máy
          </button>
        </div>
      </div>
    </div>
  );
}
