/**
 * Ціни — es. Композиція повернута до стану `164a74d` (рішення власника
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
      <Hero title="¿Cuánto cuesta analizar un sitio web?" compact lead="El análisis individual ofrece el informe completo de tu sitio. La opción con AI Presence añade la comprobación de si los asistentes de IA mencionan tu marca. El paquete y el plan mensual ofrecen los mismos análisis a tarifas más bajas." />

      <Section tight>
        <PricingCards
          locale="es"
          strings={{
            single: {
              kind: "Análisis individual",
              analyses: {
                one: "{n} análisis completo del sitio",
                other: "{n} análisis completos de sitios",
              },
              scores: "Puntuación de cada área analizada",
              issues: "Todos los problemas detectados con pruebas",
              pages: "Páginas afectadas por cada problema",
              order: "Qué corregir y en qué orden",
              download: "Informe completo descargable",
              note: "Sin registro",
              cta: "Obtener el informe",
            },
            presence: {
              kind: "Análisis individual con AI Presence",
              includesSingle: "Todo lo del análisis individual",
              measures:
                "Medición de las menciones de tu marca en ChatGPT, Claude, Gemini y Perplexity",
              questions:
                "Comprobación de las respuestas de los modelos a las preguntas más frecuentes de los clientes",
              download: "Informe de AI Presence aparte para descargar",
              note: "Sin registro",
              cta: "Obtener el informe con AI Presence",
            },
            pack: {
              kind: "Paquete de análisis",
              analyses: {
                one: "{n} análisis completo del sitio",
                other: "{n} análisis completos de sitios",
              },
              includesSingle: "El mismo informe completo para cada análisis",
              presence: {
                one: "Actual AI Presence: {n} comprobación",
                other: "Actual AI Presence: {n} comprobaciones",
              },
              unitPrice: "{unit_price} por análisis",
              noExpiry: "No caduca",
              manage: "Gestión de análisis y saldo desde tu cuenta",
              note: "Requiere una cuenta de Crawldy",
              cta: "Comprar el paquete",
            },
            monthly: {
              badge: "Para uso habitual",
              kind: "Plan mensual",
              unlimited: "Análisis completos de sitios ilimitados",
              analysesPerMonth: {
                one: "{n} análisis completo al mes",
                other: "{n} análisis completos al mes",
              },
              includesSingle: "El mismo informe completo para cada análisis",
              presencePerMonth: {
                one: "Actual AI Presence: {n} comprobación al mes",
                other: "Actual AI Presence: {n} comprobaciones al mes",
              },
              renews: "Los límites se renuevan cada mes",
              manage: "Gestión de análisis y saldo desde tu cuenta",
              note: "Requiere una cuenta de Crawldy",
              cta: "Suscribirse",
            },
            perMonth: "/ mes",
            priceOnRequest: "Precio a consultar",
            loadFailed: "No se pudieron cargar las ofertas actuales. La comprobación gratuita funciona de todos modos — vuelve a intentarlo más tarde.",
          }}
        />
      </Section>
    </>
  );
}

export const es: LocalizedPage = {
  slug: "precios",
  title: "Precios de Crawldy, análisis individual, paquete y plan mensual",
  h1: "¿Cuánto cuesta analizar un sitio web?",
  description:
    "Un análisis completo del sitio para buscadores e IA, una opción aparte con Actual AI Presence, un paquete que no caduca y un plan mensual.",
  navLabel: "Precios",
  Body,
};
