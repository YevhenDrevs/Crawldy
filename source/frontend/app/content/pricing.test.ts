/**
 * Сторінка цін: точні заголовки й рядки власника в шести мовах, і
 * жодного числа, написаного руками.
 *
 * Тест читає ВИХІДНИЙ КОД сторінок і компонента, а не рендер: числа
 * приходять із конфігурації бекенда під час виконання, тож єдине, що
 * можна стерегти статично, — це щоб у файлах їх не було взагалі, а
 * структура й слова збігалися з погодженими.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const DIR = join(__dirname, "pricing");
const COMPONENT = join(__dirname, "..", "components", "PricingCards.tsx");
const LOCALES = ["en", "uk", "de", "es", "fr", "ru"] as const;

function code(locale: string): string {
  return readFileSync(join(DIR, `${locale}.tsx`), "utf-8")
    .replace(/\r\n/g, "\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const component = readFileSync(COMPONENT, "utf-8")
  .replace(/\r\n/g, "\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const LINES = join(__dirname, "..", "lib", "pricing-lines.ts");
const lines = readFileSync(LINES, "utf-8")
  .replace(/\r\n/g, "\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

const H1: Record<string, string> = {
  en: "How much does a website analysis cost?",
  uk: "Скільки коштує перевірка сайту",
  de: "Was kostet eine Website-Analyse?",
  es: "¿Cuánto cuesta analizar un sitio web?",
  fr: "Combien coûte l’analyse d’un site ?",
  ru: "Сколько стоит проверка сайта",
};

/**
 * Затверджене пояснення під H1.
 *
 * Переписане 2026-11-23 разом зі складом карток. Старе казало, що в усіх
 * платних варіантах звіт однаковий, і це перестало бути правдою тієї
 * хвилини, коли присутність стала окремим форматом за окрему ціну.
 */
const LEAD: Record<string, string> = {
  en: "A single analysis gives you the full report on your site. The AI Presence option adds a check of whether AI assistants mention your brand. The pack and the monthly plan offer the same analyses at lower rates.",
  uk: "Разова перевірка дає повний звіт по вашому сайту. Варіант із AI Presence додає до нього перевірку того, чи згадують ваш бренд ШІ-асистенти. У пакеті й місячному плані перевірки за зниженими тарифами.",
  de: "Die Einzelanalyse liefert den vollständigen Bericht zu Ihrer Website. Die Variante mit AI Presence prüft zusätzlich, ob KI-Assistenten Ihre Marke nennen. Paket und Monatsplan bieten dieselben Analysen zu günstigeren Sätzen.",
  es: "El análisis individual ofrece el informe completo de tu sitio. La opción con AI Presence añade la comprobación de si los asistentes de IA mencionan tu marca. El paquete y el plan mensual ofrecen los mismos análisis a tarifas más bajas.",
  fr: "L’analyse unique fournit le rapport complet de votre site. La formule avec AI Presence y ajoute la vérification des mentions de votre marque par les assistants IA. Le pack et le forfait mensuel proposent les mêmes analyses à des tarifs réduits.",
  ru: "Разовая проверка даёт полный отчёт по вашему сайту. Вариант с AI Presence добавляет к нему проверку того, упоминают ли ваш бренд ИИ-ассистенты. В пакете и месячном плане проверки по сниженным тарифам.",
};

/**
 * Друга разова: назва, чотири рядки переліку, дія.
 *
 * Картки безкоштовного превʼю на сторінці цін більше немає (власник,
 * 2026-11-23). Її місце займає саме цей формат, тож таблиця стоїть там
 * само й перевіряє те саме, тільки про інший блок.
 *
 * Перший рядок переліку посилається на сусідню картку, решта три
 * описують присутність. Назви чотирьох асистентів тут навмисно
 * дослівні: людина має впізнати ті, якими користується.
 */
