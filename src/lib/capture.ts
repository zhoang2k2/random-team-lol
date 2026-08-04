/**
 * Captures one or more DOM elements to a single PNG data URL.
 * Multiple elements are stitched vertically with a small gap.
 */
export async function captureElements(elements: HTMLElement[]): Promise<string> {
  const { default: html2canvas } = await import("html2canvas-pro");

  if (elements.length === 0) throw new Error("No elements to capture");

  if (elements.length === 1) {
    const canvas = await html2canvas(elements[0], {
      backgroundColor: null,
      useCORS: true,
      scale: 2,
    });
    return canvas.toDataURL("image/png");
  }

  // Multiple elements: render each to canvas, then stitch vertically
  const canvases = await Promise.all(
    elements.map((el) =>
      html2canvas(el, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      }),
    ),
  );

  const GAP = 16; // px gap between rounds (at scale 2)
  const totalWidth = Math.max(...canvases.map((c) => c.width));
  const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0) + GAP * (canvases.length - 1);

  const combined = document.createElement("canvas");
  combined.width = totalWidth;
  combined.height = totalHeight;
  const ctx = combined.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Fill background with the app background color
  ctx.fillStyle = "#1a2335"; // approximate --background value
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let y = 0;
  for (const c of canvases) {
    ctx.drawImage(c, 0, y);
    y += c.height + GAP;
  }

  return combined.toDataURL("image/png");
}
