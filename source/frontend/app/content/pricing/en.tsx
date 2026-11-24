/**
 * Ціни — en. Композиція повернута до стану `164a74d` (рішення власника
 * 2026-09-05): H1 → одне пояснювальне речення → чотири рівні блоки в ряд:
 * Разова, Разова з AI Presence,
 * Пакет, Місячний план. Склад блоків змінено 2026-11-23: превʼю більше
 * не картка сторінки цін, а присутність стала окремим форматом із
 * власною ціною. Перебудова «смуга
 * превʼю + три картки» була пропозицією без затвердження і знята.
 *
 * Рядки — затверджений вміст блоків; числа — ціни, кількість перевірок,
 * кількість Actual AI Presence — рендерить <PricingCards/> з комерційної
 * конфігурації бекенда; у цьому файлі їх немає, і тест це стереже для
 * всіх мов одразу. Форми множини постачає ця сторінка: закінчень у коді
 * компонента не зашито.
 */

import { PricingCards } from "../../components/PricingCards";
import { Hero, Section } from "../../components/sections";
import type { LocalizedPage } from "../../lib/page-types";

function Body() {
  return (
    <>
      <Hero title="How much does a website analysis cost?" compact lead="A single analysis gives you the full report on your site. The AI Presence option adds a check of whether AI assistants mention your brand. The pack and the monthly plan offer the same analyses at lower rates." />

      <Section tight>
        <PricingCards
          locale="en"
          strings={{
            single: {
              kind: "Single analysis",
              analyses: {
                one: "{n} full website analysis",
                other: "{n} full website analyses",
              },
              scores: "Scores for each audited area",
              issues: "All detected issues with evidence",
              pages: "Pages affected by each issue",
              order: "What to fix and in what order",
              download: "Downloadable full report",
              note: "No account needed",
              cta: "Get the report",
            },
            presence: {
              kind: "Single analysis with AI Presence",
              includesSingle: "Everything in the single analysis",
              measures:
                "Measured mentions of your brand in ChatGPT, Claude, Gemini and Perplexity",
              questions:
                "Model answers checked on the questions customers ask most",
              download: "Separate AI Presence report to download",
              note: "No account needed",
              cta: "Get the report with AI Presence",
            },
            pack: {
              kind: "Analysis pack",
              analyses: {
                one: "{n} full website analysis",
                other: "{n} full website analyses",
              },
              includesSingle: "The same full report for every analysis",
              presence: {
                one: "Actual AI Presence: {n} check",
                other: "Actual AI Presence: {n} checks",
              },
              unitPrice: "{unit_price} per analysis",
              noExpiry: "Does not expire",
              manage: "Manage analyses and balance in your account",
              note: "A Crawldy account is required",
              cta: "Buy the pack",
            },
            monthly: {
              badge: "For regular use",
              kind: "Monthly plan",
              unlimited: "Unlimited full website analyses",
              analysesPerMonth: {
                one: "{n} full website analysis per month",
                other: "{n} full website analyses per month",
              },
              includesSingle: "The same full report for every analysis",
              presencePerMonth: {
                one: "Actual AI Presence: {n} check per month",
                other: "Actual AI Presence: {n} checks per month",
              },
              renews: "Allowances renew monthly",
              manage: "Manage analyses and balance in your account",
              note: "A Crawldy account is required",
              cta: "Subscribe",
            },
            perMonth: "/ month",
            priceOnRequest: "Price on request",
            loadFailed: "Could not load the current offers. The free check works regardless — try this page again later.",
          }}
        />
      </Section>
    </>
  );
}

export const en: LocalizedPage = {
  slug: "pricing",
  title: "Crawldy pricing, single website analysis, pack and monthly plan",
  h1: "How much does a website analysis cost?",
  description:
    "A single website analysis for search and AI, a separate option with Actual AI Presence, a pack that does not expire, and a monthly plan.",
  navLabel: "Pricing",
  Body,
};