const PRESENCE: Record<string, [string, string[], string]> = {
  en: ["Single analysis with AI Presence", ["Everything in the single analysis", "Measured mentions of your brand in ChatGPT, Claude, Gemini and Perplexity", "Model answers checked on the questions customers ask most", "Separate AI Presence report to download"], "Get the report with AI Presence"],
  uk: ["Разова перевірка з AI Presence", ["Усе, що входить у разову перевірку", "Вимірювання згадок вашого бренду в ChatGPT, Claude, Gemini і Perplexity", "Перевірка відповідей моделей на часті запитання клієнтів", "Окремий звіт про присутність для завантаження"], "Отримати звіт з AI Presence"],
  de: ["Einzelanalyse mit AI Presence", ["Alles aus der Einzelanalyse", "Messung der Nennungen Ihrer Marke in ChatGPT, Claude, Gemini und Perplexity", "Prüfung der Modellantworten auf häufige Kundenfragen", "Separater AI-Presence-Bericht zum Herunterladen"], "Bericht mit AI Presence erhalten"],
  es: ["Análisis individual con AI Presence", ["Todo lo del análisis individual", "Medición de las menciones de tu marca en ChatGPT, Claude, Gemini y Perplexity", "Comprobación de las respuestas de los modelos a las preguntas más frecuentes de los clientes", "Informe de AI Presence aparte para descargar"], "Obtener el informe con AI Presence"],
  fr: ["Analyse unique avec AI Presence", ["Tout ce que contient l’analyse unique", "Mesure des mentions de votre marque dans ChatGPT, Claude, Gemini et Perplexity", "Vérification des réponses des modèles aux questions fréquentes des clients", "Rapport AI Presence séparé à télécharger"], "Obtenir le rapport avec AI Presence"],
  ru: ["Разовая проверка с AI Presence", ["Всё, что входит в разовую проверку", "Измерение упоминаний вашего бренда в ChatGPT, Claude, Gemini и Perplexity", "Проверка ответов моделей на частые вопросы клиентов", "Отдельный отчёт о присутствии для скачивания"], "Получить отчёт с AI Presence"],
};

const KINDS: Record<string, [string, string, string]> = {
  en: ["Single analysis", "Analysis pack", "Monthly plan"],
  uk: ["Разова перевірка", "Пакет перевірок", "Місячний план"],
  de: ["Einzelanalyse", "Analysepaket", "Monatsplan"],
  es: ["Análisis individual", "Paquete de análisis", "Plan mensual"],
  fr: ["Analyse unique", "Pack d’analyses", "Forfait mensuel"],
  ru: ["Разовая проверка", "Пакет проверок", "Месячный план"],
};

const CTAS: Record<string, [string, string, string]> = {
  en: ["Get the report", "Buy the pack", "Subscribe"],
  uk: ["Отримати звіт", "Придбати пакет", "Підписатися"],
  de: ["Bericht erhalten", "Paket kaufen", "Abonnieren"],
  es: ["Obtener el informe", "Comprar el paquete", "Suscribirse"],
  fr: ["Obtenir le rapport", "Acheter le pack", "S’abonner"],
  ru: ["Получить отчёт", "Купить пакет", "Подписаться"],
};

const BADGE: Record<string, string> = {
  en: "For regular use",
  uk: "Для регулярної роботи",
  de: "Für regelmäßige Nutzung",
  es: "Para uso habitual",
  fr: "Pour une utilisation régulière",
  ru: "Для регулярной работы",
};

// Українська — канонічний перелік власника (2026-09-05); інші мови — вже
// затверджені еквіваленти з каталогів (рядки пейволу `free.unlocks.*`,
// поточні рядки цін). Порядок у картці: кількість → оцінки → проблеми →
// сторінки → пріоритети → звіт → Presence.
const BULLETS: Record<string, string[]> = {
  en: [
    "Scores for each audited area", "All detected issues with evidence", "Pages affected by each issue",
    "What to fix and in what order", "Downloadable full report", "The same full report for every analysis",
    "{unit_price} per analysis", "Does not expire",
    "Unlimited full website analyses", "Allowances renew monthly",
  ],
  uk: [
    "Оцінки за всіма напрямами", "Усі знайдені проблеми з доказами", "Сторінки, яких стосується кожна проблема",
    "Пріоритети та порядок виправлення", "Повний звіт для завантаження", "Усе, що входить у разову перевірку",
    "{unit_price} за одну перевірку", "Пакет не має строку дії",
    "Необмежена кількість повних перевірок", "Ліміти поновлюються щомісяця",
    // Затверджені підписи без числа (власник, 2026-09-05).
    "Повні перевірки сайтів", "Actual AI Presence", "Ціна за одну перевірку", "Actual AI Presence щомісяця",
  ],
  de: [
    "Bewertungen für jeden geprüften Bereich", "Alle gefundenen Probleme mit Nachweisen", "Betroffene Seiten für jedes Problem",
    "Was in welcher Reihenfolge zu beheben ist", "Vollständiger Bericht zum Herunterladen", "Derselbe vollständige Bericht für jede Analyse",
    "{unit_price} pro Analyse", "Kein Ablaufdatum",
    "Unbegrenzte vollständige Website-Analysen", "Kontingente werden monatlich erneuert",
  ],
  es: [
    "Puntuación de cada área analizada", "Todos los problemas detectados con pruebas", "Páginas afectadas por cada problema",
    "Qué corregir y en qué orden", "Informe completo descargable", "El mismo informe completo para cada análisis",
    "{unit_price} por análisis", "No caduca",
    "Análisis completos de sitios ilimitados", "Los límites se renuevan cada mes",
  ],
  fr: [
    "Un score pour chaque domaine analysé", "Tous les problèmes détectés avec leurs preuves", "Pages concernées par chaque problème",
    "Les corrections à effectuer et leur ordre", "Rapport complet à télécharger", "Le même rapport complet pour chaque analyse",
    "{unit_price} par analyse", "Sans date d’expiration",
    "Analyses complètes de sites illimitées", "Les quotas sont renouvelés chaque mois",
  ],
  ru: [
    "Оценки по каждому направлению проверки", "Все найденные проблемы с доказательствами", "Страницы, которых касается каждая проблема",
    "Что исправлять и в каком порядке", "Полный отчёт для скачивания", "Одинаковый полный отчёт для каждой проверки",
    "{unit_price} за одну проверку", "Без срока действия",
    "Неограниченное количество полных проверок", "Лимиты обновляются ежемесячно",
  ],
};

