/**
 * Логотип Crawldy.
 *
 * Показує **оригінальні файли дизайнера** з `public/brand/` і нічого з
 * ними не робить: не перефарбовує, не перемальовує, не міняє пропорцій.
 *
 * Це рішення, а не зручність. Колись тут стояла реконструкція знака з
 * опису — вона виглядала «майже так само», і саме тому була гіршою за
 * відсутність знака. Потім горизонтальний локап складався з двох
 * вирізок, бо дизайнерським був лише вертикальний. Обидві ери минули:
 * тепер обидва локапи — файли дизайнера як є.
 *
 * ## Джерела
 *
 * Сторінки отримують WebP (див. `BrandImage`); PNG нижче — першоджерело.
 *
 * `crawldy-horizontal.png` — горизонтальний локап дизайнера (знак і
 * напис поруч), даунскейл із оригіналу 4348×876 без інших змін.
 *
 * `crawldy-vertical.png` — вертикальний локап дизайнера (знак над
 * написом), даунскейл із оригіналу 4427×2398.
 *
 * `crawldy-mark.png` і `crawldy-wordmark.png` — точні вирізки з
 * горизонтального файлу, розділені по найширшому прозорому проміжку
 * (299px) між знаком і написом. Жоден піксель знака не змінено.
 *
 * ## Де який
 *
 * Горизонтальний — шапки й рядкові контексти: знак супроводжує
 * навігацію. Вертикальний — там, де знак головний: вхід, каса, порожні
 * стани, публічні сторінки звіту. Сам знак — там, де місця нема зовсім
 * (згорнута панель, футер).
 */

import { cx } from "../lib/cx";

/* Власні розміри файлів. Потрібні браузеру, щоб зарезервувати місце до
 * завантаження — інакше сторінка смикається, коли логотип приходить. */
const MARK = asset("crawldy-mark", 400, 385);
const WORDMARK = asset("crawldy-wordmark", 1200, 289);
const HORIZONTAL = asset("crawldy-horizontal", 1600, 322);
const VERTICAL = asset("crawldy-vertical", 1000, 542);

type BrandAsset = { png: string; webp: string; w: number; h: number };

function asset(name: string, w: number, h: number): BrandAsset {
  return { png: `/brand/${name}.png`, webp: `/brand/${name}.webp`, w, h };
}

/**
 * Файл дизайнера у двох форматах: WebP для браузера, PNG як запасний.
 *
 * WebP генерує `scripts/brand-webp.mjs` із PNG без втрат — пікселі ті самі,
 * важить удвічі менше. PNG лишається першоджерелом і запасним варіантом.
 *
 * `display: contents` на `<picture>` обовʼязковий: без нього обгортка сама
 * стає flex-елементом батька замість `<img>`, і `shrink-0`, розміри й
 * вирівнювання в шапці перестають діяти — шапка зʼїжджає.
 *
 * Не next/image: той керує розмірами сам, а тут пропорції — частина
 * знака. Звичайний <img> із власними width/height лишає їх точними.
 */
function BrandImage({
  asset,
  alt,
  className,
  style,
  decorative = false,
}: {
  asset: BrandAsset;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  decorative?: boolean;
}) {
  return (
    <picture style={{ display: "contents" }}>
      <source type="image/webp" srcSet={asset.webp} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.png}
        alt={alt}
        aria-hidden={decorative || undefined}
        width={asset.w}
        height={asset.h}
        className={className}
        style={style}
      />
    </picture>
  );
}

/** Лише знак. Висота задає розмір, ширина рахується з пропорцій файлу. */
export function Logomark({
  height = 28,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <BrandImage
      asset={MARK}
      alt=""
      decorative
      className={cx("shrink-0", className)}
      style={{ height, width: (height * MARK.w) / MARK.h }}
    />
  );
}

/** Лише напис. */
export function Wordmark({
  height = 18,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <BrandImage
      asset={WORDMARK}
      alt="Crawldy"
      className={cx("shrink-0", className)}
      style={{ height, width: (height * WORDMARK.w) / WORDMARK.h }}
    />
  );
}

/**
 * Горизонтальний локап дизайнера — для шапок.
 *
 * Один файл, як його зробив дизайнер: нічого не складено й не
 * переставлено.
 */
export function Logo({
  height = 28,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <BrandImage
      asset={HORIZONTAL}
      alt="Crawldy"
      className={cx("shrink-0", className)}
      style={{ height, width: (height * HORIZONTAL.w) / HORIZONTAL.h }}
    />
  );
}

/**
 * Вертикальний локап дизайнера — там, де знак головний, а не супровід:
 * вхід, каса, порожні стани, листи.
 */
export function LogoStacked({
  width = 200,
  className,
}: {
  width?: number;
  className?: string;
}) {
  return (
    <BrandImage
      asset={VERTICAL}
      alt="Crawldy"
      className={cx("h-auto", className)}
      style={{ width }}
    />
  );
}
