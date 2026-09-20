#!/usr/bin/env python3
"""
Готовит фирменные изображения из ../brand — сейчас это брендированный
автомобиль CLEAN OFFICE на синем фоне.

Кадры отдаются в двух вариантах:
  hero-van      — широкий, для десктопа: машина слева, справа чистый фон
                  под текст;
  hero-van-tall — квадратнее, для мобильного, где машина по центру.

Скрипт также печатает точный HEX фона: он должен совпадать с токеном
--brand-deep, иначе на краях панели будет видна стыковка.

Запуск:  npm run brand
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "brand"
OUT = ROOT / "public" / "img"

WIDTHS = [800, 1200, 1600, 2000]
QUALITY = 82

JOBS = [
    # (исходник, имя на сайте, соотношение сторон, доля кадра по горизонтали)
    ("van-wide.png", "hero-van", 16 / 9, None),
    ("van-wide.png", "hero-van-tall", 4 / 3, (0.0, 0.62)),
]


def crop_ratio(im: Image.Image, ratio: float, span):
    w, h = im.size

    if span:
        left, right = int(w * span[0]), int(w * span[1])
        im = im.crop((left, 0, right, h))
        w, h = im.size

    if w / h > ratio:
        nw = int(h * ratio)
        return im.crop((0, 0, nw, h)) if span else im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))

    nh = int(w / ratio)
    top = (h - nh) // 2
    return im.crop((0, top, w, top + nh))


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Нет папки с фирменными изображениями: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    made = 0
    for filename, name, ratio, span in JOBS:
        path = SRC / filename
        if not path.exists():
            print(f"  пропуск {name}: нет {filename}")
            continue

        base = Image.open(path).convert("RGB")
        bg = base.getpixel((base.width - 20, 20))
        frame = crop_ratio(base, ratio, span)

        for width in WIDTHS:
            if width > frame.width * 1.25:
                continue
            height = round(width / ratio)
            frame.resize((width, height), Image.LANCZOS).save(
                OUT / f"{name}-{width}.webp", "WEBP", quality=QUALITY, method=5
            )
            made += 1

        print(f"  {name:<15} {frame.width}x{frame.height}  фон #{bg[0]:02X}{bg[1]:02X}{bg[2]:02X}")

    print(f"\nГотово: {made} файлов. Фон обязан совпадать с токеном --brand-deep.")


if __name__ == "__main__":
    main()
