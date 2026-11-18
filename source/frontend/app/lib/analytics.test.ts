/**
 * Аналітика не отримує секретів з адрес і вмикається лише змінною збірки.
 *
 * Головне тут — токени: `/report/{token}` дає доступ до купленого звіту,
 * `?token=` на `/reset` — до акаунта. Потрапивши в базу Plausible, вони
 * стали б доступні кожному, хто бачить панель аналітики.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { securityHeaders } from "../../security-headers.mjs";
import { analyticsScript, analyticsUrl } from "./analytics";

const O = "https://crawldy.ai";

describe("секрети не йдуть в аналітику", () => {
  it("токен купленого звіту замінено", () => {
    expect(analyticsUrl(`${O}/report/abc123SECRET`)).toBe(`${O}/report/_TOKEN_`);
  });

  it("токен відновлення пароля в параметрах відкинуто", () => {
    expect(analyticsUrl(`${O}/reset?token=SECRET`)).toBe(`${O}/reset`);
  });

  it("гостьові параметри результату й каси відкинуто", () => {
    const url = analyticsUrl(`${O}/result?audit=1f2e&token=SECRET&lang=de&_ptxn=txn_1`);
    expect(url).toBe(`${O}/result`);
    expect(url).not.toContain("SECRET");
  });

  it("фрагмент відкинуто", () => {
    expect(analyticsUrl(`${O}/pricing#access_token=SECRET`)).toBe(`${O}/pricing`);
  });

  it("utm-параметри лишаються: без них не видно джерела кампанії", () => {
    expect(analyticsUrl(`${O}/de?utm_source=x&token=SECRET&utm_campaign=y`)).toBe(
      `${O}/de?utm_source=x&utm_campaign=y`,
    );
  });
});

describe("ідентифікатори кабінету згорнуто в одну сторінку", () => {
  it("аудит і сайт", () => {
    expect(analyticsUrl(`${O}/app/audits/9b1d-uuid`)).toBe(`${O}/app/audits/_ID_`);
    expect(analyticsUrl(`${O}/app/sites/42`)).toBe(`${O}/app/sites/_ID_`);
  });

  it("сторінки без ідентифікатора не змінюються", () => {
    expect(analyticsUrl(`${O}/app/audits`)).toBe(`${O}/app/audits`);
    expect(analyticsUrl(`${O}/uk/website-audit`)).toBe(`${O}/uk/website-audit`);
  });
});

describe("адмінка не рахується", () => {
  for (const path of ["/admin", "/admin/payments", "/admin/ai?x=1"]) {
    it(path, () => {
      expect(analyticsUrl(`${O}${path}`)).toBeNull();
    });
  }

  it("схожий шлях — не адмінка", () => {
    expect(analyticsUrl(`${O}/administration`)).toBe(`${O}/administration`);
  });
});

describe("вмикається лише справжньою адресою скрипта", () => {
  it("без змінної або з порожньою — вимкнено", () => {
    expect(analyticsScript(undefined)).toBeNull();
    expect(analyticsScript("  ")).toBeNull();
  });

  it("не https або не адреса — вимкнено", () => {
    expect(analyticsScript("http://plausible.io/js/pa-x.js")).toBeNull();
    expect(analyticsScript("crawldy.ai")).toBeNull();
  });

  it("адреса скрипта Plausible — увімкнено", () => {
    expect(analyticsScript("https://plausible.io/js/pa-abc.js")).toBe(
      "https://plausible.io/js/pa-abc.js",
    );
  });

  it("компонент підключено в спільний документ обох коренів", () => {
    const doc = readFileSync(join(__dirname, "..", "document.tsx"), "utf-8");
    expect(doc).toContain("<Analytics />");
  });
});

describe("CSP знає джерело аналітики", () => {
  const report = (analyticsSrc?: string) =>
    securityHeaders({ apiUrl: "https://api.crawldy.ai", analyticsSrc }).find(
      (h) => h.key === "Content-Security-Policy-Report-Only",
    )!.value;

  it("origin скрипта є і в script-src, і в connect-src", () => {
    const csp = report("https://plausible.io/js/pa-abc.js");
    const directive = (name: string) => csp.split("; ").find((d) => d.startsWith(name))!;
    expect(directive("script-src")).toContain("https://plausible.io");
    expect(directive("connect-src")).toContain("https://plausible.io");
    expect(csp).not.toContain("pa-abc.js");
  });

  it("без аналітики CSP та сама, що й до неї", () => {
    expect(report(undefined)).toBe(report(""));
    expect(report(undefined)).not.toContain("plausible");
  });
});