describe("сторінка цін існує шістьма мовами й має погоджені заголовки", () => {
  it("файлів рівно шість", () => {
    const files = readdirSync(DIR).filter((name) => name.endsWith(".tsx"));
    expect(files.length).toBe(LOCALES.length);
  });

  for (const locale of LOCALES) {
    it(`${locale}: H1 точний і той самий у метаданих і в герої`, () => {
      const source = code(locale);
      expect(source).toContain(`h1: ${JSON.stringify(H1[locale])}`);
      // `compact` — лише поле відступів між заголовком і поясненням.
      expect(source).toContain(
        `<Hero title=${JSON.stringify(H1[locale])} compact lead=${JSON.stringify(LEAD[locale])} />`,
      );
    });

    it(`${locale}: під заголовком рівно одне затверджене пояснення, без надзаголовка`, () => {
      const source = code(locale);
      expect((source.match(/lead=/g) ?? []).length).toBe(1);
      expect(source).not.toContain("eyebrow=");
      // Попереднє загальне пояснення «відрізняється лише спосіб оплати»
      // не повернулось: пояснення одне, і воно затверджене дослівно.
      expect(source.toLowerCase()).not.toMatch(
        /only difference|відрізняється лише|unterscheiden sich nur|solo se diferencia|seule différence|отличается только/,
      );
    });
  }
});

describe("рядки — точні формулювання власника", () => {
  for (const locale of LOCALES) {
    it(`${locale}: разова з AI Presence — заголовок, перелік, дія`, () => {
      const source = code(locale);
      const [heading, bullets, cta] = PRESENCE[locale];
      expect(source).toContain(JSON.stringify(heading));
      for (const line of bullets) expect(source).toContain(JSON.stringify(line));
      expect(source).toContain(JSON.stringify(cta));
      expect(bullets.length).toBe(4);
    });

    it(`${locale}: безкоштовне превʼю зі сторінки цін прибрано`, () => {
      // Саме превʼю лишається безкоштовним, просто про нього говорить
      // головна сторінка й кнопка шапки. Сторінка цін говорить про ціни
      // (власник, 2026-11-23). Повернення картки сюди має бути рішенням,
      // а не наслідком копіювання старого файлу.
      const source = code(locale);
      expect(source).not.toContain("free: {");
      expect(source).not.toContain("bullets:");
    });

    it(`${locale}: дешевша разова не обіцяє присутності`, () => {
      // Між закриттям блока `single` і відкриттям `presence` слова
      // Presence бути не може: саме там колись стояв рядок, що обіцяв
      // її в форматі, де за неї не заплачено.
      const source = code(locale);
      const start = source.indexOf("single: {");
      const end = source.indexOf("presence: {", start);
      expect(start, "блок разової").toBeGreaterThan(-1);
      expect(end, "блок присутності").toBeGreaterThan(start);
      expect(source.slice(start, end)).not.toContain("Presence");
    });

    it(`${locale}: три платні формати, їхні дії й позначка Monthly`, () => {
      const source = code(locale);
      for (const kind of KINDS[locale]) expect(source).toContain(JSON.stringify(kind));
      for (const cta of CTAS[locale]) expect(source).toContain(JSON.stringify(cta));
      expect(source).toContain(JSON.stringify(BADGE[locale]));
    });

    it(`${locale}: усі сталі рядки переліків присутні`, () => {
      const source = code(locale);
      for (const line of BULLETS[locale]) expect(source).toContain(JSON.stringify(line));
    });

    it(`${locale}: форми множини для кожного налаштованого числа`, () => {
      const source = code(locale);
      // Кожен рядок із числом — форми, а не одне речення: `{n}` мусить
      // стояти в шаблонах, а не число в тексті.
      for (const key of ["analyses", "presence", "presencePerMonth"]) {
        expect(source, key).toContain(`${key}: {`);
      }
      // Кількість повних перевірок місячного плану більше не є параметром
      // цін: вони необмежені за означенням (власник, 2026-09-05). Виправлено
      // поки лише українську сторінку — решта мов ще несе застарілий ключ,
      // і рендер його не читає.
      if (locale === "uk") expect(source).not.toContain("analysesPerMonth");
      const forms = source.match(/\{n\}/g) ?? [];
      expect(forms.length).toBeGreaterThanOrEqual(10);
      if (locale === "uk" || locale === "ru") {
        expect(source).toContain("few:");
        expect(source).toContain("many:");
      }
    });
  }
});

