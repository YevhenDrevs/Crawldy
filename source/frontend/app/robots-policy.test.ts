/**
 * Політика краулерів: навчальні заборонені, пошукові та за запитом людини —
 * відкриті. Виняток один — `Google-Extended`.
 *
 * Тест виконує справжній продюсер і порівнює ПОВНИЙ серіалізований вивід із
 * зафіксованим. Тому він ловить не лише зникнення правки, а й будь-яку тиху
 * зміну сусідньої групи — саме те, чого не видно в діфі на один рядок.
 *
 * Історія змін, які цей знімок фіксує:
 *
 * - додано `ClaudeBot`: групу навчальних закривав лише `anthropic-ai`, токен,
 *   якого в документації Anthropic уже немає, і правило діяло на папері;
 * - `Applebot-Extended` перенесено з ботів для відповідей у навчальні: він не
 *   краулер, а маркер згоди Apple на навчання моделей;
 * - `Google-Extended` відкрито рішенням власника: продукт міряє присутність у
 *   Gemini, і сайт, закритий для Gemini, суперечив би йому.
 */

import { describe, expect, it } from "vitest";

import robots from "./robots";

type Rule = {
  userAgent?: string;
  allow?: string | string[];
  disallow?: string | string[];
};

/**
 * Очікуваний вивід, зафіксований дослівно.
 *
 * Порядок тут значущий не для краулерів, а для доказу: будь-яка перестановка
 * чи зміна групи мусить бути свідомою й зʼявитися тут.
 */
const PRIVATE = ["/app", "/admin", "/api", "/result", "/report"];
const EXPECTED: Rule[] = [
  { userAgent: "*", allow: "/", disallow: PRIVATE },
  { userAgent: "OAI-SearchBot", allow: "/", disallow: PRIVATE },
  { userAgent: "PerplexityBot", allow: "/", disallow: PRIVATE },
  { userAgent: "Google-Extended", allow: "/", disallow: PRIVATE },
  { userAgent: "GPTBot", disallow: "/" },
  { userAgent: "CCBot", disallow: "/" },
  { userAgent: "anthropic-ai", disallow: "/" },
  { userAgent: "Bytespider", disallow: "/" },
  { userAgent: "ClaudeBot", disallow: "/" },
  { userAgent: "Applebot-Extended", disallow: "/" },
];

const produced = robots();
const rules = produced.rules as Rule[];
const ruleFor = (agent: string) => rules.find((r) => r.userAgent === agent);

describe("вивід збігається із зафіксованою політикою", () => {
  it("повний серіалізований вивід", () => {
    expect(JSON.stringify(rules)).toBe(JSON.stringify(EXPECTED));
  });

  it("кожен агент має рівно одну групу", () => {
    const agents = rules.map((r) => r.userAgent);
    expect(new Set(agents).size).toBe(agents.length);
  });
});

describe("навчальні краулери заборонені повністю", () => {
  for (const agent of ["GPTBot", "CCBot", "anthropic-ai", "Bytespider", "ClaudeBot"]) {
    it(`${agent}: заборона на весь сайт і жодного дозволу`, () => {
      expect(ruleFor(agent)?.disallow).toBe("/");
      expect(ruleFor(agent)?.allow).toBeUndefined();
    });
  }

  it("застарілий токен anthropic-ai не прибрано — це окреме рішення власника", () => {
    expect(ruleFor("anthropic-ai")).toBeDefined();
  });
});

describe("Applebot-Extended — маркер навчання, а не бот для відповідей", () => {
  it("заборонений повністю, як решта навчальних", () => {
    expect(ruleFor("Applebot-Extended")?.disallow).toBe("/");
    expect(ruleFor("Applebot-Extended")?.allow).toBeUndefined();
  });

  it("пошуковий Applebot не згаданий, тож його відкриває wildcard", () => {
    expect(ruleFor("Applebot")).toBeUndefined();
  });
});

describe("Google-Extended відкрито, приватні розділи — ні", () => {
  it("дозволяє сайт і закриває ті самі приватні розділи, що й wildcard", () => {
    expect(ruleFor("Google-Extended")?.allow).toBe("/");
    expect(ruleFor("Google-Extended")?.disallow).toEqual(PRIVATE);
  });
});

describe("пошук і запит людини лишилися відкритими", () => {
  // Це не той самий бот і не та сама політика: `Claude-SearchBot` індексує
  // для відповіді з посиланням, `Claude-User` ходить на прохання людини.
  // Заборонити їх означало б втратити саме ту видимість, заради якої все це.
  for (const agent of ["Claude-SearchBot", "Claude-User"]) {
    it(`${agent} ніде не згадано, тож діє відкритий wildcard`, () => {
      expect(JSON.stringify(rules)).not.toContain(agent);
    });
  }

  for (const agent of ["OAI-SearchBot", "PerplexityBot"]) {
    it(`${agent} відкрито з закритими приватними розділами`, () => {
      expect(ruleFor(agent)?.allow).toBe("/");
      expect(ruleFor(agent)?.disallow).toEqual(PRIVATE);
    });
  }

  it("wildcard і далі відкриває сайт, закриваючи приватні розділи", () => {
    expect(ruleFor("*")?.allow).toBe("/");
    expect(ruleFor("*")?.disallow).toEqual(PRIVATE);
  });
});

describe("решта документа не зрушила", () => {
  it("мапа сайту й канонічний хост на місці", () => {
    expect(produced.sitemap).toBe("https://crawldy.ai/sitemap.xml");
    expect(produced.host).toBe("https://crawldy.ai");
  });
});
