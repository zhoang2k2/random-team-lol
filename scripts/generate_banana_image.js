import fs from "fs";
import path from "path";
import sharp from "sharp";

const svgBanana = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5C0" />
      <stop offset="30%" stop-color="#FFE066" />
      <stop offset="70%" stop-color="#F5B800" />
      <stop offset="100%" stop-color="#B37B00" />
    </linearGradient>
    <linearGradient id="fleshGradient" x1="0%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="40%" stop-color="#FFFDF0" />
      <stop offset="80%" stop-color="#FFF2B3" />
      <stop offset="100%" stop-color="#E8CA65" />
    </linearGradient>
    <linearGradient id="innerShade" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE881" />
      <stop offset="100%" stop-color="#C78A00" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#F5B800" flood-opacity="0.3" />
    </filter>
  </defs>

  <g filter="url(#glow)">
    <!-- Dark Outline Outer Shadow Group -->
    <!-- Back Peel Left -->
    <path d="M 190 280 C 120 280 80 200 110 160 C 130 180 180 230 230 250 Z" 
          fill="url(#goldGradient)" stroke="#3B2600" stroke-width="8" stroke-linejoin="round" />
    <path d="M 110 160 C 120 210 160 255 220 265 C 170 250 130 210 110 160 Z" 
          fill="#8A5A00" opacity="0.6" />

    <!-- Back Peel Right -->
    <path d="M 360 280 C 430 270 460 200 430 160 C 400 190 360 230 310 250 Z" 
          fill="url(#goldGradient)" stroke="#3B2600" stroke-width="8" stroke-linejoin="round" />

    <!-- Central Flesh (Peeled Banana Core) -->
    <path d="M 230 260 C 240 180 280 60 310 30 C 330 30 350 50 350 80 C 340 150 290 260 280 270 Z" 
          fill="url(#fleshGradient)" stroke="#3B2600" stroke-width="8" stroke-linejoin="round" />

    <!-- Flesh Texture Lines -->
    <path d="M 280 70 Q 260 150 250 240" stroke="#E5BA35" stroke-width="3" fill="none" opacity="0.6" />
    <path d="M 310 60 Q 290 150 270 250" stroke="#E5BA35" stroke-width="3" fill="none" opacity="0.6" />
    <path d="M 330 80 Q 310 160 285 245" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.8" />

    <!-- Front Peel Main Fold Left -->
    <path d="M 80 390 C 100 320 200 280 260 280 C 220 320 180 400 130 420 C 100 430 70 420 80 390 Z" 
          fill="url(#goldGradient)" stroke="#3B2600" stroke-width="8" stroke-linejoin="round" />

    <!-- Front Peel Main Fold Right -->
    <path d="M 260 280 C 310 280 380 320 380 390 C 370 430 320 440 280 390 C 265 370 260 320 260 280 Z" 
          fill="url(#goldGradient)" stroke="#3B2600" stroke-width="8" stroke-linejoin="round" />

    <!-- Bottom Stem/Base -->
    <path d="M 80 390 C 60 410 70 430 90 430 C 110 430 130 420 130 420 L 100 450 C 80 455 60 445 65 425 Z" 
          fill="#5C3E00" stroke="#3B2600" stroke-width="6" stroke-linejoin="round" />

    <!-- Inner Peel Shading -->
    <path d="M 260 280 C 240 310 210 330 180 340 C 220 320 250 300 260 280 Z" fill="#FFE57A" />
    <path d="M 260 280 C 280 310 320 330 350 340 C 310 320 280 300 260 280 Z" fill="#FFE57A" />

    <!-- Highlighting -->
    <path d="M 120 350 Q 160 310 230 290" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7" />
    <path d="M 290 290 Q 340 320 360 360" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7" />
  </g>
</svg>`;

async function main() {
  const imagesDir = path.join(process.cwd(), "public", "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Save SVG
  const svgPath = path.join(imagesDir, "banana.svg");
  fs.writeFileSync(svgPath, svgBanana);

  // Convert to PNG with Sharp
  const pngPath = path.join(imagesDir, "banana.png");
  const powerPath = path.join(imagesDir, "power.png");

  await sharp(Buffer.from(svgBanana)).resize(512, 512).png().toFile(pngPath);

  await sharp(Buffer.from(svgBanana)).resize(512, 512).png().toFile(powerPath);

  console.log("Successfully generated banana images in public/images/");
}

main().catch(console.error);