describe("жодного числа й жодної забороненої обіцянки у вмісті", () => {
  for (const locale of LOCALES) {
    it(`${locale}: ціни, кількості й тарифні рівні не написані руками`, () => {
      const source = code(locale);
      // Число в тексті сторінки — зашита ціна або кількість. `{n}` і
      // `{unit_price}` — плейсхолдери, вони чисел не несуть.
      const withoutPlaceholders = source.replace(/\{n\}|\{unit_price\}/g, "");
      const textLiterals = withoutPlaceholders.match(/"[^"\n]*"/g) ?? [];
      const numeric = textLiterals.filter((literal) => /\d/.test(literal));
      expect(numeric, numeric.join("\n")).toEqual([]);
      expect(source).not.toMatch(/\b(USD|EUR|UAH|\$|€|₴)\b/);
    });

    it(`${locale}: без FAQ, таблиці рівнів, «найпопулярніший» і обіцянок «без картки»`, () => {
      const source = code(locale).toLowerCase();
      for (const forbidden of [
        "faq", "most popular", "найпопулярн", "популярн", "beliebtest", "más popular", "plus populaire",
        "starter", "agency", "агенц", "no card", "без картки", "без карты",
        "no signup", "first audit free", "перший аудит безкоштовно",
      ]) {
        expect(source, forbidden).not.toContain(forbidden);
      }
      // Тарифний рівень «Pro» — окремим словом: німецьке «pro Analyse»,
      // «pro Monat», «pro Website» (затверджене пояснення) — прийменник,
      // а не назва тарифу.
      expect(source).not.toMatch(/"pro"|\bpro\b(?! analyse| monat| website)/);
    });
  }
});

