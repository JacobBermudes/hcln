#!/usr/bin/env python3
"""
Готовит логотипы клиентов из ../case для блока кейсов и строки «Нам доверяют».

Растровые логотипы обрезаются по границам содержимого (в исходниках много
пустого поля), приводятся к общей высоте и сохраняются в WebP с прозрачным
фоном там, где фон белый. Векторный логотип копируется как есть.

Запуск:  npm run logos
"""

import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "case"
OUT = ROOT / "public" / "img" / "logos"

TARGET_H = 160  # 2x от отображаемой высоты ~80px
PAD = 6
WHITE_CUTOFF = 246  # что считаем белым фоном

RASTER = [
    # (файл-исходник, имя на сайте, убирать ли белый фон)
    ("dinamo-lettering-cal.png", "dinamo", True),
    ("Снимок экрана 2026-08-11 в 00.19.05.png", "klassiki", False),
]

VECTOR = [("Brusnika_logo.svg", "brusnika.svg")]


def content_box(im: Image.Image, drop_white: bool):
    """Границы непустого содержимого."""
    # Альфа годится, только если она действительно прозрачная хоть где-то.
    # У «Динамо» альфа-канал есть, но полностью непрозрачный — фон там белый.
    if im.mode == "RGBA":
        alpha = im.getchannel("A")
        if alpha.getextrema()[0] < 255:
            box = alpha.getbbox()
            if box:
                return box

    if not drop_white:
        return im.getbbox() or (0, 0, im.width, im.height)

    # Инвертируем яркость, чтобы getbbox() увидел тёмное содержимое на белом
    gray = im.convert("L")
    mask = gray.point(lambda v: 0 if v >= WHITE_CUTOFF else 255)
    return mask.getbbox() or (0, 0, im.width, im.height)


def whiten_to_alpha(im: Image.Image) -> Image.Image:
    """Делает белый фон прозрачным, сохраняя мягкие края."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= WHITE_CUTOFF and g >= WHITE_CUTOFF and b >= WHITE_CUTOFF:
                px[x, y] = (r, g, b, 0)
    return im


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Нет папки с логотипами: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    for filename, name, drop_white in RASTER:
        path = SRC / filename
        if not path.exists():
            print(f"  пропуск {name}: нет {filename}")
            continue

        im = Image.open(path)
        im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")

        im = im.crop(content_box(im, drop_white))

        if drop_white:
            im = whiten_to_alpha(im)
        else:
            im = im.convert("RGBA")

        # Приводим к общей высоте, ширина — пропорционально
        scale = TARGET_H / im.height
        size = (max(1, round(im.width * scale)), TARGET_H)
        im = im.resize(size, Image.LANCZOS)

        # Поле вокруг, чтобы логотипы не липли к краю плитки
        canvas = Image.new("RGBA", (im.width + PAD * 2, im.height + PAD * 2), (0, 0, 0, 0))
        canvas.paste(im, (PAD, PAD), im)

        canvas.save(OUT / f"{name}.webp", "WEBP", quality=92, lossless=False)
        print(f"  {name:<12} {canvas.width}x{canvas.height}")

    for filename, out_name in VECTOR:
        path = SRC / filename
        if path.exists():
            shutil.copy(path, OUT / out_name)
            print(f"  {out_name:<12} вектор, скопирован")

    print(f"\nГотово: {OUT}")


if __name__ == "__main__":
    main()
