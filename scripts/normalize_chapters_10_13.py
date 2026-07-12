#!/usr/bin/env python3
"""Normalize OCR-backed chapter JSON for chapters 10-13.

The source PDF uses chess figurine fonts that the text layer exposes as noisy
fragments. This script keeps the existing hand-curated ending order, folds in
chapter intro text that the first pass missed, and cleans notation enough for
the viewer to present readable chapter text.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf"
PDF_DIR = ROOT / "app/src/app_x/pdf"


INTRO_SPECS = {
    10: {
        "pages": range(124, 126),
        "stop": "where can they be successfully adopted",
    },
    11: {
        "pages": range(154, 156),
        "stop": "where simplifications were possible",
    },
    12: {
        "pages": range(170, 172),
        "stop": "The most interesting case in this section",
    },
    13: {
        "pages": range(205, 207),
        "stop": "Position 13.1",
    },
}

NOISE_REPLACEMENTS = [
    ("Sect ion", "Section"),
    ("Secti on", "Section"),
    ("Sect i o n", "Section"),
    ("Bas i c", "Basic"),
    ("endi ngs", "endings"),
    ("end in g s", "endings"),
    ("Paw n", "Pawn"),
    ("P a wn", "Pawn"),
    ("Roo k", "Rook"),
    ("R o o k", "Rook"),
    ("End g ames", "Endgames"),
    ("End g ame s", "Endgames"),
    ("Yo u", "You"),
    ("Kn ow", "Know"),
    ("Must Kn ow", "Must Know"),
    ("mate ri al re la tion s", "material relations"),
    ("Other mate ri al re la tion s", "Other material relations"),
    ("Pawn endi ngs", "Pawn endings"),
    ("Paw n en din g s", "Pawn endings"),
    ("Paw n end in g s", "Pawn endings"),
    ("sta y", "stay"),
    ("po ssib le", "possible"),
    ("pos sible", "possible"),
    ("progr ess", "progress"),
    ("pro gress", "progress"),
    ("def ence", "defence"),
    ("def ensi ve", "defensive"),
    ("defen sive", "defensive"),
    ("manoe uvre", "manoeuvre"),
    ("ju st", "just"),
    ("j ust", "just"),
    ("p awn", "pawn"),
    ("kin g", "king"),
    ("sq uare", "square"),
    ("analys ed", "analysed"),
    ("analys is", "analysis"),
    ("conclu sion", "conclusion"),
    ("Conclus ion", "Conclusion"),
    ("Sum mary", "Summary"),
    ("Summ ary", "Summary"),
    ("oft he", "of the"),
    ("Pos ition", "Position"),
    ("Analy sis dia gram", "Analysis diagram"),
    ("Analy sis diagram", "Analysis diagram"),
    ("dia gram", "diagram"),
    ("successf ully", "successfully"),
    ("adop ted", "adopted"),
    ("prese nt", "present"),
    ("pos ition", "position"),
    ("posit ion", "position"),
    ("posit ions", "positions"),
    ("po sitions", "positions"),
    ("endga me", "endgame"),
    ("endga mes", "endgames"),
    ("endin gs", "endings"),
    ("mast er", "master"),
    ("importa nt", "important"),
    ("intere sting", "interesting"),
    ("theo ry", "theory"),
    ("read er", "reader"),
    ("attent ion", "attention"),
    ("poss ible", "possible"),
    ("distan ce", "distance"),
    ("pract ice", "practice"),
    ("thou gh", "though"),
    ("shou ld", "should"),
    ("check mate", "checkmate"),
    ("checkma te", "checkmate"),
    ("Undoubte dly", "Undoubtedly"),
    ("sev eral", "several"),
    ("com mon", "common"),
    ("addit ion", "addition"),
    ("theoret ical", "theoretical"),
    ("knowledg e", "knowledge"),
    ("Practi cal", "Practical"),
    ("increas e", "increase"),
    ("Neverthel ess", "Nevertheless"),
    ("followin g", "following"),
    ("beg inning", "beginning"),
    ("differ ences", "differences"),
    ("sensi ble", "sensible"),
    ("exceptiona l", "exceptional"),
    ("poss ibility", "possibility"),
    ("organi se", "organise"),
    ("tech nique", "technique"),
    ("extrap olate", "extrapolate"),
    ("excep tions", "exceptions"),
    ("po sitions", "positions"),
    ("syste ms", "systems"),
    ("so- called", "so-called"),
    ("offk ing", "off king"),
    ("appro ach", "approach"),
    ("classif y", "classify"),
    ("sa lvation", "salvation"),
    ("alto gether", "altogether"),
    ("checkma te", "checkmate"),
    ("bet ter", "better"),
    ("end ing", "ending"),
    ("re sources", "resources"),
    ("ap plied", "applied"),
    ("dis tance", "distance"),
    ("prac tical", "practical"),
    ("espe cially", "especially"),
    ("scenar ios", "scenarios"),
    ("classifi cation", "classification"),
    ("st udy", "study"),
    ("demand a", "demand a"),
    ("de mand", "demand"),
    ("calculati on", "calculation"),
    ("advantag e", "advantage"),
    ("statistic s", "statistics"),
    ("outstanding", "outstanding"),
    ("outs tanding", "outstanding"),
    ("certain", "certain"),
    ("cer tain", "certain"),
    ("mater ial", "material"),
    ("impor tant", "important"),
    ("ap proaches", "approaches"),
    ("supp ort", "support"),
    ("mo tifs", "motifs"),
    ("im possible", "impossible"),
    ("mas ters", "masters"),
    ("moreo ver", "moreover"),
    ("understand ing", "understanding"),
    ("bish op", "bishop"),
    ("harmonizat ion", "harmonization"),
    ("mis take", "mistake"),
    ("mechani cal", "mechanical"),
    ("crit ical", "critical"),
    ("succ eed", "succeed"),
    ("colo ur", "colour"),
    ("corne rs", "corners"),
    ("matin g", "mating"),
    ("imag es", "images"),
    ("nar row", "narrow"),
    ("considere rations", "considerations"),
    ("coord inated", "coordinated"),
    ("momen ts", "moments"),
]

ROOK_GLYPHS = [
    r"J::r",
    r"J:r",
    r"J:t",
    r"J;I",
    r"J;l",
    r"J\�",
    r"Jia",
    r"Jig",
    r"Jic",
    r"Jif",
    r"JH",
    r"Jl",
    r"Ji",
    r"J�",
    r"J\!",
    r"l:I",
    r"l:r",
    r"l:t",
    r"l::",
    r"l:!",
    r"l:'?1",
    r"l:'?r",
    r"ll",
    r"ld",
    r"kt",
    r"k:\[",
    r"I:r",
    r":Q:",
    r":a",
    r"\.M",
    r"\.t:i",
    r"\.C:",
    r"\.l:.",
    r"\.U",
    r"\.Uh",
    r"Z;l",
    r"Zl",
    r"b!:",
    r"n",
    r"ria",
]

BISHOP_GLYPHS = [
    r"ii\.",
    r"iL",
    r"iLg",
    r"iLe",
    r"iLb",
    r"il",
    r"jlc",
    r"jle",
    r"jld",
    r"ild",
    r"ile",
    r"ilc",
    r"\.i",
]

QUEEN_GLYPHS = [
    r"'iV",
    r"'iY",
    r"'i¥",
    r"'if",
    r"'ii",
    r"'i:V",
    r"'i:Ve",
    r"'i:Vd",
    r"'iVc",
    r"'i¥f",
    r"'ii'f",
    r"'ii",
]


def main() -> None:
    for chapter in range(10, 14):
        path = PDF_DIR / f"chapter_{chapter}.json"
        sections: list[dict[str, Any]] = json.loads(path.read_text())
        normalized = normalize_sections(sections)
        intro = get_intro(chapter)

        if intro:
            insert_intro(normalized, intro)

        path.write_text(json.dumps(normalized, indent=2, ensure_ascii=False) + "\n")

    subprocess.run(
        [sys.executable, str(ROOT / "scripts/build_chapter_payload.py")],
        check=True,
    )


def get_intro(chapter: int) -> str:
    spec = INTRO_SPECS[chapter]
    raw = "\n".join(extract_page_text(page) for page in spec["pages"])
    raw = slice_before_fuzzy(raw, spec["stop"])
    cleaned = clean_text(raw)
    cleaned = remove_repeated_title(cleaned, chapter)
    return clean_header_collisions(cleaned).strip()


def slice_before_fuzzy(text: str, stop: str) -> str:
    squashed_text = squash_for_match(text)
    squashed_stop = squash_for_match(stop)
    index = squashed_text.find(squashed_stop)

    if index < 0:
        return text

    raw_index = 0
    squashed_count = 0
    while raw_index < len(text) and squashed_count < index:
        if text[raw_index].isalnum():
            squashed_count += 1
        raw_index += 1

    return text[:raw_index]


def squash_for_match(text: str) -> str:
    return "".join(char.lower() for char in text if char.isalnum())


def extract_page_text(page_number: int) -> str:
    with pdfplumber.open(PDF_PATH) as pdf:
        return pdf.pages[page_number - 1].extract_text(x_tolerance=3, y_tolerance=3) or ""


def normalize_sections(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []

    for section in sections:
        section_type = section["type"]
        content = section["content"]

        if section_type in {"text", "moves", "caption", "title"}:
            text = clean_text(str(content))
            normalized.extend(split_structural_text(section_type, text))
            continue

        if section_type == "panel" and isinstance(content, dict):
            normalized.append(
                {
                    "type": "panel",
                    "content": {
                        "title": clean_inline_text(str(content.get("title", ""))),
                        "text": clean_text(str(content.get("text", ""))),
                    },
                }
            )
            continue

        normalized.append(section)

    return merge_adjacent_text(normalized)


def split_structural_text(section_type: str, text: str) -> list[dict[str, Any]]:
    if section_type != "text":
        return [{"type": section_type, "content": text}]

    text = re.sub(
        r"(?<!\n)(Position\s+\d{1,2}\.\d+[a-z]?)(?=\s)",
        r"\n\1\n",
        text,
    )
    text = re.sub(
        r"(?<!\n)(Analysis diagram\s+\d{1,2}\.\d+[a-z]?)(?=\s)",
        r"\n\1\n",
        text,
    )
    sections: list[dict[str, Any]] = []
    cursor = 0
    pattern = re.compile(
        r"(?m)^(Position\s+\d{1,2}\.\d+[a-z]?|Analysis diagram\s+\d{1,2}\.\d+[a-z]?)\s*$"
    )

    for match in pattern.finditer(text):
        before = text[cursor : match.start()].strip()
        if before:
            sections.extend(split_panels(before))

        sections.append({"type": "caption", "content": match.group(1)})
        cursor = match.end()

    rest = text[cursor:].strip()
    if rest:
        sections.extend(split_panels(rest))

    return sections


def split_panels(text: str) -> list[dict[str, Any]]:
    panel_match = re.search(
        r"(?im)^(Summing up|Summary|Conclusion|Conclusions):?\s*\n(.+)$",
        text,
        flags=re.S,
    )

    if not panel_match:
        return [{"type": guess_text_type(text), "content": text}]

    before = text[: panel_match.start()].strip()
    panel_text = panel_match.group(2).strip()
    sections: list[dict[str, Any]] = []

    if before:
        sections.append({"type": guess_text_type(before), "content": before})

    sections.append(
        {
            "type": "panel",
            "content": {
                "title": panel_match.group(1).replace("Summing up", "Summary"),
                "text": panel_text,
            },
        }
    )

    return sections


def guess_text_type(text: str) -> str:
    compact = " ".join(text.split())
    move_like = len(re.findall(r"(?:^|\s)\d+\s*(?:\.|\.\.\.)", compact))

    if move_like >= 2 and len(compact) < 1600:
        return "moves"

    return "text"


def clean_text(text: str) -> str:
    text = re.sub(r"([A-Za-z])\u00ad\s*\n\s*([A-Za-z])", r"\1\2", text)
    text = re.sub(r"([A-Za-z])-\s*\n\s*([a-z])", r"\1\2", text)
    text = text.replace("\u00ad", "")
    text = text.replace("\uf02d", "-")
    text = text.replace("\t", " ")
    text = remove_headers_and_page_numbers(text)
    text = re.sub(r"([a-z])\s*\n\s*([a-z])", r"\1 \2", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = normalize_chess_notation(text)
    text = clean_common_noise(text)
    text = normalize_spacing(text)
    text = clean_header_collisions(text)
    return text.strip()


def clean_header_collisions(text: str) -> str:
    text = re.sub(
        r"Position\s+(\d{1,2})\.(\d)1\s*00\s+Endgames\s+You\s+Must\s+Know",
        r"Position \1.\2",
        text,
    )
    text = re.sub(
        r"Position\s+(\d{1,2})\.(\d)100\s+Endgames\s+You\s+Must\s+Know",
        r"Position \1.\2",
        text,
    )
    return text


def clean_inline_text(text: str) -> str:
    return normalize_spacing(clean_common_noise(normalize_chess_notation(text))).strip()


def remove_headers_and_page_numbers(text: str) -> str:
    kept: list[str] = []

    for raw_line in text.splitlines():
        line = raw_line.strip()

        if not line:
            kept.append("")
            continue

        compact = re.sub(r"\s+", "", line)
        if re.fullmatch(r"\d{1,3}", compact):
            continue

        if "End g" in line and "Must" in line:
            continue

        if re.match(r"^\d+\s*\.\s+", line) and " vs " in line:
            continue

        kept.append(raw_line)

    return "\n".join(kept)


def remove_repeated_title(text: str, chapter: int) -> str:
    lines = text.splitlines()
    if lines and lines[0].lstrip().startswith(f"{chapter}."):
        return "\n".join(lines[1:])
    return text


def normalize_chess_notation(text: str) -> str:
    text = text.replace("0-0-0", "O-O-O").replace("0-0", "O-O")
    text = re.sub(r"\bl\s*\.\s*\.\s*", "1...", text)
    text = re.sub(r"\bl\s*\.", "1.", text)
    text = re.sub(r"(?<=\d)\s+\.\s+\.\s+\.", "...", text)
    text = re.sub(r"(?<=\d)\s+\.\s+", ".", text)
    text = re.sub(r"(?<=\d)\s+\.\.\.\s+", "...", text)
    text = re.sub(r"(?<=\d)\s+(?=[?!+,=])", "", text)

    text = replace_piece_glyphs(text, ROOK_GLYPHS, "R")
    text = replace_piece_glyphs(text, BISHOP_GLYPHS, "B")
    text = replace_piece_glyphs(text, QUEEN_GLYPHS, "Q")
    text = clean_remaining_chess_font_glyphs(text)

    text = re.sub(r"(?<![A-Za-z])(?:W|<;t>|\\t>|�)\s*([a-h])\s*([1-8])", r"K\1\2", text)
    text = re.sub(r"(?<![A-Za-z])([KQRBN])\s+([a-h])\s*([1-8])", r"\1\2\3", text)
    text = re.sub(r"(?<![A-Za-z])([KQRBN])x\s*([a-h])\s*([1-8])", r"\1x\2\3", text)
    text = re.sub(r"(?<![A-Za-z])([a-h])\s*x\s*([a-h])\s*([1-8])", r"\1x\2\3", text)
    text = re.sub(r"(?<=\d)\s*-\s*(?=$|[\s),.;])", "-", text)
    text = re.sub(r"\+\s*-", "+-", text)
    text = re.sub(r"=\s*,", "=,", text)
    text = re.sub(r"!\s*\?", "!?", text)
    text = re.sub(r"\?\s*!", "?!", text)
    text = re.sub(r"([a-h])\s+([1-8])(?=\s*(?:[!?+=#)]|$|[,.;]))", r"\1\2", text)
    text = re.sub(r"(?<=\d)\s*'\s*i[VY¥]\s*\+", "=Q+", text)
    text = re.sub(r"(?<=\d)\s*'\s*i[VY¥]", "=Q", text)
    return text


def clean_remaining_chess_font_glyphs(text: str) -> str:
    text = re.sub(
        r"(?<![A-Za-z])(?:J::r|J::|J:|J\�|J\!|J\[|J\(|J;|J|l:I|l:r|l:t|l::|l:|I:r|:C:|:Q:|:a|\.M|\.C:|\.t:i|\.U|\.Uh)\s*([a-h])\s*([lI1-8S])",
        lambda match: "R" + match.group(1) + normalize_square_rank(match.group(2)),
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])(?:<;t>|\\t>|�|W)\s*x?\s*([a-h])\s*([lI1-8S])",
        lambda match: "K" + match.group(1) + normalize_square_rank(match.group(2)),
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])(?:<;t>|\\t>|�|W)\s+([a-h])(?=[,.;:)!?=+\s])",
        r"K\1",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])([KQRBNR])\s*([a-h])\s*([lI])(?=[,.;:)!?=+\s])",
        r"\1\g<2>1",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])([KQRBNR])\s*([a-h])\s*S(?=[,.;:)!?=+\s])",
        r"\1\g<2>5",
        text,
    )
    text = (
        text.replace("J::r", "R")
        .replace("J::t", "R")
        .replace("J::", "R")
        .replace("J:[", "R")
        .replace("J:!", "R")
        .replace("J:Id", "Rd")
        .replace("J:I", "R")
        .replace("J:t", "R")
        .replace("J:l", "R")
        .replace("J:", "R")
        .replace("l::", "R")
        .replace("l:I", "R")
        .replace("l:r", "R")
        .replace("l:t", "R")
        .replace("<;t>", "K")
        .replace("\\t>", "K")
        .replace("�", "K")
    )
    text = re.sub(r"(?<![A-Za-z])R\s*([a-h])\s*([lI])", r"R\g<1>1", text)
    text = re.sub(r"(?<![A-Za-z])R\s*([a-h])\s*S", r"R\g<1>5", text)
    text = re.sub(r"(?<![A-Za-z])K\s*([a-h])\s*([lI])", r"K\g<1>1", text)
    text = re.sub(r"(?<![A-Za-z])K\s*([a-h])\s*S", r"K\g<1>5", text)
    return text


def normalize_square_rank(rank: str) -> str:
    if rank in {"l", "I"}:
        return "1"

    if rank == "S":
        return "5"

    return rank


def replace_piece_glyphs(text: str, glyphs: list[str], piece: str) -> str:
    glyph_pattern = "|".join(glyphs)
    return re.sub(
        rf"(?<![A-Za-z])(?:{glyph_pattern})\s*([a-h])\s*([1-8])",
        rf"{piece}\1\2",
        text,
    )


def clean_common_noise(text: str) -> str:
    for before, after in NOISE_REPLACEMENTS:
        text = text.replace(before, after)

    text = re.sub(
        r"Position\s+(\d{1,2})\.(\d)1\s*00 Endgames You Must Know",
        r"Position \1.\2",
        text,
    )
    text = re.sub(
        r"Position\s+(\d{1,2})\.(\d)1(?=\s+[A-ZJR])",
        r"Position \1.\2\n1",
        text,
    )
    text = re.sub(r"\b([1-9])\s+([0-9])\s+([0-9])\b", r"\1\2\3", text)
    text = re.sub(r"\b([1-9])\s+([0-9])\b", r"\1\2", text)
    text = re.sub(
        r"Position\s+(\d{1,2})\.(\d)100 Endgames You Must Know",
        r"Position \1.\2",
        text,
    )
    text = text.replace("7 th", "7th").replace("6 th", "6th").replace("5 th", "5th")
    text = text.replace("4 th", "4th").replace("3 rd", "3rd").replace("2 nd", "2nd")
    text = text.replace("1 st", "1st")
    text = text.replace(" - ", " - ")
    return text


def normalize_spacing(text: str) -> str:
    text = re.sub(r"[ \u00a0]+", " ", text)
    text = re.sub(r" +([,.;:!?])", r"\1", text)
    text = re.sub(r"([({]) +", r"\1", text)
    text = re.sub(r" +([)}])", r"\1", text)
    text = re.sub(r"\n +", "\n", text)
    text = re.sub(r" +\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def insert_intro(sections: list[dict[str, Any]], intro: str) -> None:
    if not intro:
        return

    first_ending_index = next(
        (
            index
            for index, section in enumerate(sections)
            if section["type"] == "ending"
        ),
        len(sections),
    )
    del sections[1:first_ending_index]
    intro_sections = split_structural_text("text", intro)
    sections[1:1] = intro_sections


def merge_adjacent_text(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []

    for section in sections:
        if (
            merged
            and section["type"] == "text"
            and merged[-1]["type"] == "text"
            and isinstance(section["content"], str)
            and isinstance(merged[-1]["content"], str)
        ):
            merged[-1]["content"] += "\n\n" + section["content"]
        else:
            merged.append(section)

    return merged


if __name__ == "__main__":
    main()
