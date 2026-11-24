/**
 * Видимість Monthly на публічній сторінці цін.
 *
 * ## Рішення живе в конфігурації, а не в коді
 *
 * Публічний активний тариф, який бекенд віддав із живою ціною, —
 * рендериться; непублічний або безпрайсовий — ні. Жодного прапорця в
 * коді, який міг би мовчки сховати налаштований тариф: вітрина
 * підпорядкована каталогу, і зміна каталогу не потребує релізу.
 *
 * Касу підписки тримає той самий каталог: той самий публічний тариф із
 * тим самим прайсом — саме те, що приймає POST /v1/plans/{code}/checkout.
 * Вітрина й каса погоджуються за побудовою.
 */

/** Рівно ті поля публічного тарифу, які потрібні рішенню про показ. */
export interface MonthlyCandidate {
  sort_order: number;
  highlighted: boolean;
  prices: { amount_minor: number | null }[];
}

/** Чи можна цей тариф чесно показати карткою: жива ціна є. */
export function purchasable(plan: MonthlyCandidate): boolean {
  return plan.prices.some((price) => price.amount_minor !== null);
}

/**
 * Який Monthly показувати — або жодного НАЛАШТОВАНОГО.
 *
 * Підсвічений, інакше перший за порядком: на запуску тариф один, і
 * кілька публічних — питання конфігурації, а не верстки.
 *
 * Тариф без живої ціни звідси більше не випадає (рішення власника
 * 2026-09-03). Раніше картка зникала разом із ціною, і сторінка з
 * заголовком «Три варіанти оплати» показувала один блок — тобто
 * суперечила сама собі. Три формати оплати — це СТРУКТУРА продукту, а
 * не наслідок наявності рядка в базі; з конфігурації приходять числа й
 * умови, а не сам факт існування формату. Коли ціни ще немає, картка
 * стоїть і чесно каже про це — `purchasable()` лишається для того, щоб
 * розвести «є число» і «числа поки немає».
 */
export function monthlyToShow<T extends MonthlyCandidate>(
  plans: T[],
): T | null {
  return (
    plans.find((plan) => plan.highlighted) ??
    [...plans].sort((a, b) => a.sort_order - b.sort_order)[0] ??
    null
  );
}

/**
 * Ціна однієї перевірки в пакеті — з налаштованої загальної ціни та
 * кількості, з точністю валюти. Обчислюється, а не зберігається окремим
 * текстом: записане вручну число рано чи пізно розійшлося б із живою
 * ціною. Ділення й округлення — одним кроком, щоб не втратити копійки
 * на проміжному значенні.
 */
export function perAuditAmount(
  amountMinor: number,
  credits: number,
  exponent: number,
): string {
  return (amountMinor / credits / 10 ** exponent).toFixed(exponent);
}

/** Форми множини; локалі без few/many віддають one/other. */
export interface PluralForms {
  one: string;
  few?: string;
  many?: string;
  other: string;
}

/**
 * «{n} перевірок» у правильній формі своєї мови.
 *
 * Категорію обирає `Intl.PluralRules` — стандарт браузера, який знає,
 * що в англійській дві форми, в українській три, а у французькій «один»
 * охоплює й нуль. Закінчення постачає сторінка мови; тут лише вибір.
 * Форми, якої немає, підміняє `other` — незграбний рядок кращий за
 * порожній.
 */
export function pluralize(locale: string, n: number, forms: PluralForms): string {
  const category = new Intl.PluralRules(locale).select(n);
  const bag = forms as unknown as Record<string, string | undefined>;
  const template = bag[category] ?? forms.other;
  return template.replace("{n}", String(n));
}

/** Рівно ті поля пропозиції, за якими розрізняються дві разові. */
export interface SingleCandidate {
  code: string;
  offer_type: string;
  presence_credits: number;
}

/**
 * Дві разові пропозиції: перевірка сайту й вона ж разом із присутністю.
 *
 * Правило одне на весь продукт, і живе воно тут саме тому, що місць
 * вибору два: сторінка цін і пейвол під безкоштовним результатом. Поки
 * це було два окремі фільтри, вони неминуче розійшлися б, і сторінка
 * показувала б одну ціну, а каса брала б іншу.
 *
 * Розрізняються формати кількістю присутності, а не окремим типом
 * пропозиції. Тип назвав би вдруге те, що вже записано числом, і два
 * описи однієї речі розходяться завжди, питання лише коли.
 */
export function singleOffers<T extends SingleCandidate>(
  offers: readonly T[],
): { audit: T | null; withPresence: T | null } {
  const singles = offers.filter((offer) => offer.offer_type === "single");
  return {
    audit: singles.find((offer) => offer.presence_credits === 0) ?? null,
    withPresence: singles.find((offer) => offer.presence_credits > 0) ?? null,
  };
}
