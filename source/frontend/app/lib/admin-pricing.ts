/**
 * Службова сторінка цін: перетворення між формою й каталогом.
 *
 * Чиста логіка без React і без мережі — щоб правила продукту можна було
 * перевірити тестом, а не поглядом на екран.
 *
 * ## Що тут вирішено раз і назавжди
 *
 * - **Разова** — рівно 1 повна перевірка. Таких пропозицій дві: сама
 *   перевірка й перевірка разом з 1 Actual AI Presence. Склад обох
 *   фіксований форматом, тож форма його не питає й не дає змінити.
 * - **Пакет** — дві незалежні кількості: перевірок і Presence. До
 *   6 вересня 2026 їх задавало одне число N; власник розвів їх, бо
 *   клієнт витрачає ці одиниці окремо, і пакет може містити, скажімо,
 *   десять перевірок і три Presence. Ціна однієї перевірки не
 *   зберігається — вона обчислюється з загальної й кількості перевірок.
 * - **Місячний план** — необмежені повні перевірки й місячний період за
 *   означенням; окремо налаштовується лише кількість Presence на місяць.
 *
 * ## Суми
 *
 * Людина вводить звичайні одиниці («19», «19.90»), каталог зберігає
 * мінімальні (1900). Кількість знаків бере валюта, а не припущення про
 * центи: у єни їх нуль, у динара Бахрейну три. Дані стандарту дає
 * `Intl.NumberFormat` — той самий CLDR, що й у бекенда за ISO 4217.
 */

import type { AdminOffer, AdminPlan } from "./contracts";

export const SINGLE_CODE = "single";
export const SINGLE_AUDIT_CODE = "single-audit";
export const PACK_CODE = "pack";
export const MONTHLY_CODE = "monthly";

/**
 * Разових пропозицій дві, і різняться вони рівно кількістю Presence.
 *
 * Сама перевірка коштує нам нуль, тож продається окремо й дешевше;
 * варіант із Presence додає до неї вимірювання згадок бренду, за яке ми
 * платимо провайдерам моделей (рішення власника 2026-11-24).
 *
 * Сторінка цін розводить їх за кількістю Presence, а не за кодом. Код —
 * ідентифікатор запису каталогу, і вʼязати на нього подання означало б
 * перейменовувати продукт разом із рядком бази. Та сама причина, через
 * яку рекомендації аудиту групуються за `issue_key`, а не за ключем
 * каталогу повідомлень.
 */
const SINGLE_KINDS = {
  "single-audit": { code: SINGLE_AUDIT_CODE, presence: 0, sortOrder: 1 },
  single: { code: SINGLE_CODE, presence: 1, sortOrder: 2 },
} as const;

/** Котра з двох разових. Пакет і тариф — окремі види, не різновиди. */
export type SingleKind = keyof typeof SINGLE_KINDS;

/**
 * Як формат зветься для команди — і на картці адмінки, і в каталозі.
 *
 * Це внутрішня мітка: публічна сторінка цін має власні підписи шістьма
 * мовами й `display_name` не показує взагалі. Одне джерело на обидва
 * місця саме тому, що розійтися їм нема за чим.
 */
export const SINGLE_LABEL: Record<SingleKind | "pack", string> = {
  "single-audit": "Разова перевірка",
  single: "Разова перевірка з AI Presence",
  pack: "Пакет перевірок",
};

/** Скільки знаків після коми має валюта. Невідома — два, як у бекенда. */
export function currencyExponent(currency: string): number {
  try {
    // `maximumFractionDigits` необовʼязкове в типі опцій, хоч для стилю
    // currency воно є завжди: дефолт лишається тим самим, що в бекенда.
    const digits = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).resolvedOptions().maximumFractionDigits;
    return typeof digits === "number" ? digits : 2;
  } catch {
    return 2;
  }
}

