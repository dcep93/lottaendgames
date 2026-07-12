#!/usr/bin/env python3
"""Promote verified PDF diagram captions to position sections.

The extractor intentionally learns from already verified chapter 5-9 diagrams
and applies that template set to later chapters. It only promotes simple,
legal-looking diagrams; marker-heavy diagrams stay as captions until they can be
represented with explicit markers.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import pdfplumber
import pypdfium2 as pdfium
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf"
PDF_DIR = ROOT / "app/src/app_x/pdf"
TMP_DIR = ROOT / "tmp/pdfs/extracted_diagrams"
REPORT_PATH = PDF_DIR / "diagram_extraction_report.json"
DPI = 240
CELL_SIZE = 20
TARGET_CHAPTERS = (1, 3, 4, 10, 11, 12, 13)
TARGET_PAGE_RANGE = range(28, 230)

resolved_pdftoppm = shutil.which("pdftoppm")
PDFTOPPM = Path(resolved_pdftoppm) if resolved_pdftoppm else None

TRAINING_EXCLUDES = {
    # Marker diagrams and previously identified bad or ambiguous source FENs.
    "5.2",
    "5.5",
    "5.15",
    "6.2",
    "6.5",
    "7.1",
    "7.6",
    "8.4",
    "8.6",
    "9.4",
    "9.16",
    "9.18",
}

VERIFIED_DIAGRAM_FENS = {
    # Chapter 1 uses small pedagogical diagrams with square shading and
    # printed key-square markers. The generic classifier reads those markers as
    # pieces, so these placements are verified from targeted PDF renders.
    "Position 1.1": "6k1/8/8/8/8/8/P7/7K w - - 0 1",
    "Position 1.2": "6k1/8/8/8/P7/8/8/7K b - - 0 1",
    "Position 1.3": "8/4k3/2K5/8/8/8/1P6/8 w - - 0 1",
    "Position 1.4": "5k2/8/5PK1/8/8/8/8/8 w - - 0 1",
    "Position 1.5": "6k1/8/5PK1/8/8/8/8/8 w - - 0 1",
    "Position 1.6": "k7/8/2P5/K7/8/8/8/8 w - - 0 1",
    "Position 1.7": "8/6k1/4P3/6K1/8/8/8/8 w - - 0 1",
    "Position 1.8": "8/8/8/8/8/5kp1/7K/8 w - - 0 1",
    "Position 1.9": "5k2/8/4K3/5P2/8/8/8/8 w - - 0 1",
    "Position 1.10": "7k/5K2/8/6P1/8/8/8/8 w - - 0 1",
    "Position 1.11": "5k2/8/8/8/3PK3/8/8/8 w - - 0 1",
    "Position 1.12": "8/8/8/1kp5/8/8/8/K7 w - - 0 1",
    "Position 1.13": "8/6k1/8/6K1/8/6P1/8/8 w - - 0 1",
    "Position 1.14": "8/8/8/8/8/6kp/8/6K1 w - - 0 1",
    "Position 1.15": "8/7p/7p/7p/7p/6kp/7p/6K1 w - - 0 1",
    "Position 1.16": "8/8/8/8/p7/k7/2K5/8 w - - 0 1",
    "Position 1.17": "6k1/5R2/6K1/8/8/8/8/6b1 w - - 0 1",
    "Position 1.18": "7k/R7/7K/8/8/1b6/8/8 w - - 0 1",
    "Position 1.19": "8/8/8/8/8/3k4/r7/3NK3 w - - 0 1",
    "Analysis diagram 1.20": "8/8/8/3N4/8/5k2/2r5/4K3 b - - 0 4",
    "Position 1.21": "8/8/8/8/8/6k1/r7/6NK w - - 0 1",
    "Position 1.22": "8/8/8/8/8/6k1/r7/6KN w - - 0 1",
    "Position 1.23": "r7/8/8/8/8/6k1/6N1/7K w - - 0 1",
    "Position 1.24": "8/8/8/8/8/5K2/7R/4nk2 w - - 0 1",
    "Position 1.25": "8/7R/8/8/8/8/4K1n1/6k1 b - - 0 11",
    # Chapters 3 and 4 are early educational diagrams with the same noisy
    # square texture as Chapter 1. These FENs are verified from targeted PDF
    # renders; stars, borders, and printed zone labels live in markers.
    "Position 3.1": "8/8/K7/8/8/1k6/1N1p4/8 w - - 0 1",
    "Position 3.2": "8/8/8/8/5N2/7K/3p4/3k4 w - - 0 1",
    "Position 3.3": "8/8/8/8/4N3/1p5K/8/1k6 b - - 0 1",
    "Position 3.4": "8/8/K7/4N3/8/7p/7k/8 w - - 0 1",
    "Position 3.5": "K7/8/8/5N2/8/3k3p/8/8 w - - 0 1",
    "Analysis diagram 3.6": "8/1K6/8/8/8/3k2N1/7p/8 b - - 0 2",
    "Position 3.7": "8/2K5/8/8/4N3/2k5/7p/8 b - - 0 1",
    "Analysis diagram 3.8": "8/2K5/8/8/3k4/5N1p/8/8 b - - 0 2",
    "Position 3.9": "8/8/8/8/8/p7/2K1N3/k7 w - - 0 1",
    "Position 3.10": "4k3/1n6/8/P7/8/8/7K/8 w - - 0 1",
    "Position 4.1": "6K1/8/3Q4/8/8/8/5kp1/8 w - - 0 1",
    "Position 4.2": "2Q5/3K4/8/8/8/8/3kp3/8 w - - 0 1",
    "Position 4.3": "8/5K1P/8/8/3q4/8/8/2k5 w - - 0 1",
    "Position 4.4": "8/6KP/8/4k3/3q4/8/8/8 w - - 0 1",
    "Analysis diagram 4.5": "6KQ/4q1k1/8/8/8/8/8/8 w - - 0 1",
    "Position 4.6": "8/5P2/3K4/8/8/1k6/8/q7 w - - 0 1",
    "Position 4.7": "8/5PK1/8/6k1/8/8/q7/8 b - - 0 1",
    "Position 4.8": "8/4KP2/8/8/6k1/8/8/q7 b - - 0 1",
    "Position 4.9": "8/4KP2/8/1k6/8/8/8/q7 b - - 0 1",
    "Position 4.10": "8/8/8/3K4/4Q3/8/2p5/1k6 w - - 0 1",
    "Analysis diagram 4.11": "8/8/8/3K4/8/4Q3/1kp5/8 b - - 0 4",
    "Position 4.12": "8/8/8/4K3/1Q6/8/2pk4/8 w - - 0 1",
    "Position 4.13": "8/8/8/8/8/k2K4/2Q5/q7 w - - 0 1",
    # Position 10.17 has a black rook on b8. The template classifier picked the
    # white rook color, but the rendered PDF diagram and adjacent line
    # 1...Ra8 confirm Black is the side with that rook.
    "Position 10.17": "1r6/8/8/2R5/1P1k4/1K6/8/8 b - - 0 1",
    # Analysis diagram 11.2 renders a black rook on g7, but the printed glyph
    # is close enough to the white rook template that the classifier chooses
    # the wrong color. Keep this correction tied to the rendered PDF diagram so
    # regenerated JSON stays source-derived instead of hand-patched.
    "Analysis diagram 11.2": "R7/2k3r1/8/2KP4/3P4/8/8/8 w - - 0 1",
    # Position 13.4 contains the bishop on g1 and knight on h1. The knight is
    # missed by the template classifier, but the following printed line starts
    # with Nh1-g3/Nh1-f2, confirming the rendered diagram state.
    "Position 13.4": "8/8/8/8/4k3/8/6K1/6BN w - - 0 1",
    # Analysis diagram 13.5 has route-line artwork over a simple four-piece
    # bishop-and-knight mate position.
    "Analysis diagram 13.5": "2k5/B1N5/2K5/8/8/8/8/8 b - - 0 16",
    # Analysis diagram 13.6 is a marker diagram in the bishop-and-knight mate.
    # The classifier mistakes the stars for pawns and misses the knight.
    "Analysis diagram 13.6": "8/B3N3/3K1k2/8/8/8/8/8 w - - 0 20",
    # Position 13.7 has printed star markers on the 7th rank; the classifier
    # read them as pawns and also chose the wrong rook color on e7.
    "Position 13.7": "3k4/4r3/3K4/3B4/8/8/8/5R2 w - - 0 1",
    # Position 13.8 is after 4...Rc1 in the Philidor R+B vs R line, so the
    # rook on c1 is black and White is to move despite the following text
    # beginning with alternatives to Black's previous move.
    "Position 13.8": "3k4/1R6/3K4/3B4/8/8/8/2r5 w - - 0 5",
    # Position 13.10 has the defending rook on c7 and the attacking rook on
    # d1; the classifier promoted the black rook as a white rook.
    "Position 13.10": "1k6/2r5/1K6/1B6/8/8/8/3R4 w - - 0 1",
    # Position 13.12 includes three printed star markers; the classifier read
    # those as pieces and rejected the otherwise simple Cochrane Defence board.
    "Position 13.12": "8/8/5k2/r7/4BK2/8/7R/8 b - - 0 1",
    # The queen-vs-rook+pawn diagrams use a queen glyph that sits close to the
    # king template, so the classifier kept these as captions. The FENs below
    # are verified against the rendered PDF diagrams and the adjacent move text.
    "Position 13.25": "8/4k3/4p3/3r4/4K3/7Q/8/8 w - - 0 1",
    "Position 13.26": "6Q1/8/4pk2/3r4/6K1/8/8/8 b - - 0 4",
    "Analysis diagram 13.27": "8/2Q5/4p3/3k1r2/6K1/8/8/8 b - - 0 11",
    "Position 13.28": "4k3/4p3/3r4/4K3/7Q/8/8/8 w - - 0 1",
    "Position 13.29": "8/1k6/p5Q1/1r6/1K6/8/8/8 w - - 0 1",
    "Analysis diagram 13.30": "kr6/8/p1KQ4/8/8/8/8/8 b - - 0 10",
    # Positions 13.21 and 13.22 print star markers on the bishop diagonal.
    # The classifier treated those stars as pawns, so keep only the real pieces.
    "Position 13.21": "7k/R7/7P/6K1/8/8/2b5/8 w - - 0 1",
    "Position 13.22": "7k/1R6/8/6KP/8/8/2b5/8 w - - 0 1",
}

VERIFIED_DIAGRAM_MARKERS = {
    "Position 1.9": [
        {"square": "f6", "symbol": "*", "meaning": "as printed"},
        {"square": "g6", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 1.11": [
        {"square": "c6", "symbol": "*", "meaning": "as printed"},
        {"square": "d6", "symbol": "*", "meaning": "as printed"},
        {"square": "e6", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 1.12": [
        {"square": "b3", "symbol": "*", "meaning": "as printed"},
        {"square": "c3", "symbol": "*", "meaning": "as printed"},
        {"square": "d3", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 1.16": [
        {"square": "b2", "symbol": "*", "meaning": "as printed"},
        {"square": "b1", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 3.4": [
        {"square": "g4", "symbol": "*", "meaning": "as printed"},
        {"square": "e3", "symbol": "*", "meaning": "as printed"},
        {"square": "f1", "symbol": "*", "meaning": "as printed"},
    ],
    "Analysis diagram 3.6": [
        {"square": "e4", "symbol": "*", "meaning": "as printed"},
        {"square": "e3", "symbol": "*", "meaning": "as printed"},
        {"square": "d2", "symbol": "*", "meaning": "as printed"},
        {"square": "e2", "symbol": "*", "meaning": "as printed"},
    ],
    "Analysis diagram 3.8": [
        {"square": "e5", "symbol": "*", "meaning": "as printed"},
        {"square": "e4", "symbol": "*", "meaning": "as printed"},
        {"square": "d3", "symbol": "*", "meaning": "as printed"},
        {"square": "e3", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 4.4": [
        {"square": "f7", "symbol": "2", "meaning": "as printed"},
        {"square": "g6", "symbol": "2", "meaning": "as printed"},
    ],
    "Position 4.7": [
        {"square": "e7", "symbol": "2", "meaning": "as printed"},
        {"square": "g6", "symbol": "2", "meaning": "as printed"},
    ],
    "Position 4.8": [
        {"square": "d7", "symbol": "2", "meaning": "as printed"},
        {"square": "g6", "symbol": "2", "meaning": "as printed"},
    ],
    "Position 4.9": [
        {"square": "d7", "symbol": "2", "meaning": "as printed"},
        {"square": "g6", "symbol": "2", "meaning": "as printed"},
    ],
    "Analysis diagram 13.6": [
        {"square": "g6", "symbol": "*", "meaning": "as printed"},
        {"square": "f5", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 13.7": [
        {"square": "b7", "symbol": "*", "meaning": "as printed"},
        {"square": "c7", "symbol": "*", "meaning": "as printed"},
        {"square": "d7", "symbol": "*", "meaning": "as printed"},
        {"square": "f7", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 13.12": [
        {"square": "d8", "symbol": "*", "meaning": "as printed"},
        {"square": "h4", "symbol": "*", "meaning": "as printed"},
        {"square": "e1", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 13.21": [
        {"square": "b1", "symbol": "*", "meaning": "as printed"},
        {"square": "d3", "symbol": "*", "meaning": "as printed"},
        {"square": "e4", "symbol": "*", "meaning": "as printed"},
        {"square": "f5", "symbol": "*", "meaning": "as printed"},
    ],
    "Position 13.22": [
        {"square": "b1", "symbol": "*", "meaning": "as printed"},
        {"square": "d3", "symbol": "*", "meaning": "as printed"},
        {"square": "e4", "symbol": "*", "meaning": "as printed"},
        {"square": "f5", "symbol": "*", "meaning": "as printed"},
    ],
}

VERIFIED_DIAGRAM_PRESERVE_TURN = {
    "Position 1.16",
    "Position 3.7",
    "Analysis diagram 3.8",
    "Position 13.8",
    "Analysis diagram 13.30",
}


def main() -> None:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    templates = train_templates()
    extracted = extract_chapter_positions(templates)
    report: list[dict[str, Any]] = []
    promoted_count = 0

    for chapter in TARGET_CHAPTERS:
        path = PDF_DIR / f"chapter_{chapter}.json"
        sections: list[dict[str, Any]] = json.loads(path.read_text())
        sections = split_embedded_labels(sections, extracted)
        rewritten: list[dict[str, Any]] = []
        promoted_numbers: set[str] = set()

        for section_index, section in enumerate(sections):
            if is_cross_chapter_section(chapter, section):
                continue

            existing_label = position_label(section)

            if existing_label:
                content = section["content"]
                promoted_numbers.add(content["number"])
                position = extracted.get(existing_label) or verified_position(existing_label)
                if position and should_promote(existing_label, position):
                    position_content = {
                        "number": content["number"],
                        "fen": get_position_fen_for_section(
                            existing_label,
                            position["fen"],
                            sections[section_index + 1 : section_index + 4],
                        ),
                        "caption": content.get("caption", existing_label),
                    }
                    if position.get("markers"):
                        position_content["markers"] = position["markers"]
                    section = {
                        "type": "position",
                        "content": position_content,
                    }
                report.append(
                    {
                        "chapter": chapter,
                        "fen": section["content"]["fen"],
                        "issues": position.get("issues") if position else [],
                        "label": existing_label,
                        "number": content["number"],
                        "status": "promoted-with-warnings"
                        if position and position["issues"]
                        else "promoted",
                    }
                )
                rewritten.append(section)
                continue

            label = caption_label(section)
            position = extracted.get(label or "") or verified_position(label or "")

            if (
                position
                and should_promote(label or "", position)
                and position["number"] not in promoted_numbers
            ):
                position_content = {
                    "number": position["number"],
                    "fen": get_position_fen_for_section(
                        position["label"],
                        position["fen"],
                        sections[section_index + 1 : section_index + 4],
                    ),
                    "caption": position["label"],
                }
                if position.get("markers"):
                    position_content["markers"] = position["markers"]
                rewritten.append(
                    {
                        "type": "position",
                        "content": position_content,
                    }
                )
                report.append(
                    {
                        "chapter": chapter,
                        "fen": position["fen"],
                        "issues": position["issues"],
                        "label": position["label"],
                        "number": position["number"],
                        "status": "promoted-with-warnings"
                        if position["issues"]
                        else "promoted",
                    }
                )
                promoted_numbers.add(position["number"])
                promoted_count += 1
                continue

            if label:
                report.append(
                    {
                        "chapter": chapter,
                        "fen": position.get("fen") if position else None,
                        "issues": position.get("issues") if position else [],
                        "label": label,
                        "number": position.get("number") if position else None,
                        "reason": "duplicate printed position label"
                        if position and position["number"] in promoted_numbers
                        else get_rejection_reason(label, position),
                        "status": "kept-caption",
                    }
                )

            rewritten.append(section)

        path.write_text(json.dumps(rewritten, indent=2, ensure_ascii=False) + "\n")

    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/build_chapter_payload.py")],
        check=True,
    )
    print(f"Promoted {promoted_count} extracted diagrams.")


def train_templates() -> dict[str, list[float]]:
    known: dict[str, str] = {}
    marked: set[str] = set()

    for chapter in range(5, 10):
        sections = json.loads((PDF_DIR / f"chapter_{chapter}.json").read_text())
        for section in sections:
            if section["type"] != "position":
                continue
            content = section["content"]
            known[content["number"]] = content["fen"]
            if content.get("markers"):
                marked.add(content["number"])

    items: list[dict[str, Any]] = []
    seen: set[str] = set()

    with pdfplumber.open(PDF) as pdf:
        for page_number in range(69, 124):
            page = pdf.pages[page_number - 1]
            labels = [
                label
                for label in extract_labels(page)
                if label["number"] in known
                and label["number"] not in marked
                and label["number"] not in TRAINING_EXCLUDES
                and label["number"] not in seen
            ]

            if not labels:
                continue

            boards = extract_page_boards(page_number, page)

            for label in labels:
                board = nearest_board(label, boards, max_distance=30)
                if not board:
                    continue
                seen.add(label["number"])
                expected_cells = fen_to_cells(known[label["number"]])
                features = board_features(board["image"])

                for rank in range(8):
                    for file in range(8):
                        items.append(
                            {
                                "piece": expected_cells[rank][file],
                                "vector": features[(rank, file)]["vector"],
                            }
                        )

    counts: Counter[str] = Counter()
    sums: dict[str, list[float]] = {}

    for item in items:
        piece = item["piece"]
        vector = item["vector"]
        counts[piece] += 1
        sums.setdefault(piece, [0.0] * len(vector))
        for index, value in enumerate(vector):
            sums[piece][index] += value

    return {
        piece: [value / counts[piece] for value in vector]
        for piece, vector in sums.items()
    }


def extract_chapter_positions(
    templates: dict[str, list[float]],
) -> dict[str, dict[str, Any]]:
    extracted: dict[str, dict[str, Any]] = {}

    with pdfplumber.open(PDF) as pdf:
        for page_number in TARGET_PAGE_RANGE:
            page = pdf.pages[page_number - 1]
            labels = [
                label
                for label in extract_labels(page)
                if int(label["number"].split(".")[0]) in TARGET_CHAPTERS
            ]

            if not labels:
                continue

            boards = extract_page_boards(page_number, page)

            for label in labels:
                # Some later-chapter labels sit below or beside the board rather
                # than just above it; keep pairing permissive and let the
                # legality/ambiguity checks decide whether promotion is safe.
                board = nearest_board(label, boards, max_distance=80)
                if not board:
                    if label["label"] in VERIFIED_DIAGRAM_FENS:
                        extracted_position = {
                            "fen": VERIFIED_DIAGRAM_FENS[label["label"]],
                            "issues": [],
                            "label": label["label"],
                            "number": label["number"],
                        }
                        if label["label"] in VERIFIED_DIAGRAM_MARKERS:
                            extracted_position["markers"] = VERIFIED_DIAGRAM_MARKERS[
                                label["label"]
                            ]
                        extracted[label["label"]] = extracted_position
                    continue

                fen, issues = fen_from_board(board["image"], templates)
                if label["label"] in VERIFIED_DIAGRAM_FENS:
                    fen = VERIFIED_DIAGRAM_FENS[label["label"]]
                    issues = []
                extracted_position = {
                    "fen": fen,
                    "issues": issues,
                    "label": label["label"],
                    "number": label["number"],
                }
                if label["label"] in VERIFIED_DIAGRAM_MARKERS:
                    extracted_position["markers"] = VERIFIED_DIAGRAM_MARKERS[
                        label["label"]
                    ]
                extracted[label["label"]] = extracted_position

    return extracted


def verified_position(label: str) -> dict[str, Any] | None:
    if label not in VERIFIED_DIAGRAM_FENS:
        return None

    number_match = re.search(r"(\d+\.\d+)", label)
    if not number_match:
        return None

    position: dict[str, Any] = {
        "fen": VERIFIED_DIAGRAM_FENS[label],
        "issues": [],
        "label": label,
        "number": number_match.group(1),
    }
    if label in VERIFIED_DIAGRAM_MARKERS:
        position["markers"] = VERIFIED_DIAGRAM_MARKERS[label]
    return position


def render_page(page_number: int) -> Image.Image:
    prefix = TMP_DIR / f"p{page_number}"
    pdfium_cache = TMP_DIR / f"p{page_number}.png"
    matches = list(TMP_DIR.glob(f"p{page_number}-*.png"))

    if matches:
        return Image.open(matches[0]).convert("RGB")

    if pdfium_cache.exists():
        return Image.open(pdfium_cache).convert("RGB")

    if PDFTOPPM:
        subprocess.run(
            [
                str(PDFTOPPM),
                "-r",
                str(DPI),
                "-f",
                str(page_number),
                "-l",
                str(page_number),
                "-png",
                str(PDF),
                str(prefix),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        matches = list(TMP_DIR.glob(f"p{page_number}-*.png"))
        if matches:
            return Image.open(matches[0]).convert("RGB")

    pdf = pdfium.PdfDocument(PDF)
    page = pdf[page_number - 1]
    image = page.render(scale=DPI / 72).to_pil().convert("RGB")
    image.save(pdfium_cache)
    return image


def extract_page_boards(
    page_number: int,
    page: pdfplumber.page.Page,
) -> list[dict[str, Any]]:
    page_image = render_page(page_number)
    boards: list[dict[str, Any]] = []

    for image in page.images:
        if image["width"] < 120 or image["height"] < 120:
            continue

        crop = crop_pdf_image(page_image, image)
        for board_image, top_offset_ratio in split_pdf_image_boards(crop):
            boards.append(
                {
                    "top": image["top"] + image["height"] * top_offset_ratio,
                    "image": crop_board_border(board_image),
                }
            )

    return boards


def split_pdf_image_boards(image: Image.Image) -> list[tuple[Image.Image, float]]:
    width, height = image.size
    aspect = width / height

    if 0.7 <= aspect <= 1.4:
        return [(image, 0)]

    if aspect > 1.4:
        count = round(aspect)
        if 2 <= count <= 4:
            return [
                (
                    image.crop(
                        (
                            round(index * width / count),
                            0,
                            round((index + 1) * width / count),
                            height,
                        )
                    ),
                    0,
                )
                for index in range(count)
            ]

    if aspect < 0.7:
        count = round(height / width)
        if 2 <= count <= 4:
            return [
                (
                    image.crop(
                        (
                            0,
                            round(index * height / count),
                            width,
                            round((index + 1) * height / count),
                        )
                    ),
                    index / count,
                )
                for index in range(count)
            ]

    return []


def crop_pdf_image(page_image: Image.Image, image: dict[str, Any]) -> Image.Image:
    scale = DPI / 72
    return page_image.crop(
        (
            round(image["x0"] * scale),
            round(image["top"] * scale),
            round((image["x0"] + image["width"]) * scale),
            round((image["top"] + image["height"]) * scale),
        )
    )


def crop_board_border(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    width, height = gray.size
    pixels = gray.load()
    row_counts = [
        sum(1 for x in range(width) if pixels[x, y] < 70) for y in range(height)
    ]
    column_counts = [
        sum(1 for y in range(height) if pixels[x, y] < 70) for x in range(width)
    ]
    row_lines = [
        round((start + end) / 2)
        for start, end in consecutive_groups(
            index for index, count in enumerate(row_counts) if count > 0.55 * width
        )
    ]
    column_lines = [
        round((start + end) / 2)
        for start, end in consecutive_groups(
            index
            for index, count in enumerate(column_counts)
            if count > 0.55 * height or count > 260
        )
    ]
    best: tuple[float, int, int, int, int, int] | None = None

    for top in row_lines:
        for bottom in row_lines:
            if bottom <= top:
                continue
            board_height = bottom - top
            if board_height < 250:
                continue

            for left in column_lines:
                for right in column_lines:
                    if right <= left:
                        continue
                    board_width = right - left
                    if board_width < 250:
                        continue
                    if not 0.82 <= board_width / board_height <= 1.18:
                        continue

                    aspect_error = abs(1 - board_width / board_height)
                    score = board_width + board_height
                    if best is None or (aspect_error, -score) < (
                        best[0],
                        -best[1],
                    ):
                        best = (aspect_error, score, left, top, right, bottom)

    if best:
        _, _, left, top, right, bottom = best
        padding = 2
        return image.crop(
            (
                max(0, left - padding),
                max(0, top - padding),
                min(width, right + padding),
                min(height, bottom + padding),
            )
        ).resize((512, 512))

    side = min(width, height)
    left = 0 if width <= height else (width - side) // 2
    top = 0 if height >= width else (height - side) // 2
    return image.crop((left, top, left + side, top + side)).resize((512, 512))


def consecutive_groups(indices: Any) -> list[tuple[int, int]]:
    groups: list[tuple[int, int]] = []
    start: int | None = None
    previous: int | None = None

    for index in indices:
        if start is None:
            start = index
            previous = index
            continue
        if previous is not None and index == previous + 1:
            previous = index
            continue
        groups.append((start, previous if previous is not None else start))
        start = index
        previous = index

    if start is not None:
        groups.append((start, previous if previous is not None else start))

    return groups


def extract_labels(page: pdfplumber.page.Page) -> list[dict[str, Any]]:
    words = page.extract_words(x_tolerance=3, y_tolerance=3, keep_blank_chars=False)
    labels: list[dict[str, Any]] = []
    index = 0

    while index < len(words):
        word = words[index]["text"]

        if (
            word == "Position"
            and index + 1 < len(words)
            and re.fullmatch(r"\d{1,2}\.\d+[a-z]?", words[index + 1]["text"])
        ):
            number = words[index + 1]["text"]
            labels.append(
                {
                    "label": f"Position {number}",
                    "number": number,
                    "top": words[index]["top"],
                }
            )
            index += 2
            continue

        if (
            word == "Analysis"
            and index + 2 < len(words)
            and words[index + 1]["text"] == "diagram"
            and re.fullmatch(r"\d{1,2}\.\d+[a-z]?", words[index + 2]["text"])
        ):
            number = words[index + 2]["text"]
            labels.append(
                {
                    "label": f"Analysis diagram {number}",
                    "number": number,
                    "top": words[index]["top"],
                }
            )
            index += 3
            continue

        index += 1

    return labels


def nearest_board(
    label: dict[str, Any],
    boards: list[dict[str, Any]],
    max_distance: int,
) -> dict[str, Any] | None:
    if not boards:
        return None

    board = min(boards, key=lambda item: abs(item["top"] - (label["top"] - 15)))
    if abs(board["top"] - (label["top"] - 15)) > max_distance:
        return None

    return board


def raw_cell(board: Image.Image, rank: int, file: int) -> Image.Image:
    gray = ImageOps.grayscale(board)
    side = min(gray.size)
    padding = int(side * 0.018)
    cell = (side - 2 * padding) / 8
    margin = cell * 0.08
    return gray.crop(
        (
            round(padding + file * cell + margin),
            round(padding + rank * cell + margin),
            round(padding + (file + 1) * cell - margin),
            round(padding + (rank + 1) * cell - margin),
        )
    ).resize((CELL_SIZE, CELL_SIZE))


def board_features(board: Image.Image) -> dict[tuple[int, int], dict[str, Any]]:
    raw_cells = {
        (rank, file): list(raw_cell(board, rank, file).tobytes())
        for rank in range(8)
        for file in range(8)
    }
    empty_templates: dict[int, list[int]] = {}

    for parity in (0, 1):
        squares = [
            (rank, file)
            for rank in range(8)
            for file in range(8)
            if (rank + file) % 2 == parity
        ]
        empty_square = min(
            squares,
            key=lambda square: sum(
                vector_distance(raw_cells[square], raw_cells[other])
                for other in squares
            ),
        )
        empty_templates[parity] = raw_cells[empty_square]

    features: dict[tuple[int, int], dict[str, Any]] = {}
    for rank in range(8):
        for file in range(8):
            empty = empty_templates[(rank + file) % 2]
            cell = raw_cells[(rank, file)]
            diff = [(value - baseline) / 255 for value, baseline in zip(cell, empty)]
            absdiff = [
                abs(value - baseline) / 255 for value, baseline in zip(cell, empty)
            ]
            features[(rank, file)] = {
                "empty_score": sum(absdiff) / len(absdiff),
                "vector": absdiff + diff + [sum(absdiff) / len(absdiff)],
            }

    return features


def vector_distance(left: list[float] | list[int], right: list[float] | list[int]) -> float:
    return sum(abs(a - b) for a, b in zip(left, right)) / len(left)


def fen_from_board(
    board: Image.Image,
    templates: dict[str, list[float]],
) -> tuple[str, list[dict[str, Any]]]:
    features = board_features(board)
    ranks: list[str] = []
    issues: list[dict[str, Any]] = []

    for rank in range(8):
        cells: list[str] = []
        empty_count = 0

        for file in range(8):
            vector = features[(rank, file)]["vector"]
            ranked = sorted(
                (
                    (piece, vector_distance(vector, template))
                    for piece, template in templates.items()
                ),
                key=lambda item: item[1],
            )
            piece, best_distance = ranked[0]
            second_distance = ranked[1][1]

            if piece != "." and (
                best_distance > 0.245 or second_distance - best_distance < 0.012
            ):
                issues.append(
                    {
                        "piece": piece,
                        "square": square_name(rank, file),
                        "distance": round(best_distance, 3),
                        "nextDistance": round(second_distance, 3),
                    }
                )

            if piece == ".":
                empty_count += 1
            else:
                if empty_count:
                    cells.append(str(empty_count))
                    empty_count = 0
                cells.append(piece)

        if empty_count:
            cells.append(str(empty_count))
        ranks.append("".join(cells))

    return f"{'/'.join(ranks)} w - - 0 1", issues


def square_name(rank: int, file: int) -> str:
    return f"{chr(ord('a') + file)}{8 - rank}"


def fen_to_cells(fen: str) -> list[list[str]]:
    cells: list[list[str]] = []
    for rank in fen.split()[0].split("/"):
        row: list[str] = []
        for char in rank:
            if char.isdigit():
                row.extend(["."] * int(char))
            else:
                row.append(char)
        cells.append(row)
    return cells


def should_promote(label: str, position: dict[str, Any]) -> bool:
    if not label:
        return False
    if len(position["issues"]) > 4:
        return False

    placement = position["fen"].split()[0]
    pieces = [char for char in placement if char.isalpha()]
    chapter = int(position["number"].split(".")[0])
    if pieces.count("K") != 1 or pieces.count("k") != 1:
        return False
    if chapter == 3 and not any(piece in pieces for piece in ("N", "n")):
        return False
    if chapter == 4 and not any(piece in pieces for piece in ("Q", "q")):
        return False
    if any(char in placement.split("/")[0] + placement.split("/")[-1] for char in "Pp"):
        return False

    return True


def get_rejection_reason(label: str, position: dict[str, Any] | None) -> str:
    if position is None:
        return "no extracted board paired with this label"
    if position["issues"]:
        return "ambiguous piece classification"

    placement = position["fen"].split()[0]
    pieces = [char for char in placement if char.isalpha()]
    chapter = int(position["number"].split(".")[0])
    if pieces.count("K") != 1 or pieces.count("k") != 1:
        return "expected exactly one white king and one black king"
    if chapter == 3 and not any(piece in pieces for piece in ("N", "n")):
        return "missing chapter 3 knight"
    if chapter == 4 and not any(piece in pieces for piece in ("Q", "q")):
        return "missing chapter 4 queen"
    if any(char in placement.split("/")[0] + placement.split("/")[-1] for char in "Pp"):
        return "pawn on impossible promotion rank"

    return "not promoted"


def split_embedded_labels(
    sections: list[dict[str, Any]],
    extracted: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    labels = sorted(extracted.keys(), key=len, reverse=True)
    rewritten: list[dict[str, Any]] = []

    for section in sections:
        if section.get("type") not in {"moves", "text"} or not isinstance(
            section.get("content"),
            str,
        ):
            rewritten.append(section)
            continue

        remaining = section["content"]
        section_type = section["type"]

        while True:
            match = find_embedded_label(remaining, labels)
            if not match:
                if remaining.strip():
                    rewritten.append({"type": section_type, "content": remaining.strip()})
                break

            start, end, label = match
            before = remaining[:start].strip()
            if before:
                rewritten.append({"type": section_type, "content": before})

            rewritten.append({"type": "caption", "content": label})
            remaining = clean_embedded_label_remainder(remaining[end:])

    return rewritten


def find_embedded_label(
    text: str,
    labels: list[str],
) -> tuple[int, int, str] | None:
    best: tuple[int, int, str] | None = None

    for label in labels:
        index = find_structural_label_index(text, label)
        if index < 0:
            continue

        end = index + len(label)
        if end < len(text) and text[end].isdigit():
            longer_label_exists = any(
                other != label and text.startswith(other, index) for other in labels
            )
            if longer_label_exists:
                continue
        if not is_embedded_diagram_remainder(text[end:]):
            cursor = end
            continue

        if best is None or index < best[0]:
            best = (index, end, label)

    return best


def find_structural_label_index(text: str, label: str) -> int:
    cursor = 0

    while True:
        index = text.find(label, cursor)
        if index < 0:
            return -1
        if index == 0 or text[index - 1] in "\n\r":
            return index
        cursor = index + len(label)


def clean_embedded_label_remainder(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^(\d+)\s+(?=[KQRBNRa-hO0])", r"\1.", text)
    return text


def is_embedded_diagram_remainder(text: str) -> bool:
    text = text.lstrip()
    return bool(
        re.match(
            r"(?:\d+\s*(?:\.|\.\.\.)?|\d+\s+[KQRBNRa-hO0]|[KQRBNR][a-h1-8x])",
            text,
        )
    )


def caption_label(section: dict[str, Any]) -> str | None:
    if section.get("type") != "caption":
        return None
    content = section.get("content")
    return content if isinstance(content, str) else None


def position_label(section: dict[str, Any]) -> str | None:
    if section.get("type") != "position" or not isinstance(section.get("content"), dict):
        return None

    content = section["content"]
    label = content.get("caption")
    number = content.get("number")

    if isinstance(label, str):
        return label
    if isinstance(number, str):
        return f"Position {number}"
    return None


def is_cross_chapter_section(chapter: int, section: dict[str, Any]) -> bool:
    label = caption_label(section)
    if section.get("type") == "position" and isinstance(section.get("content"), dict):
        label = str(section["content"].get("number", ""))

    if not label:
        return False
    match = re.search(r"\b(\d{1,2})\.", label)
    return bool(match and int(match.group(1)) != chapter)


def with_inferred_turn(fen: str, next_sections: list[dict[str, Any]]) -> str:
    text = ""
    for section in next_sections:
        if section.get("type") in {"moves", "text", "panel"}:
            text = str(section.get("content"))
            break

    first_move = re.search(r"\b\d+\s*(\.\.\.|\.)", text)
    turn = "b" if first_move and first_move.group(1) == "..." else "w"
    parts = fen.split()
    parts[1] = turn
    return " ".join(parts)


def get_position_fen_for_section(
    label: str,
    fen: str,
    next_sections: list[dict[str, Any]],
) -> str:
    if label in VERIFIED_DIAGRAM_PRESERVE_TURN:
        return fen

    return with_inferred_turn(fen, next_sections)


if __name__ == "__main__":
    main()
