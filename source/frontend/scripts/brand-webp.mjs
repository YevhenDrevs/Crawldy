/**
 * PNG логотипів → WebP поруч, без втрат.
 *
 * Першоджерело — PNG у `public/brand/`: це файли дизайнера, і саме їх
 * беруть OG-картка й Word-звіт. WebP — похідна для сторінок сайту, вдвічі
 * легша при тих самих пікселях (`lossless`), тож знак не міняється ні на
 * піксель.
 *
 * Ідемпотентний: перезаписує `.webp` з поточних PNG щоразу. Запускати після
 * будь-якої зміни PNG:
 *
 *     node scripts/brand-webp.mjs
 *
 * `sharp` приходить разом із `next`, окремої залежності не потрібно.
 */

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const BRAND = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "brand");

const pngs = (await readdir(BRAND)).filter((f) => /^crawldy-.*\.png$/.test(f)).sort();
if (pngs.length === 0) {
  console.error(`У ${BRAND} немає crawldy-*.png`);
  process.exit(1);
}

for (const png of pngs) {
  const src = path.join(BRAND, png);
  const out = src.replace(/\.png$/, ".webp");
  await sharp(src).webp({ lossless: true, effort: 6 }).toFile(out);
  const before = (await stat(src)).size;
  const after = (await stat(out)).size;
  const saved = Math.round((1 - after / before) * 100);
  console.log(`${png} ${before} → ${path.basename(out)} ${after} (−${saved}%)`);
}
