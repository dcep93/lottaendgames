#!/usr/bin/env python3
"""Render the tested bishop-and-knight examples with the live board's SVG pieces.

Requires Pillow and the app's npm dev dependencies (including sharp).
"""
import argparse
import base64
import io
import json
import subprocess
from functools import cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / 'app/src/mate/rules/bishopKnightCornerFlushExample.json'
OUTPUT = ROOT / 'app/public/mate/bishop-knight/rule-r4-flush.gif'
SIZE, CELL = 1024, 128
LIGHT, DARK, INK = '#e8cfad', '#a87353', '#211711'
MOVE_STEPS, FRAME_MS, HOLD_MS = 12, 20, 950


@cache
def piece_sprites():
    result = subprocess.run(
        ['node', str(ROOT / 'app/scripts/render_chessboard_pieces.mjs'), str(CELL * 2)],
        check=True, capture_output=True, text=True,
    )
    return {
        symbol: Image.open(io.BytesIO(base64.b64decode(data))).convert('RGBA').resize(
            (CELL, CELL), Image.Resampling.LANCZOS,
        )
        for symbol, data in json.loads(result.stdout).items()
    }


def xy(square):
    return ord(square[0]) - ord('a'), 8 - int(square[1])


def pieces_from_fen(fen):
    result = {}
    for row, rank in enumerate(fen.split()[0].split('/')):
        col = 0
        for symbol in rank:
            if symbol.isdigit():
                col += int(symbol)
            else:
                result[symbol] = (col, row)
                col += 1
    return result


def render(pieces, diagonal, label, last_move=None):
    image = Image.new('RGB', (SIZE, SIZE), LIGHT)
    draw = ImageDraw.Draw(image)
    for row in range(8):
        for col in range(8):
            box = (col*CELL, row*CELL, (col+1)*CELL-1, (row+1)*CELL-1)
            draw.rectangle(box, fill=LIGHT if (row+col) % 2 == 0 else DARK)
    overlay = Image.new('RGBA', image.size)
    od = ImageDraw.Draw(overlay)
    for square in diagonal:
        col, row = xy(square)
        od.rectangle((col*CELL, row*CELL, (col+1)*CELL-1, (row+1)*CELL-1), fill=(70, 179, 172, 125))
    image = Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(image)
    if last_move:
        for square in last_move:
            col, row = xy(square)
            draw.rectangle((col*CELL+4, row*CELL+4, (col+1)*CELL-6, (row+1)*CELL-6), outline='#e950a0', width=6)
    for piece, (col, row) in pieces.items():
        sprite = piece_sprites()[piece]
        image.paste(sprite, (round(col*CELL), round(row*CELL)), sprite)
    small = ImageFont.load_default(size=26)
    for i in range(8):
        draw.text((i*CELL+6, SIZE-34), chr(ord('a')+i), font=small, fill=INK)
        draw.text((6, i*CELL+4), str(8-i), font=small, fill=INK)
    caption = ImageFont.load_default(size=46)
    bounds = draw.textbbox((0, 0), label, font=caption)
    width = bounds[2] - bounds[0]
    draw.rounded_rectangle((SIZE-width-50, SIZE-106, SIZE-16, SIZE-44), radius=10, fill=INK)
    draw.text((SIZE-width-34, SIZE-102), label, font=caption, fill='#fff8e9')
    return image


def generated_frames(example_path=EXAMPLE):
    example = json.loads(example_path.read_text())
    pieces = pieces_from_fen(example['fen'])
    frames = [render(pieces, example['highlightedDiagonal'], 'Start')]
    durations = [1000]
    for index, move in enumerate(example['moves']):
        start, end = xy(move['from']), xy(move['to'])
        piece = next(piece for piece, position in pieces.items() if position == start)
        label = f"{index//2+1}. {'…' if index%2 else ''}{move['san']}"
        for step in range(1, MOVE_STEPS + 1):
            progress = step / MOVE_STEPS
            fraction = progress * progress * (3 - 2 * progress)
            position = dict(pieces)
            position[piece] = (start[0]+(end[0]-start[0])*fraction, start[1]+(end[1]-start[1])*fraction)
            frames.append(render(position, example['highlightedDiagonal'], label, (move['from'], move['to'])))
            durations.append(FRAME_MS if step < MOVE_STEPS else HOLD_MS)
        pieces[piece] = end
    durations[-1] = 2400
    return frames, durations


def shared_palette(frames):
    # One palette keeps the board and antialiased piece edges stable between frames.
    samples = Image.new('RGB', (256, 256 * len(frames)))
    for index, frame in enumerate(frames):
        samples.paste(frame.resize((256, 256), Image.Resampling.LANCZOS), (0, index * 256))
    palette = samples.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    return [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--example', type=Path, default=EXAMPLE)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    frames, durations = generated_frames(args.example)
    frames = shared_palette(frames)
    buffer = io.BytesIO()
    frames[0].save(buffer, format='GIF', save_all=True, append_images=frames[1:], duration=durations, loop=0, disposal=1)
    content = buffer.getvalue()
    if args.check:
        if not args.output.exists() or args.output.read_bytes() != content:
            raise SystemExit(f'Out of date: {args.output}')
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(content)
    print(args.output)


if __name__ == '__main__':
    main()
