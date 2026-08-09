/**
 * Captures one or more DOM elements to a single PNG data URL.
 * Multiple elements are stitched vertically with a small gap.
 */
export async function captureElements(elements: HTMLElement[]): Promise<string> {
  const { default: html2canvas } = await import("html2canvas-pro");

  if (elements.length === 0) throw new Error("No elements to capture");

  const commonOptions = {
    backgroundColor: "#030f16",
    useCORS: true,
    allowTaint: true,
    scale: 2,
    logging: false,
    windowWidth: 1280,
    windowHeight: 1280,
    onclone: (clonedDoc: Document) => {
      // 1. Copy all CSS rules from document.styleSheets & <style> tags to clonedDoc
      try {
        const styleEl = clonedDoc.createElement("style");
        styleEl.setAttribute("id", "capture-injected-styles");
        let allCss = "";

        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              Array.from(rules).forEach((rule) => {
                allCss += rule.cssText + "\n";
              });
            }
          } catch {
            // Ignore CORS restriction on external sheets
          }
        });

        document.querySelectorAll("style").forEach((s) => {
          allCss += s.innerHTML + "\n";
        });

        styleEl.textContent = allCss;
        clonedDoc.head.appendChild(styleEl);
      } catch (err) {
        console.warn("Failed to inject styles into cloned doc:", err);
      }

      // 2. Hide ignore-capture elements like action buttons
      const ignoreElems = clonedDoc.querySelectorAll("[data-capture-ignore='true']");
      ignoreElems.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      // 3. Set background & text color on cloned body & root
      if (clonedDoc.body) {
        clonedDoc.body.style.backgroundColor = "#030f16";
        clonedDoc.body.style.color = "#ece3d6";
      }
      if (clonedDoc.documentElement) {
        clonedDoc.documentElement.style.backgroundColor = "#030f16";
        clonedDoc.documentElement.style.color = "#ece3d6";
      }

      // 4. Force desktop width on capture targets so flex layouts don't collapse into mobile columns
      const captureTargets = clonedDoc.querySelectorAll("[data-capture-target='true']");
      captureTargets.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.width = "780px";
        htmlEl.style.minWidth = "780px";
        htmlEl.style.maxWidth = "780px";
        htmlEl.style.boxSizing = "border-box";
        htmlEl.style.backgroundColor = "#061821";
        htmlEl.style.color = "#ece3d6";
      });
    },
  };

  if (elements.length === 1) {
    const canvas = await html2canvas(elements[0], commonOptions);
    return canvas.toDataURL("image/png");
  }

  // Multiple elements: render each to canvas, then stitch vertically
  const canvases = await Promise.all(elements.map((el) => html2canvas(el, commonOptions)));

  const GAP = 20; // px gap between rounds
  const totalWidth = Math.max(...canvases.map((c) => c.width));
  const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0) + GAP * (canvases.length - 1);

  const combined = document.createElement("canvas");
  combined.width = totalWidth;
  combined.height = totalHeight;
  const ctx = combined.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Fill background with the exact app Hextech background color
  ctx.fillStyle = "#030f16";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let y = 0;
  for (const c of canvases) {
    ctx.drawImage(c, 0, y);
    y += c.height + GAP;
  }

  return combined.toDataURL("image/png");
}
