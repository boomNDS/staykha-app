/**
 * Script to generate PNG versions of the icon.svg for social media platforms
 *
 * This script requires sharp to be installed:
 * npm install --save-dev sharp
 *
 * Or run: pnpm add -D sharp
 */

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");
const iconSvgPath = join(publicDir, "icon.svg");

// Social media recommended sizes
const sizes = {
  "og-image": { width: 1200, height: 1200 }, // Square for Open Graph (works well for most platforms)
  "twitter-card": { width: 1200, height: 675 }, // Twitter Card recommended size
  "icon-512": { width: 512, height: 512 }, // Large icon
  "icon-256": { width: 256, height: 256 }, // Medium icon
  "icon-128": { width: 128, height: 128 }, // Small icon
  "icon-light-32x32": { width: 32, height: 32 }, // Favicon light mode
  "icon-dark-32x32": { width: 32, height: 32 }, // Favicon dark mode
  "apple-icon": { width: 180, height: 180 }, // Apple touch icon
};

async function generatePNGs() {
  try {
    console.log("Reading SVG file...");
    const svgBuffer = readFileSync(iconSvgPath);

    console.log("Generating PNG files...");

    for (const [name, { width, height }] of Object.entries(sizes)) {
      const outputPath = join(publicDir, `${name}.png`);

      // For light/dark mode icons, use appropriate background
      let backgroundColor = { r: 14, g: 116, b: 144, alpha: 1 }; // #0E7490 brand color (default)

      if (name === "icon-light-32x32") {
        backgroundColor = { r: 14, g: 116, b: 144, alpha: 1 }; // #0E7490 for light mode
      } else if (name === "icon-dark-32x32") {
        backgroundColor = { r: 14, g: 116, b: 144, alpha: 1 }; // #0E7490 for dark mode (same for now)
      }

      await sharp(svgBuffer)
        .resize(width, height, {
          fit: "contain",
          background: backgroundColor,
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${name}.png (${width}x${height})`);
    }

    console.log("\n✅ All PNG files generated successfully!");
    console.log("\nGenerated files:");
    Object.entries(sizes).forEach(([name, { width, height }]) => {
      console.log(`  - ${name}.png (${width}x${height})`);
    });
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND" && error.message.includes("sharp")) {
      console.error("\n❌ Error: sharp is not installed.");
      console.error("\nPlease install it by running:");
      console.error("  pnpm add -D sharp");
      console.error("  or");
      console.error("  npm install --save-dev sharp");
      process.exit(1);
    } else {
      console.error("Error generating PNGs:", error);
      process.exit(1);
    }
  }
}

generatePNGs();
