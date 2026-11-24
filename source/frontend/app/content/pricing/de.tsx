/**
 * Ціни — de. Композиція повернута до стану `164a74d` (рішення власника
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
      <Hero title="Was kostet eine Website-Analyse?" compact lead="Die Einzelanalyse liefert den vollständigen Bericht zu Ihrer Website. Die Variante mit AI Presence prüft zusätzlich, ob KI-Assistenten Ihre Marke nennen. Paket und Monatsplan bieten dieselben Analysen zu günstigeren Sätzen." />

      <Section tight>
        <PricingCards
          locale="de"
          strings={{
            single: {
              kind: "Einzelanalyse",
              analyses: {
                one: "{n} vollständige Website-Analyse",
                other: "{n} vollständige Website-Analysen",
              },
              scores: "Bewertungen für jeden geprüften Bereich",
              issues: "Alle gefundenen Probleme mit Nachweisen",
              pages: "Betroffene Seiten für jedes Problem",
              order: "Was in welcher Reihenfolge zu beheben ist",
              download: "Vollständiger Bericht zum Herunterladen",
              note: "Ohne Registrierung",
              cta: "Bericht erhalten",
            },
            presence: {
              kind: "Einzelanalyse mit AI Presence",
              includesSingle: "Alles aus der Einzelanalyse",
              measures:
                "Messung der Nennungen Ihrer Marke in ChatGPT, Claude, Gemini und Perplexity",
              questions:
                "Prüfung der Modellantworten auf häufige Kundenfragen",
              download: "Separater AI-Presence-Bericht zum Herunterladen",
              note: "Ohne Registrierung",
              cta: "Bericht mit AI Presence erhalten",
            },
            pack: {
              kind: "Analysepaket",
              analyses: {
                one: "{n} vollständige Website-Analyse",
                other: "{n} vollständige Website-Analysen",
              },
              includesSingle: "Derselbe vollständige Bericht für jede Analyse",
              presence: {
                one: "Actual AI Presence: {n} Prüfung",
                other: "Actual AI Presence: {n} Prüfungen",
              },
              unitPrice: "{unit_price} pro Analyse",
              noExpiry: "Kein Ablaufdatum",
              manage: "Analysen und Guthaben im Kundenbereich verwalten",
              note: "Ein Crawldy-Konto ist erforderlich",
              cta: "Paket kaufen",
            },
            monthly: {
              badge: "Für regelmäßige Nutzung",
              kind: "Monatsplan",
              unlimited: "Unbegrenzte vollständige Website-Analysen",
              analysesPerMonth: {
                one: "{n} vollständige Website-Analyse pro Monat",
                other: "{n} vollständige Website-Analysen pro Monat",
              },
              includesSingle: "Derselbe vollständige Bericht für jede Analyse",
              presencePerMonth: {
                one: "Actual AI Presence: {n} Prüfung pro Monat",
                other: "Actual AI Presence: {n} Prüfungen pro Monat",
              },
              renews: "Kontingente werden monatlich erneuert",
              manage: "Analysen und Guthaben im Kundenbereich verwalten",
              note: "Ein Crawldy-Konto ist erforderlich",
              cta: "Abonnieren",
            },
            perMonth: "/ Monat",
            priceOnRequest: "Preis auf Anfrage",
            loadFailed: "Die aktuellen Angebote konnten nicht geladen werden. Der kostenlose Check funktioniert trotzdem — versuchen Sie es später erneut.",
          }}
        />
      </Section>
    </>
  );
}

export const de: LocalizedPage = {
  slug: "preise",
  title: "Crawldy Preise, Einzelanalyse, Paket und Monatsplan",
  h1: "Was kostet eine Website-Analyse?",
  description:
    "Eine vollständige Website-Analyse für Suche und KI, eine eigene Variante mit Actual AI Presence, ein Paket ohne Verfall und ein Monatsplan.",
  navLabel: "Preise",
  Body,
};
