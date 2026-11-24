"use client";

/**
 * Пейвол і чесні стани оплати.
 *
 * Один компонент на весь платіжний бік безкоштовного результату:
 * пропозиція, відкриття каси, очікування підтвердження, відмова,
 * закрите вікно. Розділяти їх на кілька панелей означало б розводити
 * по файлах один стан однієї кнопки.
 *
 * ## Дві дії, рівноцінні
 *
 * Під безкоштовним результатом тепер два платні вибори: перевірка сайту
 * й вона ж разом із Actual AI Presence. Рівноцінні навмисно. Дешевший
 * формат не коштує нам майже нічого, тоді як присутність платить за
 * запити до чотирьох моделей за кожен прогін, тож людина, яка вибрала
 * дешевше, приносить не менше. Ховати цей вибір дрібним посиланням
 * означало б ховати його без причини.
 *
 * ## Про ціни
 *
 * Вписаної ціни тут немає досі: числа приходять із каталогу тим самим
 * запитом, що й на сторінці цін. Дві кнопки без сум читались би як
 * загадка, тому суму показуємо, але своєї не вигадуємо. Каталог не
 * відповів — лишається одна кнопка без ціни, рівно як було.
 *
 * ## Чого тут немає
 *
 * Права. `unlocked` приходить із сервера й нікуди звідси не
 * встановлюється: цей компонент уміє показати стан і не вміє його
 * призначити.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { Icon } from "./Icon";
import { Button, Panel, Spinner } from "./primitives";
import { API_URL } from "../lib/api";
import { money } from "../lib/pricing-lines";
import { singleOffers } from "../lib/pricing";
import {
  isSettled,
  nextPollDelayMs,
  openCheckout,
  readPaymentStatus,
  rememberAudit,
} from "../lib/guest-payment";
import { openPaddleOverlay } from "../lib/paddle";
import {
  INITIAL_FLOW,
  canRetry,
  needsReconciliation,
  reduceFlow,
  shouldKeepPolling,
  type FlowState,
} from "../lib/payment-flow";
import { useLocale } from "../lib/locale";

interface Props {
  auditId: string;
  /**
   * Стан, з якого починаємо. Сторінка повернення з каси передає
   * `processing`, щоб опитування почалося одразу, а не після кліку.
   */
  initial?: FlowState;
  /** Право прийшло — сторінка перемальовує себе повним звітом. */
  onUnlocked?: () => void;
}

/** Поля пропозиції, потрібні двом кнопкам пейволу. */
interface PaywallOffer {
  code: string;
  offer_type: string;
  presence_credits: number;
  display_amount_minor: number | null;
  exponent: number;
  currency: string;
}

