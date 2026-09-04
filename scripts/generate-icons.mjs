#!/usr/bin/env node
/**
 * Rasterizes app/icon.svg into the PNG app icons Next.js's file-based
 * metadata convention picks up automatically (no <link> tags to write by
 * hand). Re-run after editing app/icon.svg or components/layout/logo.tsx's
 * mark.
 *
 * Usage: node scripts/generate-icons.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const svg = readFileSync(path.join(root, "app/icon.svg"));

const targets = [
  { file: "app/apple-icon.png", size: 180 }, // iOS home-screen icon
  { file: "app/icon1.png", size: 512 }, // Next's icon<N> convention — extra high-res PNG icon alongside icon.svg
];

for (const { file, size } of targets) {
  const out = path.join(root, file);
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`wrote ${file} (${size}x${size})`);
}