/** Мінімальні одиниці → рядок для поля вводу. Порожньо, якщо ціни немає. */
export function toAmountField(minor: number | null, currency: string): string {
  if (minor === null) return "";
  const exponent = currencyExponent(currency);
  return (minor / 10 ** exponent).toFixed(exponent);
}

/**
 * Рядок із поля → мінімальні одиниці. `null` — порожнє поле, тобто «ціни
 * ще немає»; це легальний стан, і сторінка цін скаже «ціна за запитом».
 * Помилка — окремо від нуля: 0 є валідною сумою, а «дев'ятнадцять» ні.
 */
export function fromAmountField(
  value: string,
  currency: string,
): { minor: number | null } | { error: "not_a_number" | "negative" | "too_precise" } {
  const text = value.trim().replace(",", ".");
  if (text === "") return { minor: null };
  if (!/^\d+(\.\d+)?$/.test(text)) return { error: "not_a_number" };
  const amount = Number(text);
  if (!Number.isFinite(amount)) return { error: "not_a_number" };
  if (amount < 0) return { error: "negative" };
  const exponent = currencyExponent(currency);
  const scaled = amount * 10 ** exponent;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-6) return { error: "too_precise" };
  return { minor: Math.round(scaled) };
}

/** Ціна однієї перевірки в пакеті — те, що покаже сторінка цін. */
export function packUnitPreview(minor: number | null, count: number, currency: string): string {
  if (minor === null || count < 2) return "";
  const exponent = currencyExponent(currency);
  return `${(minor / count / 10 ** exponent).toFixed(exponent)} ${currency.toUpperCase()}`;
}

/**
 * Порожня пропозиція потрібного виду — коли в каталозі її ще немає.
 *
 * Провайдер приходить із конфігурації, а не з форми: він один на всі
 * ціни, і повторювати його біля кожної означало б дозволити трьом
 * пропозиціям розійтися між собою (рішення власника 2026-09-05).
 */
export function blankOffer(kind: SingleKind | "pack", provider: string): AdminOffer {
  // Вид покупки й вид пропозиції — різні речі: разових форматів два, а
  // `offer_type` у каталозі лишається один, бо обидва продають рівно
  // одну перевірку.
  const shape = kind === "pack" ? null : SINGLE_KINDS[kind];
  return {
    code: shape ? shape.code : PACK_CODE,
    offer_type: shape ? "single" : "pack",
    active: true,
    display_name: SINGLE_LABEL[kind],
    description: "",
    provider,
    // Порожньо: справжнє посилання на прайс вводить адміністратор, і
    // вигаданий рядок тут лише вдавав би налаштовану пропозицію.
    provider_price_ref: "",
    currency: "USD",
    display_amount_minor: null,
    // Склад разової фіксований; у пакета кількість задає адміністратор.
    audit_credits: shape ? 1 : 10,
    presence_credits: shape ? shape.presence : 10,
    promo_eligible: shape === null,
    sort_order: shape ? shape.sortOrder : 3,
    display_name_i18n: {},
    description_i18n: {},
  };
}

/** Порожній місячний тариф. Права — мінімальний робочий набір. */
export function blankPlan(provider: string): AdminPlan {
  return {
    code: MONTHLY_CODE,
    name: "Місячний план",
    description: "",
    is_public: true,
    archived: false,
    sort_order: 1,
    entitlements: {
      sites_limit: 10,
      report_download: true,
      // Повні перевірки місячного плану необмежені за означенням.
      audits_per_period: null,
      max_pages_per_audit: 50,
      presence_per_period: 5,
    },
    prices: [
      {
        provider,
        provider_price_id: "",
        currency: "USD",
        interval: "month",
        display_amount_minor: null,
      },
    ],
    name_i18n: {},
    description_i18n: {},
  };
}

/** Кількість перевірок Presence на місяць із прав тарифу. */
export function monthlyPresence(plan: AdminPlan): number {
  const value = plan.entitlements.presence_per_period;
  return typeof value === "number" && value > 0 ? value : 0;
}