export function PaymentPanel({ auditId, initial, onUnlocked }: Props) {
  const [flow, dispatch] = useReducer(reduceFlow, initial ?? INITIAL_FLOW);
  const [offers, setOffers] = useState<PaywallOffer[]>([]);
  const unlockedRef = useRef(false);
  const { locale } = useLocale();
  // Який формат обрали минулого разу. Потрібен для «спробувати ще раз»:
  // повтор мусить відкрити ту саму покупку, а не тихо іншу.
  const chosen = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${API_URL}/v1/offers?lang=${locale}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as PaywallOffer[];
        if (!cancelled) setOffers(body);
      } catch {
        // Каталог не відповів. Лишається одна кнопка без ціни, тобто
        // рівно те, що було тут до появи другого формату.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const start = useCallback(async (offerCode?: string) => {
    chosen.current = offerCode;
    dispatch({ type: "checkout.requested" });
    try {
      // Запамʼятати ДО каси: якщо накладну відкрити не вдасться, ми
      // підемо за адресою провайдера, і сторінка оплати мусить знати,
      // куди повернути людину — в адресі `?_ptxn=` аудиту немає.
      rememberAudit(auditId);
      const intent = await openCheckout(auditId, offerCode);
      const opened = await openPaddleOverlay({
        clientToken: intent.client_token,
        environment: intent.environment,
        transactionRef: intent.transaction_ref,
        onCompleted: () => dispatch({ type: "checkout.completed" }),
        onClosed: () => dispatch({ type: "checkout.closed" }),
      });
      dispatch({ type: "checkout.opened" });
      if (!opened) {
        // Накладну касу відкрити нічим — переходимо за адресою, яку
        // видав провайдер. Мовчазна відмова була б гіршою.
        window.location.assign(intent.checkout_url);
      }
    } catch {
      // Причина не показується: локалізовані заголовок і підводка стану
      // «недоступно» вже кажуть усе, а сирий код сервера («checkout.
      // unavailable») людині не каже нічого.
      dispatch({ type: "checkout.unavailable" });
    }
  }, [auditId]);

  // Опитування сервера. Єдиний спосіб дізнатися про оплату: повернення
  // браузера й параметри його адреси доказом не є. Після закритого без
  // оплати вікна те саме питання несе прохання звірити транзакцію з
  // провайдером — інакше сервер, який не отримав події, не має що
  // відповісти, крім «обробляємо».
  useEffect(() => {
    if (!shouldKeepPolling(flow)) return;
    let alive = true;
    const reconcile = needsReconciliation(flow);
    const timer = window.setTimeout(
      () => {
        void (async () => {
          try {
            const status = await readPaymentStatus(auditId, { reconcile });
            if (!alive) return;
            dispatch({ type: "server.said", status });
            if (status.unlocked && !unlockedRef.current) {
              unlockedRef.current = true;
              onUnlocked?.();
            }
            if (isSettled(status)) alive = false;
          } catch {
            // Мережа моргнула — не привід оголошувати оплату невдалою.
            // Наступна спроба піде за тим самим розкладом; звірка без
            // відповіді лишається звіркою (`charged: null`).
            if (alive) dispatch({ type: "server.said", status: {
              audit_id: auditId,
              state: "processing",
              unlocked: false,
              charged: null,
            } });
          }
        })();
      },
      nextPollDelayMs(flow.attempt),
    );
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [flow, auditId, onUnlocked]);

  // Повтор відкриває ТОЙ САМИЙ формат, що й перша спроба. Інакше
  // людина, яка вибрала дешевший і натрапила на відмову провайдера,
  // після «спробувати ще раз» платила б за дорожчий.
  const retry = () => void start(chosen.current);

  if (flow.phase === "processing") return <Waiting />;
  if (flow.phase === "reconciling") return <Reconciling />;
  if (flow.phase === "failed") return <Retry reason="failed" onRetry={retry} />;
  if (flow.phase === "canceled") return <Retry reason="canceled" onRetry={retry} />;
  if (flow.phase === "refunded") return <Retry reason="refunded" onRetry={retry} />;
  if (flow.phase === "unavailable") {
    return <Retry reason="unavailable" onRetry={retry} />;
  }
  const { audit, withPresence } = singleOffers(offers);
  return (
    <Paywall
      busy={flow.phase === "opening"}
      site={audit}
      withPresence={withPresence}
      onBuy={(code) => void start(code)}
    />
  );
}

/**
 * Пейвол. Каже, що саме відкриває повний аудит, — без ціни: вона живе
 * в прайсі провайдера, і плейсхолдер тут був би вигаданим числом.
 */
