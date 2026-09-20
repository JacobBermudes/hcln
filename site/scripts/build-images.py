#!/usr/bin/env python3
"""
Готовит картинки-заглушки для сайта из скриншотов Pinterest в ../reference.

Скриншот — это 1206x2622 с чёрным фоном, панелью статуса сверху и парящими
кнопками поверх фотографии. Скрипт находит границы самой фотографии, поджимает
их, чтобы убрать кнопки «назад», «…» и «поиск», режет по нужным пропорциям и
сохраняет WebP в нескольких ширинах.

Запуск:  npm run images
"""

from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "reference"
OUT = ROOT / "public" / "img"

WIDTHS = [480, 800, 1200, 1600]
QUALITY = 78

# Порог «почти чёрного» фона Pinterest и доля светлых пикселей в строке,
# при которой считаем, что строка принадлежит фотографии.
DARK = 26
FILL = 0.55

# Насколько поджимаем найденный прямоугольник, чтобы убрать наложенные кнопки.
INSET_TOP = 0.11
INSET_BOTTOM = 0.09
INSET_SIDE = 0.015

# Пропорции вывода
RATIOS = {
    "hero": 16 / 10,
    "wide": 3 / 2,
    "card": 4 / 3,
    "portrait": 3 / 4,
    "square": 1 / 1,
}

# Что во что превращается. Ключ — имя на сайте, значение — исходник и кадр.
PLAN = [
    # первый экран и офисы
    ("hero-office", "IMG_2738.png", "hero"),
    ("seg-office", "IMG_2728.png", "card"),
    # фасады, окна, высотные работы
    ("seg-windows", "IMG_2730.png", "card"),
    ("case-facade", "IMG_2729.png", "wide"),
    ("work-facade", "IMG_2734.png", "card"),
    # производство и склады
    ("seg-warehouse", "IMG_2733.png", "card"),
    ("case-warehouse", "IMG_2733.png", "wide"),
    # химчистка, инвентарь, мойка
    ("seg-upholstery", "IMG_2735.png", "card"),
    ("equip-kit", "IMG_2736.png", "card"),
    ("seg-glass", "IMG_2737.png", "card"),
    # после ремонта
    ("seg-renovation", "IMG_2731.png", "card"),
    ("case-renovation", "IMG_2731.png", "wide"),
    # команда и работа на объекте
    ("team-work", "IMG_2739.png", "wide"),
    ("team-1", "IMG_2739.png", "portrait"),
    ("team-2", "IMG_2737.png", "portrait"),
    ("team-3", "IMG_2731.png", "portrait"),
    ("team-4", "IMG_2736.png", "portrait"),
    # брендирование
    ("brand-van", "IMG_2740.png", "wide"),
    # коллаж для блока «как мы работаем»
    ("steps-1", "IMG_2738.png", "portrait"),
    ("steps-2", "IMG_2739.png", "square"),
    ("steps-3", "IMG_2736.png", "square"),
    # пары «до / после» — один кадр делим пополам как временную заглушку
    ("ba-1-before", "IMG_2731.png", "card"),
    ("ba-1-after", "IMG_2738.png", "card"),
    ("ba-2-before", "IMG_2733.png", "card"),
    ("ba-2-after", "IMG_2728.png", "card"),
    ("ba-3-before", "IMG_2734.png", "card"),
    ("ba-3-after", "IMG_2730.png", "card"),
]


def photo_box(im: Image.Image) -> tuple[int, int, int, int]:
    """Границы фотографии внутри скриншота."""
    g = im.convert("L")
    w, h = g.size
    x0, x1 = int(w * 0.12), int(w * 0.88)
    step = max(1, (x1 - x0) // 60)

    def bright_row(y: int) -> bool:
        lit = sum(1 for x in range(x0, x1, step) if g.getpixel((x, y)) > DARK)
        return lit / len(range(x0, x1, step)) >= FILL

    # Статус-бар занимает верхние ~4% — начинаем ниже него.
    start = int(h * 0.045)
    top = None
    for y in range(start, h, 4):
        if bright_row(y):
            top = y
            break
    if top is None:
        return (0, 0, w, h)

    bottom = top
    misses = 0
    for y in range(top, h, 4):
        if bright_row(y):
            bottom = y
            misses = 0
        else:
            misses += 1
            if misses > 6:  # 24px подряд тёмных — фотография кончилась
                break

    # Боковые границы ищем по средней строке фотографии
    mid = (top + bottom) // 2
    left, right = 0, w
    for x in range(0, w // 2):
        if g.getpixel((x, mid)) > DARK:
            left = x
            break
    for x in range(w - 1, w // 2, -1):
        if g.getpixel((x, mid)) > DARK:
            right = x + 1
            break

    return (left, top, right, bottom)


def inset(box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    """Поджимает прямоугольник, убирая наложенные кнопки и скругления."""
    l, t, r, b = box
    w, h = r - l, b - t
    return (
        int(l + w * INSET_SIDE),
        int(t + h * INSET_TOP),
        int(r - w * INSET_SIDE),
        int(b - h * INSET_BOTTOM),
    )


def crop_ratio(im: Image.Image, ratio: float) -> Image.Image:
    """Кадрирует по центру под заданное соотношение сторон."""
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio)
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = int(w / ratio)
    # Смещаем кадр к верхней трети: в кадрах с людьми там интереснее.
    top = int((h - nh) * 0.35)
    return im.crop((0, top, w, top + nh))


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Нет папки с референсами: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    cache: dict[str, Image.Image] = {}
    made = 0

    for name, src_file, kind in PLAN:
        path = SRC / src_file
        if not path.exists():
            print(f"  пропуск {name}: нет {src_file}")
            continue

        if src_file not in cache:
            im = Image.open(path).convert("RGB")
            cache[src_file] = im.crop(inset(photo_box(im)))
        base = cache[src_file]

        frame = crop_ratio(base, RATIOS[kind])

        for width in WIDTHS:
            if width > frame.width * 1.15:
                continue
            height = round(width / RATIOS[kind])
            out = frame.resize((width, height), Image.LANCZOS)
            out.save(OUT / f"{name}-{width}.webp", "WEBP", quality=QUALITY, method=5)
            made += 1

        # Крошечная размытая заглушка под ленивую загрузку
        blur = frame.resize((20, max(1, round(20 / RATIOS[kind]))), Image.LANCZOS)
        blur = blur.filter(ImageFilter.GaussianBlur(1))
        blur.save(OUT / f"{name}-blur.webp", "WEBP", quality=40)

        print(f"  {name:<18} {src_file:<14} {kind:<9} {frame.width}x{frame.height}")

    print(f"\nГотово: {made} файлов в {OUT}")


if __name__ == "__main__":
    main()
