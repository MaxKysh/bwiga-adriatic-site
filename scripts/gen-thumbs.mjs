// One-shot thumbnail generator. Reads source images from /public/event-photos
// and /public/place-photos, writes 232×124 webp thumbnails into
// /public/event-photos/thumbs/ and /public/place-photos/thumbs/ respectively.
//
// Rationale: gallery thumbnail buttons display 116×62 (or smaller). Loading
// the full-resolution source (1920×1031, ~400 KB each, ×21 = ~3 MB) just to
// downscale in CSS wastes bandwidth and decode time. Lighthouse flagged this
// as "image delivery savings ~2.9 MB" on desktop, similar on mobile.
//
// Output: 232px wide (2x display size for retina), webp quality 78, ~10-15 KB
// each. Total thumb payload: ~0.3 MB vs 3 MB original.
//
// Run: node scripts/gen-thumbs.mjs

import sharp from "sharp";
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const THUMB_WIDTH = 232; // 2× display width (116px)

async function processDir(srcRel) {
  const srcDir = join(root, "public", srcRel);
  const outDir = join(srcDir, "thumbs");
  await mkdir(outDir, { recursive: true });

  const files = await readdir(srcDir);
  const images = files.filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));

  let totalIn = 0;
  let totalOut = 0;

  for (const file of images) {
    const inPath = join(srcDir, file);
    const outName = `${basename(file, extname(file))}.webp`;
    const outPath = join(outDir, outName);

    const inBuf = await readFile(inPath);
    totalIn += inBuf.length;

    const outBuf = await sharp(inBuf)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    await writeFile(outPath, outBuf);
    totalOut += outBuf.length;

    const ratio = ((outBuf.length / inBuf.length) * 100).toFixed(1);
    console.log(
      `  ${file} → thumbs/${outName}: ` +
        `${(inBuf.length / 1024).toFixed(1)} KB → ` +
        `${(outBuf.length / 1024).toFixed(1)} KB (${ratio}%)`
    );
  }

  console.log(
    `${srcRel}: ${images.length} images, ` +
      `${(totalIn / 1024 / 1024).toFixed(2)} MB → ` +
      `${(totalOut / 1024 / 1024).toFixed(2)} MB`
  );
}

console.log("Generating gallery thumbnails...\n");
await processDir("event-photos");
console.log();
await processDir("place-photos");
console.log("\nDone.");
