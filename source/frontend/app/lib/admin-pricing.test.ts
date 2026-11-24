/**
 * Службова сторінка цін: форма не вигадує складу пропозицій.
 *
 * Правила продукту: разова — завжди 1 перевірка, і таких форматів два,
 * сама перевірка й перевірка з 1 Actual AI Presence (власник,
 * 2026-11-24); пакет — дві незалежні кількості (власник, 2026-09-06);
 * місячний план — безліміт і місячний період за означенням, окремо лише
 * кількість Presence. Порожня ціна легальна.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SINGLE_AUDIT_CODE,
  SINGLE_CODE,
  SINGLE_LABEL,
  blankOffer,
  blankPlan,
  currencyExponent,
  fromAmountField,
  monthlyPayload,
  monthlyPresence,
  monthlyPrice,
  packPayload,
  packProblem,
  packUnitPreview,
  singleAuditPayload,
  singlePayload,
  toAmountField,
} from "./admin-pricing";

describe("суми: звичайні одиниці ↔ мінімальні", () => {
  it("показник бере валюта, а не припущення про центи", () => {
    expect(currencyExponent("USD")).toBe(2);
    expect(currencyExponent("JPY")).toBe(0);
    expect(currencyExponent("BHD")).toBe(3);
    // Невідома валюта не валить форму: два знаки, як у бекенда.
    expect(currencyExponent("ZZZ")).toBe(2);
  });

  it("поле → каталог", () => {
    expect(fromAmountField("19", "USD")).toEqual({ minor: 1900 });
    expect(fromAmountField("19.90", "USD")).toEqual({ minor: 1990 });
    expect(fromAmountField("19,90", "USD")).toEqual({ minor: 1990 });
    expect(fromAmountField("4900", "JPY")).toEqual({ minor: 4900 });
    // Порожньо — це «ціни ще немає», а не нуль і не помилка.
    expect(fromAmountField("", "USD")).toEqual({ minor: null });
    expect(fromAmountField("0", "USD")).toEqual({ minor: 0 });
  });

  it("непридатне значення називається своїм словом", () => {
    expect(fromAmountField("дев'ятнадцять", "USD")).toEqual({ error: "not_a_number" });
    expect(fromAmountField("-5", "USD")).toEqual({ error: "not_a_number" });
    expect(fromAmountField("19.999", "USD")).toEqual({ error: "too_precise" });
    expect(fromAmountField("49.5", "JPY")).toEqual({ error: "too_precise" });
  });

  it("каталог → поле", () => {
    expect(toAmountField(1900, "USD")).toBe("19.00");
    expect(toAmountField(4900, "JPY")).toBe("4900");
    expect(toAmountField(null, "USD")).toBe("");
  });
});

describe("разова: склад фіксований, форма його не питає", () => {
  it("одна перевірка й одна Presence незалежно від того, що прийшло", () => {
    const legacy = { ...blankOffer("single", "paddle"), audit_credits: 7, presence_credits: 0 };
    const saved = singlePayload(legacy, {
      amountMinor: 1900, currency: "usd",
    });
    expect(saved.audit_credits).toBe(1);
    expect(saved.presence_credits).toBe(1);
    expect(saved.display_amount_minor).toBe(1900);
    expect(saved.currency).toBe("USD");
    expect(saved.offer_type).toBe("single");
  });

  it("порожня ціна зберігається як «ціни немає»", () => {
    const saved = singlePayload(blankOffer("single", "paddle"), {
      amountMinor: null, currency: "USD",
    });
    expect(saved.display_amount_minor).toBeNull();
    expect(saved.audit_credits).toBe(1);
  });
});

describe("разових форматів два, і різняться вони лише Presence", () => {
  it("перевірка без Presence зберігається з нулем, а не з одиницею", () => {
    const saved = singleAuditPayload(blankOffer("single-audit", "paddle"), {
      amountMinor: 1000, currency: "USD",
    });
    expect(saved.presence_credits).toBe(0);
    expect(saved.audit_credits).toBe(1);
    expect(saved.offer_type).toBe("single");
    expect(saved.code).toBe(SINGLE_AUDIT_CODE);
  });

  it("це два РІЗНІ записи каталогу, бо в них різні ціни й різні прайси", () => {
    expect(SINGLE_AUDIT_CODE).not.toBe(SINGLE_CODE);
    const audit = singleAuditPayload(blankOffer("single-audit", "paddle"), {
      amountMinor: 1000, currency: "USD",
    });
    const withPresence = singlePayload(blankOffer("single", "paddle"), {
      amountMinor: 2000, currency: "USD",
    });
    expect(audit.code).not.toBe(withPresence.code);
    // Усе, крім коду й Presence, у них однакове: різниця не комерційна.
    expect(audit.audit_credits).toBe(withPresence.audit_credits);
    expect(audit.offer_type).toBe(withPresence.offer_type);
    expect(audit.promo_eligible).toBe(withPresence.promo_eligible);
  });

  it("сторінка цін ставить дешевшу першою — каталог теж", () => {
    expect(blankOffer("single-audit", "paddle").sort_order)
      .toBeLessThan(blankOffer("single", "paddle").sort_order);
    expect(blankOffer("single", "paddle").sort_order)
      .toBeLessThan(blankOffer("pack", "paddle").sort_order);
  });

  it("форма не вигадує складу й тому, хто прийшов із чужими числами", () => {
    // Запис, збережений до поділу форматів, несе 1 Presence. Збереження
    // через картку «без Presence» мусить дати нуль, а не лишити старе.
    const legacy = { ...blankOffer("single", "paddle"), presence_credits: 1 };
    expect(singleAuditPayload(legacy, { amountMinor: 1000, currency: "USD" }).presence_credits)
      .toBe(0);
  });

  it("обидва формати на екрані, і підпис у них один на двох із каталогом", () => {
    const source = readFileSync(join(__dirname, "..", "(product)", "admin", "page.tsx"), "utf-8");
    expect(source).toContain('blankOffer("single-audit", provider)');
    expect(source).toContain('blankOffer("single", provider)');
    expect(source).toContain('<SingleCard kind="single-audit"');
    expect(source).toContain('<SingleCard kind="single"');
    // Порядок карток той самий, що бачить покупець.
    expect(source.indexOf('kind="single-audit"')).toBeLessThan(source.indexOf('kind="single"'));
    // Підписи беруться з каталогу міток, а не пишуться в розмітці: два
    // джерела однієї назви розійшлися б на першому ж перейменуванні.
    expect(source).toContain("title={SINGLE_LABEL[kind]}");
    expect(source).not.toContain('title="Разова перевірка"');
    expect(SINGLE_LABEL["single-audit"]).not.toBe(SINGLE_LABEL.single);
  });

  it("приклад у полі ціни не прикидається рекомендованою ціною", () => {
    const source = readFileSync(join(__dirname, "..", "(product)", "admin", "page.tsx"), "utf-8");
    // Обидві разові картки показують той самий приклад формату. Різні
    // числа в них читалися б як «от скільки це має коштувати».
    expect(source).toContain("placeholder={AMOUNT_EXAMPLE}");
    expect(source).not.toContain('placeholder="10.00"');
    expect(source).not.toContain('placeholder="20.00"');
  });
});

describe("пакет: дві незалежні кількості", () => {
  it("перевірки й присутність зберігаються окремими числами", () => {
    const saved = packPayload(blankOffer("pack", "paddle"), {
      amountMinor: 14900, count: 10, presence: 3, currency: "USD",
    });
    expect(saved.audit_credits).toBe(10);
    expect(saved.presence_credits).toBe(3);
  });

  it("пакет без присутності легальний: нуль зберігається як нуль", () => {
    const saved = packPayload(blankOffer("pack", "paddle"), {
      amountMinor: 14900, count: 10, presence: 0, currency: "USD",
    });
    expect(saved.presence_credits).toBe(0);
  });

  it("менше двох перевірок — не пакет", () => {
    expect(packProblem(1, 1)).toBe("too_few");
    expect(packProblem(2, 0)).toBeNull();
  });

  it("відʼємна присутність — зіпсоване поле, а не «нічого не входить»", () => {
    expect(packProblem(10, -1)).toBe("presence_negative");
    expect(packProblem(10, Number.NaN)).toBe("presence_negative");
  });

  it("ціна за одну перевірку показується обчисленою, а не полем", () => {
    expect(packUnitPreview(14900, 10, "USD")).toBe("14.90 USD");
    expect(packUnitPreview(900, 10, "USD")).toBe("0.90 USD");
    // Без ціни або без пакета показувати нема чого.
    expect(packUnitPreview(null, 10, "USD")).toBe("");
    expect(packUnitPreview(14900, 1, "USD")).toBe("");
  });
});

describe("місячний план: безліміт і період — не поля форми", () => {
  it("права зберігаються, змінюється лише Presence; перевірки лишаються безлімітними", () => {
    const base = blankPlan("paddle");
    const saved = monthlyPayload(base, {
      amountMinor: 4900, presence: 5, currency: "USD",
    });
    expect(saved.entitlements.presence_per_period).toBe(5);
    expect(saved.entitlements.audits_per_period).toBeNull();
    expect(saved.entitlements.sites_limit).toBe(base.entitlements.sites_limit);
    expect(saved.entitlements.max_pages_per_audit).toBe(base.entitlements.max_pages_per_audit);
    expect(monthlyPrice(saved)?.display_amount_minor).toBe(4900);
    expect(monthlyPrice(saved)?.interval).toBe("month");
  });

  it("кількість Presence читається з прав тарифу", () => {
    expect(monthlyPresence(blankPlan("paddle"))).toBe(5);
    const empty = { ...blankPlan("paddle"), entitlements: { presence_per_period: null } };
    expect(monthlyPresence(empty)).toBe(0);
  });

  it("ані провайдера, ані посилання на прайс біля цін не питають", () => {
    const source = readFileSync(join(__dirname, "..", "(product)", "admin", "page.tsx"), "utf-8");
    const logic = readFileSync(join(__dirname, "admin-pricing.ts"), "utf-8");
    // Обидва належать налаштуванню провайдера, а не ціні, і в жодній
    // картці не зʼявляються (рішення власника 2026-09-05).
    expect(source).not.toContain('label="Провайдер"');
    expect(source).not.toContain('label="Посилання на прайс"');
    // Наявна пропозиція лишає своє: форма нічого з цього не переписує.
    expect(logic).not.toContain("provider: form.provider");
    expect(logic).not.toContain("provider_price_ref: form.ref");
    expect(logic).toContain("provider_price_ref: base.provider_price_ref");
    // Для НОВОЇ пропозиції провайдер береться з конфігурації каси.
    expect(source).toContain("readCheckoutConfig()");
    expect(source).toContain('blankOffer("single", provider)');
    for (const hardcoded of ['"fake"', "local_single", "local_pack", "local_monthly"]) {
      expect(source, hardcoded).not.toContain(hardcoded);
      expect(logic, hardcoded).not.toContain(hardcoded);
    }
  });


  it("формат показується завжди: прапорця видимості немає", () => {
    const source = readFileSync(join(__dirname, "..", "(product)", "admin", "page.tsx"), "utf-8");
    const logic = readFileSync(join(__dirname, "admin-pricing.ts"), "utf-8");
    expect(source).not.toContain("Показувати на сторінці цін");
    expect(source).not.toContain('type="checkbox"');
    // Збереження завжди робить формат видимим — ховати його нема з чого.
    expect(logic).toContain("active: true");
    expect(logic).toContain("is_public: true");
    expect(logic).not.toContain("form.active");
    expect(logic).not.toContain("form.isPublic");
    expect(
      singlePayload({ ...blankOffer("single", "paddle"), active: false }, {
        amountMinor: 1900, currency: "USD",
      }).active,
    ).toBe(true);
    expect(
      monthlyPayload({ ...blankPlan("paddle"), is_public: false }, {
        amountMinor: 4900, presence: 5, currency: "USD",
      }).is_public,
    ).toBe(true);
  });

  it("сторінка не пояснює себе абзацом під заголовком", () => {
    const source = readFileSync(join(__dirname, "..", "(product)", "admin", "page.tsx"), "utf-8");
    expect(source).not.toContain("Суми й кількості для сторінки цін");
  });

  it("ціна за одну перевірку стоїть під самою ціною пакета", () => {
    const source = readFileSync(join(__dirname, "..", "(product)", "admin", "page.tsx"), "utf-8");
    expect(source).toContain('<Field label="Ціна пакета" hint={unit ? `${unit} за одну перевірку` : undefined}>');
    // Окремої клітки сітки під неї більше немає.
    expect(source).not.toContain('<span className="text-muted">Ціна за одну перевірку</span>');
  });

  it("форма не вводить ані стану безліміту, ані періоду оплати", () => {
    const source = readFileSync(join(__dirname, "..", "(product)", "admin", "page.tsx"), "utf-8");
    for (const field of ["analyses_unlimited", "audits_per_period", "interval:", "billing_period"]) {
      expect(source, field).not.toContain(field);
    }
    // Жодного присвоєння складу: його робить `admin-pricing.ts` за
    // правилами продукту, а не екран за введеним числом.
    expect(source).not.toMatch(/audit_credits:\s/);
    expect(source).not.toMatch(/presence_credits:\s/);
    // Обидві кількості пакета читаються з каталогу — це заповнення полів
    // наявними значеннями, а не вибір складу.
    expect(source).toContain("String(offer.audit_credits)");
    expect(source).toContain("String(offer.presence_credits)");
  });
});

describe("сторінка живе поза кабінетом і не змінює його", () => {
  it("власна оболонка, власна перевірка ролі", () => {
    const layout = readFileSync(join(__dirname, "..", "(product)", "admin", "layout.tsx"), "utf-8");
    expect(layout).toContain("isStaff");
    expect(layout).toContain("platform_role");
    // Посилання в кабінет клієнта зі службової сторінки немає: окремий
    // кабінет адміністраторові не потрібен (рішення власника).
    const header = layout.slice(layout.indexOf("<header"), layout.indexOf("</header>"));
    expect(header).not.toContain('href="/app"');
    // Кабінетної оболонки тут немає — інакше службовий екран тягнув би
    // за собою меню клієнта.
    expect(layout).not.toContain("AppShell");
  });

  it("меню кабінету не згадує службової сторінки", () => {
    const shell = readFileSync(join(__dirname, "..", "components", "AppShell.tsx"), "utf-8");
    expect(shell).not.toContain("/admin");
    expect(shell).not.toContain("platform_role");
  });
});
