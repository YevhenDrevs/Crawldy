/**
 * Логотипи віддаються у WebP, а PNG лишаються першоджерелом.
 *
 * Перевіряється те, що мовчки ламається: новий PNG без перегенерованого
 * WebP (браузер отримав би 404 на `<source>` і стару картинку ніде), і
 * зникнення `display: contents`, без якого `<picture>` стає flex-елементом
 * замість `<img>` і шапка зʼїжджає.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const FRONTEND = join(__dirname, "..", "..");
const BRAND = join(FRONTEND, "public", "brand");
const brand = readFileSync(join(__dirname, "Brand.tsx"), "utf-8");

const pngs = readdirSync(BRAND).filter((f) => /^crawldy-.*\.png$/.test(f));

describe("кожен PNG логотипа має WebP поруч", () => {
  it("PNG знайдено", () => {
    expect(pngs.length).toBeGreaterThanOrEqual(4);
  });

  for (const png of pngs) {
    it(`${png} → ${png.replace(/\.png$/, ".webp")}`, () => {
      expect(existsSync(join(BRAND, png.replace(/\.png$/, ".webp")))).toBe(true);
    });
  }
});

describe("Brand.tsx віддає WebP із запасним PNG", () => {
  it("одна обгортка <picture> з джерелом image/webp", () => {
    expect(brand).toContain('<source type="image/webp" srcSet={asset.webp} />');
    expect(brand).toContain("src={asset.png}");
  });

  it("обгортка не стає flex-елементом", () => {
    expect(brand).toContain('<picture style={{ display: "contents" }}>');
  });

  it("усі чотири логотипи йдуть через спільну обгортку", () => {
    expect(brand.match(/<BrandImage\b/g)?.length).toBe(4);
    // Лише справжні теги, не згадки `<img>` у коментарях.
    expect(brand.match(/<img\s+src=/g)?.length).toBe(1);
  });

  it("OG-картка лишається на PNG", () => {
    const page = readFileSync(join(FRONTEND, "app", "[[...path]]", "page.tsx"), "utf-8");
    expect(page).toContain("/brand/crawldy-vertical.png");
  });
});
