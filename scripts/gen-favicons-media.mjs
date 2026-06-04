// One-shot script: downloads the favicon for every media-mention outlet
// declared in data/content.json into /public/media-favicons/<host>.png.
//
// Why: previously the marquee chips fetched favicons live from Google's
// favicon API (https://www.google.com/s2/favicons?domain=...). That endpoint
// sets ~24 third-party cookies (NID, OSID, COMPASS, ...) per page load,
// tanking the Lighthouse Best Practices score (-30 points on a recent run).
// Same-origin local PNGs eliminate the cookies entirely and load faster
// (no extra DNS / TLS handshake to google.com).
//
// Run: node scripts/gen-favicons-media.mjs
// Re-run after adding new entries to content.json's media_mentions list.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "media-favicons");
await mkdir(outDir, { recursive: true });

const content = JSON.parse(
  await readFile(join(root, "data", "content.json"), "utf8")
);
const mentions = content.about?.media_mentions ?? [];

function hostFromUrl(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

let ok = 0;
let fail = 0;
for (const m of mentions) {
  const host = hostFromUrl(m.url);
  if (!host) {
    console.warn(`  skip (bad URL): ${m.name}`);
    fail++;
    continue;
  }
  const outPath = join(outDir, `${host}.png`);
  // Google favicon API возвращает 64×64 PNG — нам этого хватает (отображаем
  // 18×18). Сохраняем как PNG потому что Google его отдаёт уже как PNG (а не
  // raw .ico). Альтернативно можно качать прямо с сайта (/favicon.ico) но
  // сайты могут отдать ico, redirect'нуть, или вообще не иметь favicon'а.
  const src = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(outPath, buf);
    console.log(`  ✓ ${host}.png (${(buf.length / 1024).toFixed(1)} KB)`);
    ok++;
  } catch (e) {
    console.warn(`  ✗ ${host}: ${e.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} ok, ${fail} failed.`);
