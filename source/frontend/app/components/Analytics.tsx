"use client";

import Script from "next/script";
import { useEffect } from "react";

import { analyticsScript, analyticsUrl } from "../lib/analytics";

/**
 * Аналітика відвідувань — Plausible, без cookies.
 *
 * Без cookies й ідентифікаторів відвідувача банер згоди не потрібен, і
 * політика приватності («optional analytics if those tools are enabled»)
 * цей випадок уже покриває.
 *
 * Вмикається лише змінною збірки `NEXT_PUBLIC_PLAUSIBLE_SRC` — повна адреса
 * скрипта сайту з налаштувань Plausible (`https://plausible.io/js/pa-….js`).
 * Без неї компонент не рендерить нічого: локальна розробка, тести й
 * прев'ю аналітики не забруднюють.
 *
 * Кожна подія перед відправкою проходить `analyticsUrl`: токени з адрес
 * прибираються, адмінка не рахується (пояснення — у `lib/analytics.ts`).
 *
 * Порядок завантаження неважливий: заглушка ставить виклики в чергу, а
 * скрипт Plausible, прийшовши, читає з неї параметри `init`. Переходи між
 * сторінками без перезавантаження скрипт відстежує сам через History API.
 */

type Payload = { u?: string } & Record<string, unknown>;
type PlausibleStub = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  o?: Record<string, unknown>;
  init?: (options?: Record<string, unknown>) => void;
};

const SRC = analyticsScript(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC);

function transformRequest(payload: Payload): Payload | null {
  const clean = analyticsUrl(payload.u ?? window.location.href);
  if (clean === null) return null;
  return { ...payload, u: clean };
}

export function Analytics() {
  useEffect(() => {
    if (!SRC) return;
    const w = window as unknown as { plausible?: PlausibleStub };
    // Заглушка зі сніпета Plausible: черга викликів до приходу скрипта.
    const stub: PlausibleStub =
      w.plausible ??
      Object.assign(
        (...args: unknown[]) => {
          (stub.q = stub.q ?? []).push(args);
        },
        {},
      );
    stub.init =
      stub.init ??
      ((options?: Record<string, unknown>) => {
        stub.o = options ?? {};
      });
    w.plausible = stub;
    stub.init({ transformRequest });
  }, []);

  if (!SRC) return null;
  return <Script src={SRC} strategy="afterInteractive" />;
}
