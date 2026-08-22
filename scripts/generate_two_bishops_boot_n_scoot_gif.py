#!/usr/bin/env python3
"""Generate the Two Bishops Boot N Scoot guide animation."""

from __future__ import annotations

import argparse
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "app/public/mate/two-bishops/boot-n-scoot.gif"
SIZE = 512
SQUARE = SIZE // 8
LIGHT = "#e8cfad"
DARK = "#a87353"
LAST_MOVE = "#ff7bc3"
WHITE_PIECE = "#fff8e9"
BLACK_PIECE = "#2c211c"
OUTLINE = "#17100d"

POSITIONS = [
    {"K": "d4", "B1": "e6", "B2": "a3", "k": "d2"},
    {"K": "d4", "B1": "g4", "B2": "a3", "k": "d2"},
    {"K": "d4", "B1": "g4", "B2": "a3", "k": "c2"},
    {"K": "c4", "B1": "g4", "B2": "a3", "k": "c2"},
    {"K": "c4", "B1": "g4", "B2": "a3", "k": "d2"},
    {"K": "c4", "B1": "g4", "B2": "c5", "k": "d2"},
]

LAST_MOVES = [None, ("e6", "g4"), ("d2", "c2"), ("d4", "c4"), ("c2", "d2"), ("a3", "c5")]
CAPTIONS = ["Start", "Bg4", "...Kc2", "Kc4", "...Kd2", "Bc5"]
DURATIONS = [1000, 1000, 1000, 1000, 1000, 5000]


def square_box(square: str) -> tuple[int, int, int, int]:
    file_index = ord(square[0]) - ord("a")
    rank_index = 8 - int(square[1])
    left = file_index * SQUARE
    top = rank_index * SQUARE
    return left, top, left + SQUARE, top + SQUARE


def centered_text(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, font: ImageFont.ImageFont, fill: str) -> None:
    bounds = draw.textbbox((0, 0), text, font=font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    left, top, right, bottom = box
    draw.text(
        ((left + right - width) / 2, (top + bottom - height) / 2 - bounds[1]),
        text,
        font=font,
        fill=fill,
    )


def render_frame(index: int) -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), LIGHT)
    draw = ImageDraw.Draw(image)

    highlighted = set(LAST_MOVES[index] or ())
    for rank_index in range(8):
        for file_index in range(8):
            square = f"{chr(ord('a') + file_index)}{8 - rank_index}"
            box = square_box(square)
            color = LAST_MOVE if square in highlighted else (LIGHT if (file_index + rank_index) % 2 == 0 else DARK)
            draw.rectangle(box, fill=color)

    piece_font = ImageFont.load_default(size=38)
    for piece_id, square in POSITIONS[index].items():
        left, top, right, bottom = square_box(square)
        inset = 7
        circle = (left + inset, top + inset, right - inset, bottom - inset)
        is_black = piece_id == "k"
        draw.ellipse(
            circle,
            fill=BLACK_PIECE if is_black else WHITE_PIECE,
            outline=WHITE_PIECE if is_black else OUTLINE,
            width=3,
        )
        centered_text(
            draw,
            circle,
            "K" if piece_id in {"K", "k"} else "B",
            piece_font,
            WHITE_PIECE if is_black else OUTLINE,
        )

    caption_font = ImageFont.load_default(size=23)
    caption = CAPTIONS[index]
    bounds = draw.textbbox((0, 0), caption, font=caption_font)
    padding = 7
    label_box = (
        SIZE - (bounds[2] - bounds[0]) - 2 * padding - 8,
        8,
        SIZE - 8,
        8 + (bounds[3] - bounds[1]) + 2 * padding,
    )
    draw.rounded_rectangle(label_box, radius=8, fill="#17100ddd")
    centered_text(draw, label_box, caption, caption_font, WHITE_PIECE)
    return image


def generated_bytes() -> bytes:
    frames = [render_frame(index) for index in range(len(POSITIONS))]
    buffer = io.BytesIO()
    frames[0].save(
        buffer,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=DURATIONS,
        loop=0,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = generated_bytes()

    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_bytes() != content:
            print(f"out of date: {OUTPUT}")
            return 1
        print(f"up to date: {OUTPUT}")
        return 0

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(content)
    print(f"wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