/** Місячна ціна тарифу — перший місячний рядок прайсу. */
export function monthlyPrice(plan: AdminPlan): AdminPlan["prices"][number] | null {
  return plan.prices.find((price) => price.interval === "month") ?? plan.prices[0] ?? null;
}

/**
 * Разова з формою: склад фіксований, змінюються лише гроші й посилання.
 *
 * Обидва різновиди проходять тут одним тілом, бо відрізняються рівно
 * кодом і кількістю Presence. Дві копії функції розійшлися б на першій
 * же правці правила, яке стосується обох.
 */
function fixedSinglePayload(
  base: AdminOffer,
  form: { amountMinor: number | null; currency: string },
  shape: { code: string; presence: number },
): AdminOffer {
  return {
    ...base,
    code: shape.code,
    offer_type: "single",
    // Формат оплати існує незалежно від того, чи заведено ціну, і
    // ховати його прапорцем нема з чого: сторінка цін показує всі
    // чотири блоки завжди (рішення власника 2026-09-05).
    active: true,
    // Провайдер і посилання на прайс лишаються тими, що вже в каталозі:
    // форма їх не питає — вони належать налаштуванню провайдера, а не
    // ціні (рішення власника 2026-09-05).
    provider: base.provider,
    provider_price_ref: base.provider_price_ref,
    currency: form.currency.toUpperCase(),
    display_amount_minor: form.amountMinor,
    audit_credits: 1,
    presence_credits: shape.presence,
  };
}

/** Разова перевірка разом з Actual AI Presence. */
export function singlePayload(
  base: AdminOffer,
  form: { amountMinor: number | null; currency: string },
): AdminOffer {
  return fixedSinglePayload(base, form, SINGLE_KINDS.single);
}

/** Разова перевірка без Presence — та, що коштує нам нуль. */
export function singleAuditPayload(
  base: AdminOffer,
  form: { amountMinor: number | null; currency: string },
): AdminOffer {
  return fixedSinglePayload(base, form, SINGLE_KINDS["single-audit"]);
}

/** Пакет із формою: дві кількості, незалежні одна від одної. */
export function packPayload(
  base: AdminOffer,
  form: {
    amountMinor: number | null;
    count: number;
    presence: number;
    currency: string;
  },
): AdminOffer {
  return {
    ...base,
    code: PACK_CODE,
    offer_type: "pack",
    active: true,
    provider: base.provider,
    provider_price_ref: base.provider_price_ref,
    currency: form.currency.toUpperCase(),
    display_amount_minor: form.amountMinor,
    audit_credits: form.count,
    presence_credits: form.presence,
  };
}

/** Тариф із формою: права зберігаються, змінюється лише Presence і ціна. */
export function monthlyPayload(
  base: AdminPlan,
  form: {
    amountMinor: number | null;
    presence: number;
    currency: string;
  },
): AdminPlan {
  const price = monthlyPrice(base);
  if (price === null) throw new Error("тариф без рядка ціни");
  return {
    ...base,
    code: MONTHLY_CODE,
    is_public: true,
    entitlements: {
      ...base.entitlements,
      // Безліміт — властивість формату, а не налаштування: у правах він
      // записаний як «немає межі», і форма цього не питає.
      audits_per_period: null,
      presence_per_period: form.presence,
    },
    prices: [
      {
        // Провайдер і посилання лишаються з наявного рядка ціни.
        ...price,
        currency: form.currency.toUpperCase(),
        interval: "month",
        display_amount_minor: form.amountMinor,
      },
    ],
  };
}


/** Що не так із формою пакета. Порожньо — можна зберігати. */
export function packProblem(
  count: number,
  presence: number,
): "too_few" | "presence_negative" | null {
  if (count < 2) return "too_few";
  // Нуль присутності легальний: пакет може продавати самі перевірки, і
  // сторінка цін тоді просто не покаже про них рядка. Відʼємне число —
  // не «нічого не входить», а зіпсоване поле.
  if (!Number.isFinite(presence) || presence < 0) return "presence_negative";
  return null;
}