function Paywall({
  busy,
  site,
  withPresence,
  onBuy,
}: {
  busy: boolean;
  site: PaywallOffer | null;
  withPresence: PaywallOffer | null;
  onBuy: (offerCode?: string) => void;
}) {
  const { t } = useLocale();
  const unlocks = [
    "scores",
    "findings",
    "pages",
    "evidence",
    "fixes",
    "download",
  ] as const;

  const amount = (offer: PaywallOffer | null) =>
    offer === null || offer.display_amount_minor === null
      ? null
      : money(offer.display_amount_minor, offer.exponent, offer.currency);

  // Дві дії показуються лише тоді, коли каталог справді назвав обидва
  // формати. Поки він мовчить, кнопка одна й без коду: сервер віддасть
  // повний формат, тобто рівно те, що ця сторінка продавала завжди.
  // Намалювати другу кнопку наосліп означало б пообіцяти ціну, якої ми
  // не знаємо, і код пропозиції, якого в нас немає.
  const bothKnown = site !== null && withPresence !== null;

  return (
    <Panel className="border-accent/40">
      <h2 className="text-base font-semibold text-foreground">
        {t("free.paywallTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("free.paywallLead")}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {unlocks.map((key) => (
          <li key={key} className="flex items-start gap-2 text-sm text-foreground">
            <Icon name="check" className="mt-0.5 size-4 shrink-0 text-accent" />
            {t(`free.unlocks.${key}`)}
          </li>
        ))}
      </ul>
      {bothKnown ? (
        // Рівні колонки, однакові кнопки, однакова вага. Дрібніший
        // другий варіант читався б як виняток для впертих.
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Action
            busy={busy}
            label={t("free.cta")}
            price={amount(site)}
            onClick={() => onBuy(site.code)}
          />
          <Action
            busy={busy}
            label={t("free.ctaPresence")}
            price={amount(withPresence)}
            note={t("free.presenceAdds")}
            onClick={() => onBuy(withPresence.code)}
          />
        </div>
      ) : (
        <div className="mt-5">
          <Button size="lg" loading={busy} onClick={() => onBuy()}>
            {t("free.cta")}
          </Button>
        </div>
      )}
    </Panel>
  );
}

/** Одна з двох рівноцінних дій пейволу: кнопка, сума, одне пояснення. */
function Action({
  busy,
  label,
  price,
  note,
  onClick,
}: {
  busy: boolean;
  label: string;
  /** Ціна з каталогу або нічого. Вигаданих сум тут не буває. */
  price: string | null;
  note?: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" loading={busy} onClick={onClick}>
        {label}
      </Button>
      {price ? (
        <p className="text-sm font-semibold tabular-nums text-foreground">{price}</p>
      ) : null}
      {note ? <p className="text-sm text-muted">{note}</p> : null}
    </div>
  );
}

/**
 * Повернення з каси — не доказ оплати. Доказ — перевірена подія
 * провайдера, і поки її немає, повний вміст закритий, а людині чесно
 * сказано, що відбувається. Ні «оплата не пройшла», ні повний звіт
 * авансом: перше — неправда, друге — дірка в межі.
 */
function Waiting() {
  const { t } = useLocale();
  return (
    <Panel className="border-accent/40">
      <div className="flex items-center gap-3">
        <Spinner className="size-5" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("free.processingTitle")}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t("free.processingLead")}</p>
        </div>
      </div>
    </Panel>
  );
}

/**
 * Вікно каси закрилось без слова «оплачено», і сервер звіряє
 * транзакцію з провайдером.
 *
 * Кнопки тут немає навмисно. «Спробувати ще раз» до відповіді сервера
 * пропонувало б другу оплату людині, яка, можливо, щойно зробила першу,
 * а «кошти не списано» стверджувало б те, чого ще ніхто не перевірив.
 */
function Reconciling() {
  const { t } = useLocale();
  return (
    <Panel className="border-accent/40">
      <div className="flex items-center gap-3">
        <Spinner className="size-5" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("free.payment.reconciling.title")}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {t("free.payment.reconciling.lead")}
          </p>
        </div>
      </div>
    </Panel>
  );
}

type RetryReason = "failed" | "canceled" | "refunded" | "unavailable";

/** Спроба не вдалася — і це не блокувач. Кнопка лишається живою. */
function Retry({
  reason,
  onRetry,
}: {
  reason: RetryReason;
  onRetry: () => void;
}) {
  const { t } = useLocale();
  return (
    <Panel className="border-warning/40">
      <h2 className="text-base font-semibold text-foreground">
        {t(`free.payment.${reason}.title`)}
      </h2>
      <p className="mt-1 text-sm text-muted">{t(`free.payment.${reason}.lead`)}</p>
      <div className="mt-5">
        <Button size="lg" onClick={onRetry}>
          {t("free.payment.retry")}
        </Button>
      </div>
    </Panel>
  );
}

export { canRetry };
