import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Консоль Windows у cp1251 перетворює українські повідомлення assert'ів
# на мотлох — читати провалений тест стає неможливо.
for _stream in (sys.stdout, sys.stderr):
    _reconfigure = getattr(_stream, "reconfigure", None)
    if _reconfigure is not None:
        _reconfigure(encoding="utf-8", errors="replace")


# Знімки вибірки їдуть у репозиторії архівом, а пʼять тестів читають їх
# розпакованими. Поки це робив рукою той, хто про це знав, свіжий клон давав
# пʼять червоних тестів із голим `StopIteration` — і людина, яка бачить набір
# уперше, не відрізнить «треба розпакувати» від «я щось зламав». Тека лежить
# у `.gitignore`, тобто це артефакт збірки, а не вміст репозиторію: зібрати
# його має той, кому він потрібен.
def _unpack_benchmark_snapshots() -> None:
    import tarfile

    bench = Path(__file__).resolve().parents[1] / "benchmark"
    target = bench / "snapshots"
    if target.is_dir() and any(target.glob("*.json")):
        return
    archive = bench / "snapshots-auditlens-set.tar.gz"
    if not archive.is_file():
        return
    target.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, "r:gz") as tf:
        for member in tf.getmembers():
            # Архів наш, але розпакування за іменем ІЗ архіву — клас помилок,
            # у якого є власне імʼя. Беремо лише плоскі `.json`.
            name = Path(member.name).name
            if not member.isfile() or not name.endswith(".json"):
                continue
            handle = tf.extractfile(member)
            if handle is None:
                continue
            (target / name).write_bytes(handle.read())


_unpack_benchmark_snapshots()


# Налаштування платежів фіксуються ДО імпорту застосунку: інакше тести
# читали б `.env` розробника, і зелений набір означав би «на цій машині
# так налаштовано», а не «код такий».
#
# Найгірший варіант тут — не червоний прогін, а тихий: тест, що взяв
# справжній ключ провайдера з `.env` і пішов у мережу за гроші.
_PAYMENT_TEST_ENV = {
    # Оточення теж фіксується. `prod` міняє cookie сесії на префікс
    # `__Host-`, який вимагає HTTPS, — тестовий клієнт ходить по HTTP і
    # такий cookie не збереже, тож автентифікація мовчки ламається, а
    # падають натомість тести сайтів, розкладів і квоти. Одного разу
    # цього вистачило, щоб 134 перевірки почервоніли через рядок у
    # `.env`, поставлений заради тунелю.
    "APP_ENV": "local",
    "BILLING_PROVIDER": "fake",
    "PADDLE_ENV": "sandbox",
    "PADDLE_API_KEY": "",
    "PADDLE_CLIENT_TOKEN": "",
    "PADDLE_WEBHOOK_SECRET": "",
    "PADDLE_FULL_AUDIT_PRICE_ID": "",
}
for _name, _value in _PAYMENT_TEST_ENV.items():
    import os as _os

    _os.environ[_name] = _value