describe("компонент рендерить конфігурацію, а не власні числа", () => {
  it("чотири картки в ряд: разова → разова з Presence → пакет → план", () => {
    expect((component.match(/<Card\n/g) ?? []).length).toBe(4);
    expect(component).toContain("lg:grid-cols-4");
    expect(component).not.toContain('aria-labelledby="pricing-free"');
    expect(component).not.toContain("md:grid-cols-3");
    const order = [
      "strings.single.kind",
      "strings.presence.kind",
      "strings.pack.kind",
      "strings.monthly.kind",
    ].map((marker) => component.indexOf(marker));
    expect(order.every((at, i) => at > -1 && (i === 0 || at > order[i - 1]!))).toBe(true);
    // Картки безкоштовного превʼю тут більше немає (власник,
    // 2026-11-23). Дорога до превʼю лишилась у кнопці шапки, тож
    // `resultHref` цьому компоненту більше не потрібен.
    expect(component).not.toContain("strings.free");
    expect(component).not.toContain("resultHref");
  });

  it("обидві разові мають ціну, і ціни в них різні за побудовою", () => {
    // Дешевша картка без ціни виглядала б як безкоштовна, а саме цю
    // помилку ми щойно прибрали зі сторінки.
    const first = component.indexOf("strings.single.kind");
    const second = component.indexOf("strings.presence.kind");
    const third = component.indexOf("strings.pack.kind");
    expect(component.slice(first, second)).toContain("price={priceText(single,");
    expect(component.slice(second, third)).toContain("price={priceText(withPresence,");
  });

  it("дві разові розрізняються числом присутності, а не новим типом", () => {
    // Окремий тип пропозиції назвав би вдруге те, що вже записано в
    // даних, і два описи однієї речі неминуче розійшлися б.
    const pricing = readFileSync(join(__dirname, "..", "lib", "pricing.ts"), "utf-8");
    expect(pricing).toContain('offer.offer_type === "single"');
    expect(pricing).toContain("offer.presence_credits === 0");
    expect(pricing).toContain("offer.presence_credits > 0");
    expect(pricing).not.toContain("audit_only");
  });

  it("правило вибору двох разових одне на обидва місця", () => {
    // Сторінка цін і пейвол під безкоштовним результатом вибирають ті
    // самі дві пропозиції. Поки це були два окремі фільтри, вони
    // розійшлися б, і сторінка показувала б одну ціну, а каса брала б
    // іншу.
    expect(component).toContain("singleOffers(offers ?? [])");
    const panel = readFileSync(join(__dirname, "..", "components", "PaymentPanel.tsx"), "utf-8");
    expect(panel).toContain("singleOffers(");
    for (const source of [component, panel]) {
      expect(source).not.toContain("presence_credits === 0");
    }
  });

  it("динамічні значення — ціна/валюта, обидві кількості пакета, Presence тарифу", () => {
    // Пакет: два незалежні числа — перевірки й присутність (власник,
    // 2026-09-06). До того їх задавало одне N, і рядок про присутність
    // був правдою випадково.
    expect(lines).toContain("audit_credits");
    expect(lines).toContain("presence_credits");
    // Місячний план: кількість Presence налаштовується окремо.
    expect(lines).toContain("presence_checks_per_month");
    // Стану безліміту й періоду оплати як полів не існує (власник,
    // 2026-09-05).
    for (const source of [component, lines]) {
      expect(source).not.toContain("analyses_unlimited");
      expect(source).not.toContain("analyses_per_month");
      expect(source).not.toContain("interval");
      expect(source).not.toMatch(/presence:\s*\d/);
    }
    // Разова: одна перевірка сайту, число не читається з каталогу.
    expect(lines).toContain("SINGLE_ANALYSES = 1");
    // Кількості присутності в разовій більше немає взагалі: присутність
    // це окремий формат, а не число всередині дешевшого.
    expect(lines).not.toContain("SINGLE_PRESENCE");
  });

  it("відсутнє число ховає лише число: рядок лишається підписом", () => {
    expect(lines).toContain("s.pack.analysesLabel");
    expect(lines).toContain("s.pack.presenceLabel");
    expect(lines).toContain("s.pack.unitPriceLabel");
    expect(lines).toContain("s.monthly.presenceLabel");
    expect(component).toContain("lines={singleLines(locale, strings)}");
    expect(component).toContain("lines={packLines(locale, strings, pack)}");
    expect(component).toContain("lines={monthlyLines(locale, strings, monthly)}");
  });

  it("ціна однієї перевірки обчислюється з налаштованої загальної", () => {
    expect(lines).toContain("perAuditAmount(");
    expect(lines).toContain('replace("{unit_price}"');
  });

  it("поки числа їдуть, сітка позначена зайнятою — знімок половини не існує", () => {
    expect(component).toContain("aria-busy={loading || undefined}");
  });

  it("обидві разові — в анонімну касу, пакет і план — у касу з акаунтом", () => {
    // Разова з 6 вересня 2026 починається з оплати й БЕЗ реєстрації:
    // до того ця кнопка вела на форму превʼю, а спроба провести її
    // через `/checkout` вимагала б входу.
    expect(component).toContain("cta={{ href: buyHref(single), label: strings.single.cta }}");
    expect(component).toContain("cta={{ href: buyHref(withPresence), label: strings.presence.cta }}");
    expect(component).not.toContain('code: single.code }, locale)');
    expect(component).toContain('checkoutHref({ kind: "offer", code: pack.code }, locale)');
    expect(component).toContain('checkoutHref({ kind: "plan", code: monthly.code }, locale)');
    // Зупинки в кабінеті на шляху до оплати немає.
    expect(component).not.toContain("/app/plan?buy=");
    expect(component).not.toContain("/app/plan?subscribe=");
  });

  it("код пропозиції їде в адресу каси, бо разових дві", () => {
    // Без коду каса вгадувала б, за яку з двох заплатили, і вгадувала б
    // за полем сортування. Мова лишається в тій самій адресі.
    expect(component).toContain('params.set("offer", offer.code)');
    expect(component).toContain('params.set("lang", locale)');
    expect(component).toContain("`/buy?${query}`");
  });

  it("місячна ціна несе одиницю періоду, разова — ні", () => {
    expect(lines).toContain("${s.perMonth}");
    expect(component).toContain("price={priceText(single, pending)}");
  });
});
