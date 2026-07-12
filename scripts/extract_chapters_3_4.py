#!/usr/bin/env python3
"""Extract early numbered-endgame chapters from the source PDF into JSON.

The body text for these chapters does not print "Ending N" headings in
line with the prose. The ending metadata below is copied from the PDF table of
contents and inserted at the corresponding chapter-page boundaries.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf"
PDF_DIR = ROOT / "app/src/app_x/pdf"


@dataclass(frozen=True)
class EndingSpec:
    number: str
    title: str
    marker: str


@dataclass(frozen=True)
class ChapterSpec:
    number: str
    title: str
    pages: range
    endings: tuple[EndingSpec, ...]


CHAPTERS = (
    ChapterSpec(
        number="1",
        title="Basic endings",
        pages=range(28, 46),
        endings=(
            EndingSpec("1", "The rule of the square", "Position 1.1"),
            EndingSpec("2", "The pawn is on the 6th rank", "Position 1.4"),
            EndingSpec("3", "Key squares", "Position 1.9"),
            EndingSpec(
                "4",
                "The rook's pawn. Defending king in front of the pawn",
                "Position 1.14",
            ),
            EndingSpec(
                "5",
                "Imprisoning the stronger side's king",
                "Position 1.16",
            ),
            EndingSpec(
                "6",
                "Rook vs. Bishop. The wrong corner",
                "Position 1.17",
            ),
            EndingSpec(
                "7",
                "Rook vs. Bishop. The right corner",
                "Position 1.18",
            ),
            EndingSpec(
                "8",
                "Rook vs. Knight. At the edge of the board",
                "Position 1.19",
            ),
            EndingSpec(
                "9",
                "Rook vs. Knight. In the corner",
                "Position 1.21",
            ),
        ),
    ),
    ChapterSpec(
        number="3",
        title="Knight vs. Pawn",
        pages=range(52, 60),
        endings=(
            EndingSpec("10", "Knight vs. 7th-rank pawn", "Position 3.1"),
            EndingSpec("11", "The knight's pawn", "Position 3.3"),
            EndingSpec("12", "The 6th-rank rook's pawn", "Position 3.4"),
            EndingSpec("13", "The 7th-rank rook's pawn", "Position 3.5"),
            EndingSpec("14", "King + Knight checkmate", "Position 3.9"),
            EndingSpec("15", "The knight's dumb square", "Position 3.10"),
        ),
    ),
    ChapterSpec(
        number="4",
        title="Queen vs. Pawn",
        pages=range(60, 69),
        endings=(
            EndingSpec("16", "Queen vs. 7th-rank pawn", "Position 4.1"),
            EndingSpec("17", "Queen vs. 7th-rank rook's pawn", "Position 4.3"),
            EndingSpec("18", "Queen vs. 7th-rank bishop's pawn", "Position 4.6"),
            EndingSpec("19", "A too-frequent trick", "Position 4.10"),
            EndingSpec("20", "Queen vs. Queen", "Position 4.13"),
        ),
    ),
)


def main() -> None:
    with pdfplumber.open(PDF_PATH) as pdf:
        for chapter in CHAPTERS:
            raw_text = "\n".join(
                pdf.pages[page_number - 1].extract_text(x_tolerance=3, y_tolerance=3)
                or ""
                for page_number in chapter.pages
            )
            sections = build_sections(chapter, raw_text)
            (PDF_DIR / f"chapter_{chapter.number}.json").write_text(
                json.dumps(sections, indent=2, ensure_ascii=False) + "\n",
            )

    subprocess.run(
        [sys.executable, str(ROOT / "scripts/build_chapter_payload.py")],
        check=True,
    )


def build_sections(chapter: ChapterSpec, raw_text: str) -> list[dict[str, Any]]:
    text = normalize_pdf_text(raw_text)
    text = strip_chapter_heading(text, chapter)
    text = inject_structural_breaks(text)
    ending_markers = {ending.marker: ending for ending in chapter.endings}
    inserted_endings: set[str] = set()
    sections: list[dict[str, Any]] = [{"type": "title", "content": chapter.title}]
    pending: list[str] = []

    for block in split_blocks(text):
        label = normalize_label(block)

        if label and label in ending_markers:
            flush_pending_text(sections, pending)
            ending = ending_markers[label]
            if ending.number not in inserted_endings:
                sections.append(
                    {
                        "type": "ending",
                        "content": {
                            "number": ending.number,
                            "text": ending.title,
                        },
                    }
                )
                inserted_endings.add(ending.number)

        if label:
            flush_pending_text(sections, pending)
            sections.append({"type": "caption", "content": label})
            continue

        pending.append(block)

    flush_pending_text(sections, pending)
    assert_all_endings_inserted(chapter, inserted_endings)
    return sections


def normalize_pdf_text(text: str) -> str:
    text = text.replace("\u00ad", "")
    text = re.sub(r"([A-Za-z])-\s*\n\s*([a-z])", r"\1\2", text)
    text = re.sub(r"([A-Za-z])\s*\n\s*([a-z])", r"\1 \2", text)
    text = "\n".join(filter_running_lines(line) for line in text.splitlines())
    text = normalize_chess_glyphs(text)
    text = normalize_common_words(text)
    text = normalize_spacing(text)
    return text.strip()


def filter_running_lines(raw_line: str) -> str:
    line = raw_line.strip()

    if not line:
        return ""

    compact = re.sub(r"\s+", "", line)
    if re.fullmatch(r"\d{1,3}", compact):
        return ""

    if "Endgames" in line and "Must" in line:
        return ""

    if re.match(r"^[134]\s*\.?\s+", line) and (
        "Basic endings" in line or "Pawn" in line
    ):
        return ""

    return raw_line


def normalize_chess_glyphs(text: str) -> str:
    king_glyphs = [
        r"<;t>",
        r"<iit",
        r"<it>",
        r"<it",
        r"<tit",
        r"c;i;",
        r"rJi",
        r"<J;t",
        r"w(?=[a-h][1-8])",
        r"W(?=\s*[a-h][1-8])",
        r"we(?=1\b)",
        r"wd(?=1\b)",
        r"\\t>",
        r"\\t!",
        r"�",
    ]
    knight_glyphs = [
        r"tt[:.]?J",
        r"tl[:.]?J",
        r"tL[lJ]?",
        r"t2J",
        r"lt:?J",
        r"lt:?R",
        r"ti:?J",
        r"ti:?R",
        r"t:?R",
        r"t:?J",
        r"2J",
        r"L'?lg",
        r"tb(?=[a-h][1-8S])",
    ]
    queen_glyphs = [
        r"'i[VY¥f]",
        r"'li",
        r"'ii",
        r"i[VY¥]",
        r"\bif(?=[a-h1-8])",
        r"\\'ii",
    ]
    rook_glyphs = [
        r"l[:.]?[Irt]",
        r"J[:!]",
        r"J[lI](?=[a-h])",
        r"\bll\s*(?=[a-h])",
        r"\blI\s*(?=[a-h])",
        r"\bIl\s*(?=[a-h])",
        r"\bM(?=[a-h][1-8])",
    ]

    for glyph in king_glyphs:
        text = re.sub(glyph, "K", text)

    for glyph in knight_glyphs:
        text = re.sub(glyph, "N", text)

    for glyph in queen_glyphs:
        text = re.sub(glyph, "Q", text)

    for glyph in rook_glyphs:
        text = re.sub(glyph, "R", text)

    text = re.sub(r"\b([KQRBN])\s+([a-h])\s*([1-8S])", fix_piece_square, text)
    text = re.sub(r"\b([KQRBN])x\s*([a-h])\s*([1-8S])", fix_piece_capture, text)
    text = re.sub(r"(?<=\d)\s*'\s*i[VY¥f]", "=Q", text)
    text = text.replace("O.i", "10.")
    text = text.replace("S.", "5.")
    text = text.replace("S ", "5 ")
    text = text.replace("hB", "h8")
    text = re.sub(r"(?<=\b[QRBNK])[b-h]l(?=[+#=!?.,;) ]|$)", fix_rank_one, text)
    text = re.sub(r"(?<=\b[a-h]x)[b-h]l(?=[+#=!?.,;) ]|$)", fix_rank_one, text)
    text = re.sub(r"\b([a-h])l(?=\s*=?[QRBN]?[+#=!?.,;) ]|$)", r"\g<1>1", text)
    return text


def fix_piece_square(match: re.Match[str]) -> str:
    return match.group(1) + match.group(2) + normalize_rank(match.group(3))


def fix_piece_capture(match: re.Match[str]) -> str:
    return match.group(1) + "x" + match.group(2) + normalize_rank(match.group(3))


def normalize_rank(rank: str) -> str:
    return "5" if rank == "S" else rank


def fix_rank_one(match: re.Match[str]) -> str:
    return match.group(0)[0] + "1"


def normalize_common_words(text: str) -> str:
    replacements = [
        ("trouble anym ore", "trouble anymore"),
        ("manoeu vres", "manoeuvres"),
        ("manoeu vre", "manoeuvre"),
        ("cen tral", "central"),
        ("Ift he", "If the"),
        ("Ifn ot", "If not"),
        ("stale mate", "stalemate"),
        ("check mate", "checkmate"),
        ("transf erred", "transferred"),
        ("altern ative", "alternative"),
        ("enem y", "enemy"),
        ("wh ite", "white"),
        ("Qu een", "Queen"),
        ("Kni ght", "Knight"),
        ("kni ght", "knight"),
        ("pawn s", "pawns"),
        ("endin gs", "endings"),
        ("Endg ames", "Endgames"),
        ("must be to handle", "must be to handle"),
        ("theo retical", "theoretical"),
        ("cont rol", "control"),
        ("Late ral contro l", "Lateral control"),
        ("proc edur e", "procedure"),
        ("Stalemate th eme s", "Stalemate themes"),
        ("stro ng ki ng", "strong king"),
        ("obs tacle", "obstacle"),
        ("right cir cuit", "right circuit"),
        ("can not", "cannot"),
        ("no w", "now"),
        ("on ly", "only"),
        ("dQferent", "different"),
        ("dQfer", "differ"),
        ("dQficult", "difficult"),
        ("DQficult", "Difficult"),
        ("difficuR", "difficult"),
        ("pawnstraight", "pawn straight"),
        ("hinder ing", "hindering"),
        ("go ing", "going"),
        ("previ ous", "previous"),
        ("pro motes", "promotes"),
        ("vic tory", "victory"),
        ("re sources", "resources"),
        ("opportu nity", "opportunity"),
        ("1 00 Endgames You Must Know", ""),
        ("1 00 Endg ames You Must Know", ""),
        ("mas tered", "mastered"),
        ("sin gle", "single"),
        ("end ings", "endings"),
        ("insecu rity", "insecurity"),
        ("trou ble", "trouble"),
        ("a1 ternative", "alternative"),
        ("mis take", "mistake"),
        ("le gal", "legal"),
        ("oft he", "of the"),
        ("pawnsome", "pawn some"),
        ("pawnstands", "pawn stands"),
        ("en emy", "enemy"),
        ("suitab1e", "suitable"),
        ("occu pies", "occupies"),
        ("compli cated", "complicated"),
        ("In stead", "Instead"),
        ("availab1e", "available"),
        ("unab1e", "unable"),
        ("dia grams", "diagrams"),
        ("nar rower", "narrower"),
        ("possib1e", "possible"),
        ("pro motion", "promotion"),
        ("ob structed", "obstructed"),
        ("ifp ossible", "if possible"),
        ("position ofk ing", "position of king"),
        ("cannote", "can note"),
        ("a2)", "2)"),
        ("2.lt. Je3+", "2.Ne3+"),
        ("2. R. Je3+", "2.Ne3+"),
        ("5Jtjd1", "5.Nd1+"),
        ("2.tb cS", "2.Nc5"),
        ("t. Nf3", "1.Nf3"),
        ("<1Jel", "Ne1"),
        ("lNhl", "Nh1"),
        ("Kxhl", "Kxh1"),
        ("Wxh1", "Kxh1"),
        ("N3!", "Ng3!"),
        ("Q'f", "Qf"),
        ("Q'h", "Qh"),
        ("Q'g", "Qg"),
        ("Qifg8", "Qg8"),
        ("QgS", "Qg5"),
        ("if dB", "Qd8"),
        ("Q xf7", "Qxf7"),
        ("Q gl", "Qg1"),
        ("Q g1", "Qg1"),
        ("Qd 3", "Qd3"),
        ("Qd 2", "Qd2"),
        ("Qc 1", "Qc1"),
        ("f8Q'", "f8=Q"),
        ("Q'a3", "Qa3"),
        ("c1 Q", "c1=Q"),
        ("g1 Q", "g1=Q"),
        ("h8Q", "h8=Q"),
    ]

    for before, after in replacements:
        text = text.replace(before, after)

    return text


def normalize_spacing(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?<=\d)\s+\.\s+\.\s+\.", "...", text)
    text = re.sub(r"(?<=\d)\s+\.\s+", ".", text)
    text = re.sub(r"(?<=\d)\s*\.\.\s+", "...", text)
    text = re.sub(r"(?<=\d)\s+(?=[?!+=])", "", text)
    text = re.sub(r"(?<![A-Za-z])l\s*\.", "1.", text)
    text = re.sub(r"(?<![A-Za-z])I\)", "1)", text)
    text = re.sub(r"(?<![A-Za-z])S(?=[.+\-])", "5", text)
    text = re.sub(r"(?<![A-Za-z])s\.\s*(?=[KQRBNOa-h])", "5.", text)
    text = re.sub(r"(?<=\d)\s*/\s*(?=[KQRBNOa-h])", ".", text)
    text = re.sub(r"(?<=[a-z)])(?=\d{1,2}\s*(?:\.|\.\.\.))", " ", text)
    text = re.sub(r"(?<=[!?+=])(?=\d{1,2}\s*(?:\.|\.\.\.))", " ", text)
    text = re.sub(r"\b([a-h])\s+([18])(?=\s*[,.;:)!?=+\-]|$)", r"\1\2", text)
    text = re.sub(r"\b([KQRBN])([a-h])l\b", r"\1\g<2>1", text)
    text = re.sub(r"\b([KQRBN][a-h])\s+([1-8])", r"\1\2", text)
    text = re.sub(r"\b([a-h])\s+([1-8])(?=\s*=?[QRBN])", r"\1\2", text)
    text = re.sub(r"\bfl\b", "f1", text)
    text = re.sub(r"(?<![A-Za-z])1\s+b2!\s*\.\s*\.\.", "1...b2!", text)
    text = re.sub(r"(?<![A-Za-z])([KQRBN])\s+([a-h])\s+([1-8])", r"\1\2\3", text)
    text = re.sub(r"(?<![A-Za-z])([a-h])\s+([1-8])(?=\s*[,.;:)!?=+\-]|$)", r"\1\2", text)
    text = re.sub(r"(?<![A-Za-z])([1-9])\s*\.\s+(?=[KQRBNOa-h])", r"\1.", text)
    text = re.sub(r"(?<![A-Za-z])([1-9])\s*\.\.\s+(?=[KQRBNOa-h])", r"\1...", text)
    text = re.sub(r"(?<![A-Za-z])([1-9])\.\.\s*(?=[KQRBNOa-h])", r"\1...", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"([.!?])([A-Z])", r"\1 \2", text)
    return text


def strip_chapter_heading(text: str, chapter: ChapterSpec) -> str:
    lines = text.splitlines()
    if lines and lines[0].lstrip().startswith(f"{chapter.number}."):
        return "\n".join(lines[1:]).strip()
    return text


def inject_structural_breaks(text: str) -> str:
    text = re.sub(r"Position\s+1\.\s*2\s+2", "Position 1.22", text)
    label_source = r"(?:Position|Analysis diagram)\s+\d{1,2}\.\d+[a-z]?"
    text = re.sub(
        r"(?m)^Position\s+(\d{1,2})\.\s+(\d+[a-z]?)\s*$",
        r"Position \1.\2",
        text,
    )
    text = re.sub(
        r"(?m)^Analysis diagram\s+(\d{1,2})\.\s+(\d+[a-z]?)\s*$",
        r"Analysis diagram \1.\2",
        text,
    )
    text = re.sub(
        rf"({label_source})\s+(?={label_source})",
        r"\n\1\n",
        text,
    )
    text = re.sub(
        rf"(?m)^({label_source})(?=\s+\S)",
        r"\1\n",
        text,
    )
    return text


def split_blocks(text: str) -> list[str]:
    blocks: list[str] = []
    cursor = 0
    label_pattern = re.compile(
        r"(?m)^(Position\s+\d{1,2}\.\s*\d+[a-z]?|Analysis diagram\s+\d{1,2}\.\s*\d+[a-z]?)\s*$"
    )

    for match in label_pattern.finditer(text):
        before = text[cursor : match.start()].strip()
        if before:
            blocks.extend(split_text_blocks(before))

        blocks.append(match.group(1).strip())
        cursor = match.end()

    rest = text[cursor:].strip()
    if rest:
        blocks.extend(split_text_blocks(rest))

    return blocks


def split_text_blocks(text: str) -> list[str]:
    return [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]


def normalize_label(text: str) -> str | None:
    match = re.fullmatch(
        r"(Position|Analysis diagram)\s+(\d{1,2})\.\s*(\d+[a-z]?)",
        text.strip(),
    )
    if not match:
        return None

    return f"{match.group(1)} {match.group(2)}.{match.group(3)}"


def flush_pending_text(sections: list[dict[str, Any]], pending: list[str]) -> None:
    if not pending:
        return

    text = normalize_final_section_text("\n\n".join(pending).strip())
    pending.clear()

    if not text:
        return

    sections.append({"type": guess_text_type(text), "content": text})


def normalize_final_section_text(text: str) -> str:
    text = re.sub(r"(?<![A-Za-z])([1-9])\.\.\s*(?=[KQRBNOa-h])", r"\1...", text)
    return text


def guess_text_type(text: str) -> str:
    move_like = len(re.findall(r"(?:^|\s)\d+\s*(?:\.|\.\.\.)", text))

    if move_like >= 2 and len(text) < 1800:
        return "moves"

    return "text"


def assert_all_endings_inserted(
    chapter: ChapterSpec,
    inserted_endings: set[str],
) -> None:
    expected = {ending.number for ending in chapter.endings}
    missing = expected - inserted_endings
    if missing:
        raise RuntimeError(
            f"Chapter {chapter.number} missing ending markers: {sorted(missing)}",
        )


if __name__ == "__main__":
    main()
