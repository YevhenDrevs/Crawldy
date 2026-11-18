/**
 * Що з адреси сторінки можна віддати аналітиці.
 *
 * Plausible отримує адресу кожної сторінки, а частина наших адрес несе
 * секрети: токен купленого звіту стоїть прямо в шляху (`/report/{token}`),
 * токен відновлення пароля й гостьова спроможність — у параметрах запиту.
 * Хто має доступ до панелі аналітики, не мусить мати доступу до звітів
 * клієнтів. Тому адреса чиститься ДО відправки, а не фільтром у панелі:
 * фільтр ховає, а не прибирає, і токен однаково лежить у чужій базі.
 *
 * Правила:
 *
 * - параметри запиту відкидаються всі, крім `utm_*` — тільки вони
 *   потрібні аналітиці (джерело кампанії), а серед решти живуть токени;
 * - сегмент після `/report/` замінюється на `_TOKEN_`;
 * - ідентифікатори аудитів і сайтів у кабінеті — на `_ID_`: секретом вони
 *   не є, але кожен створює окрему «сторінку», і звіт стає непридатним;
 * - службова адмінка не рахується взагалі: це трафік команди, не клієнтів.
 */

const DROP = /^\/admin(\/|$)/;

const REWRITES: [RegExp, string][] = [
  [/^\/report\/[^/]+/, "/report/_TOKEN_"],
  [/^\/app\/(audits|sites)\/[^/]+/, "/app/$1/_ID_"],
];

/** Чиста адреса для аналітики або `null`, якщо подію не відправляти. */
export function analyticsUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (DROP.test(url.pathname)) return null;

  let path = url.pathname;
  for (const [pattern, replacement] of REWRITES) {
    path = path.replace(pattern, replacement);
  }

  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("utm_")) kept.append(key, value);
  });
  const query = kept.toString();

  // Фрагмент (#…) теж відкидається: він не потрібен і може нести стан.
  return `${url.origin}${path}${query ? `?${query}` : ""}`;
}

/**
 * Адреса скрипта Plausible зі змінної збірки, або `null`, якщо аналітику
 * не ввімкнено. Порожній рядок — теж «не ввімкнено».
 */
export function analyticsScript(src: string | undefined): string | null {
  const value = src?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
