#!/usr/bin/env python3
"""Render the r3.8 maneuver from its tested example, keeping a2–g8 highlighted."""
import argparse
import io
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / 'app/src/mate/rules/bishopKnightSolidifyExample.json'
OUTPUT = ROOT / 'app/public/mate/bishop-knight/solidify-seven-diagonal.gif'
SIZE, CELL = 512, 64
LIGHT, DARK, INK = '#e8cfad', '#a87353', '#211711'
GLYPHS = {'K': '♚', 'k': '♚', 'B': '♝', 'N': '♞'}


def font_path():
    for path in ['/System/Library/Fonts/Apple Symbols.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if Path(path).exists():
            return path
    raise RuntimeError('A chess-symbol font (Apple Symbols or DejaVu Sans) is required')


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


def render(pieces, diagonal, label, font, last_move=None):
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
            draw.rectangle((col*CELL+2, row*CELL+2, (col+1)*CELL-3, (row+1)*CELL-3), outline='#e950a0', width=3)
    for piece, (col, row) in pieces.items():
        glyph = GLYPHS[piece]
        bounds = draw.textbbox((0, 0), glyph, font=font, stroke_width=1)
        x = (col+.5)*CELL - (bounds[2]+bounds[0])/2
        y = (row+.5)*CELL - (bounds[3]+bounds[1])/2
        draw.text((x, y), glyph, font=font, fill=INK if piece == 'k' else '#fff8e9',
                  stroke_width=1, stroke_fill='#fff8e9' if piece == 'k' else INK)
    small = ImageFont.load_default(size=13)
    for i in range(8):
        draw.text((i*CELL+3, SIZE-17), chr(ord('a')+i), font=small, fill=INK)
        draw.text((3, i*CELL+2), str(8-i), font=small, fill=INK)
    caption = ImageFont.load_default(size=23)
    bounds = draw.textbbox((0, 0), label, font=caption)
    width = bounds[2] - bounds[0]
    draw.rounded_rectangle((SIZE-width-25, SIZE-53, SIZE-8, SIZE-22), radius=5, fill=INK)
    draw.text((SIZE-width-17, SIZE-51), label, font=caption, fill='#fff8e9')
    return image


def generated_frames():
    example = json.loads(EXAMPLE.read_text())
    pieces = pieces_from_fen(example['fen'])
    font = ImageFont.truetype(font_path(), 76)
    frames = [render(pieces, example['highlightedDiagonal'], 'Start', font)]
    durations = [1400]
    for index, move in enumerate(example['moves']):
        start, end = xy(move['from']), xy(move['to'])
        piece = next(piece for piece, position in pieces.items() if position == start)
        label = f"{index//2+1}. {'…' if index%2 else ''}{move['san']}"
        for step in range(1, 11):
            fraction = step/10
            position = dict(pieces)
            position[piece] = (start[0]+(end[0]-start[0])*fraction, start[1]+(end[1]-start[1])*fraction)
            frames.append(render(position, example['highlightedDiagonal'], label, font, (move['from'], move['to'])))
            durations.append(40 if step < 10 else 1300)
        pieces[piece] = end
    durations[-1] = 3500
    return frames, durations


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    frames, durations = generated_frames()
    buffer = io.BytesIO()
    frames[0].save(buffer, format='GIF', save_all=True, append_images=frames[1:], duration=durations, loop=0, disposal=2)
    content = buffer.getvalue()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_bytes() != content:
            raise SystemExit(f'Out of date: {OUTPUT}')
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(content)
    print(OUTPUT)


if __name__ == '__main__':
    main()
