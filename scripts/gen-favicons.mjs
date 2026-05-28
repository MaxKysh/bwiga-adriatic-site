// One-shot favicon generator. Rasterizes app/icon.svg into:
//   - app/apple-icon.png   (180×180, iOS home-screen)
//   - app/icon-32.png      (32×32, raster fallback for the <link>)
//   - app/favicon.ico      (16/32/48 multi-size, legacy browsers)
//
// Run: node scripts/gen-favicons.mjs
// sharp + png-to-ico are devDeps installed only for this; safe to remove
// after the assets are committed.
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "app", "icon.svg");
const appDir = join(root, "app");

const svg = await readFile(svgPath);

const renderPng = (size) =>
  sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

// Apple touch icon — 180×180, opaque (iOS ignores transparency anyway,
// our SVG already has a solid dark rounded bg).
await writeFile(join(appDir, "apple-icon.png"), await renderPng(180));

// 32×32 raster fallback.
await writeFile(join(appDir, "icon-32.png"), await renderPng(32));

// Multi-size .ico from 16/32/48 PNGs.
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(icoSizes.map(renderPng));
await writeFile(join(appDir, "favicon.ico"), await pngToIco(icoPngs));

console.log("favicons generated: apple-icon.png, icon-32.png, favicon.ico");
