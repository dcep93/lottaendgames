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
    ("de fence", "defence"),
    ("de fender", "defender"),
    ("de fending", "defending"),
    ("be tween", "between"),
    ("oc cupy", "occupy"),
    ("suc ceeds", "succeeds"),
    ("ex ample", "example"),
    ("How ever", "However"),
    ("posi tions", "positions"),
    ("op position", "opposition"),
    ("be hind", "behind"),
    ("pro motion", "promotion"),
    ("pa tient", "patient"),
    ("de tail", "detail"),
    ("an swer", "answer"),
    ("re sponsibility", "responsibility"),
    ("ch ecks", "checks"),
    ("deliv ering", "delivering"),
    ("sup ported", "supported"),
    ("promo tion", "promotion"),
    ("proce dure", "procedure"),
    ("fol lows", "follows"),
    ("quick est", "quickest"),
    ("adj acent", "adjacent"),
    ("Al though", "Although"),
    ("can not", "cannot"),
    ("dual-pur pose", "dual-purpose"),
    ("domi nant", "dominant"),
    ("momen ts", "moments"),
    ("Ke1l-known", "well-known"),
    ("Ke1l", "well"),
    ("Ke8ker", "weaker"),
    ("Ke8re", "were"),
    ("Ke8n", "when"),
    ("Kh8t", "what"),
    ("Ke1eft", "we left"),
    ("Ke1ook", "we look"),
    ("were going", "we are going"),
    ("were go ing", "we are going"),
    ("were just", "we are just"),
    ("Here were.", "Here we are."),
    ("Section 1.King 2 pawns vs. King\n+\nWe", "Section 1. King + 2 pawns vs. King\n\nWe"),
    ("Section 1.Ki Rg2 pawns vs. Ki ng\n+\nwe", "Section 1. King + 2 pawns vs. King\n\nWe"),
    ("Section 2.Ki ng Pawn vs. Ki ng Pawn\n+ +", "Section 2. King + Pawn vs. King + Pawn"),
    ("whenalysed", "we analysed"),
    ("Kfa3.Rb7", "Kf8 3.Rb7"),
    ("Ke8ssume", "we assume"),
    ("Ka1k", "walk"),
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
        r"(Position\s+\d{1,2}\.\d)(\d)(?=\s+(?:[KQRBNRJ]|[a-h][1-8]|[a-h]x))",
        r"\1\n\2",
        text,
    )
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
    text = clean_final_ocr_notation_collisions(text)
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
    text = re.sub(
        r"(?m)^(\d{1,2})\s+((?:[KQRBNR]|[a-h])\S*.*?)\n\.\.",
        r"\1...\2",
        text,
    )
    text = re.sub(r"\bl\s*\.\s*\.\s*", "1...", text)
    text = re.sub(r"\bl\s*\.", "1.", text)
    text = re.sub(r"\bl\s+1\s*\.", "11.", text)
    text = re.sub(r"\b1\s+I\s*\.\s*\.", "11...", text)
    text = re.sub(r"\bl\s*[oO]\s*\.", "10.", text)
    text = re.sub(r"(?<![A-Za-z])S\s*\.", "5.", text)
    text = re.sub(r"(?<![A-Za-z])S\s+(?=(?:[KQRBNO]|[a-h][1-8]|[a-h]x))", "5.", text)
    text = re.sub(r"(?<![A-Za-z])s\.\s*(?=(?:[KQRBNO]|[a-h][1-8]|[a-h]x))", "5.", text)
    text = re.sub(r"\b([1-9])\s*[oO]\s*\.", r"\g<1>0.", text)
    text = re.sub(r"(?<=\d)/(?=[KQRBNOa-h])", ".", text)
    text = re.sub(r"(?<=\d)\.\.\.\.\s*(?=[KQRBNOa-h])", "...", text)
    text = re.sub(r"(?<=\d)\s+\.\s+\.\s+\.", "...", text)
    text = re.sub(r"(?<=\d)\s*\.\.\s+(?=[KQRBNOa-hJIl:.])", "...", text)
    text = re.sub(r"(?<=\d)\.\s+(?=[KQRBNOa-h])", ".", text)
    text = re.sub(r"(?<=\d)\.\.\.\s+(?=[KQRBNOa-h])", "...", text)
    text = re.sub(r"(?<=\d)\s+\.\s+", ".", text)
    text = re.sub(r"(?<=\d)\s+\.\.\.\s+", "...", text)
    text = re.sub(r"(?<=[a-z])(?=\d{1,2}\s*(?:\.|\.\.\.))", " ", text)
    text = re.sub(
        r"(?<![A-Za-z0-9.])(\d{1,2})\s+(?=(?:[KQRBNO]|[a-h][1-8]|[a-h]x))",
        r"\1.",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9.])(\d{1,2})(?=(?:[KQRBNO][a-h1-8x]|[a-h][1-8]|[a-h]x))",
        r"\1.",
        text,
    )
    text = re.sub(r"(?<=\d)\s+(?=[?!+,=])", "", text)

    text = replace_piece_glyphs(text, ROOK_GLYPHS, "R")
    text = replace_piece_glyphs(text, BISHOP_GLYPHS, "B")
    text = replace_piece_glyphs(text, QUEEN_GLYPHS, "Q")
    text = clean_remaining_chess_font_glyphs(text)
    text = clean_known_ocr_notation_collisions(text)

    text = re.sub(
        r"(?<![A-Za-z])(?:W|w|®|<;t>|\\t>|�|\\b)\s*x?\s*([a-h])\s*([1-8aS])(?=[^A-Za-z0-9]|$)",
        lambda match: "K"
        + match.group(1)
        + normalize_square_rank(match.group(2)),
        text,
    )
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
    text = clean_late_ocr_notation_collisions(text)
    text = re.sub(r"\bon account of(?=\d)", "on account of ", text)
    text = re.sub(r"\bin this line(?=\d)", "in this line ", text)
    return text


def clean_remaining_chess_font_glyphs(text: str) -> str:
    text = re.sub(
        r"(?<![A-Za-z])J�\.\s*([a-h])\s*([1-8])",
        r"R\1\2",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])JK\.\s*([a-h])\s*([1-8])",
        r"R\1\2",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])R\.\s*([a-h])\s*([1-8])",
        r"R\1\2",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])(?:J::r|J::|J:|J\�|J\!|J\[|J\(|J;|J|l:I|l:i|l:r|l:t|l::|l:|I:r|:C:|:Q:|:a|\.M|\.C:|\.t:i:?|\.U|\.Uh)\s*([a-h])\s*([lIi1-8S])",
        lambda match: "R" + match.group(1) + normalize_square_rank(match.group(2)),
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])(?:<;t>|\\t>|�|W|w|®|\\b)\s*x?\s*([a-h])\s*([lIi1-8aS])(?=[^A-Za-z0-9]|$)",
        lambda match: "K" + match.group(1) + normalize_square_rank(match.group(2)),
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])(?:<;t>|\\t>|�|W|w|®|\\b)\s+([a-h])(?=[,.;:)!?=+\s])",
        r"K\1",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])([KQRBNR])\s*([a-h])\s*([lIi])(?=[,.;:)!?=+\s])",
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
        .replace("\\b", "K")
    )
    text = re.sub(r"(?<![A-Za-z])R\s*([a-h])\s*([lI])", r"R\g<1>1", text)
    text = re.sub(r"(?<![A-Za-z])R\s*([a-h])\s*i", r"R\g<1>1", text)
    text = re.sub(r"(?<![A-Za-z])R\s*([a-h])\s*S", r"R\g<1>5", text)
    text = re.sub(r"(?<![A-Za-z])K\s*([a-h])\s*([lI])", r"K\g<1>1", text)
    text = re.sub(r"(?<![A-Za-z])K\s*([a-h])\s*i", r"K\g<1>1", text)
    text = re.sub(r"(?<![A-Za-z])K\s*([a-h])\s*S", r"K\g<1>5", text)
    text = re.sub(r"(?<![A-Za-z])Kfa(?=[^A-Za-z0-9]|$)", "Kf8", text)
    return text


def clean_known_ocr_notation_collisions(text: str) -> str:
    # Exact or notation-shaped repairs where the PDF text layer maps chess-font
    # pieces to ordinary letters. Keep these narrow: they should not touch prose.
    text = text.replace("1...Rg i?! 2.Kd6 Kd1+? 3.Ke6", "1...Rg1?! 2.Kd6 Rd1+? 3.Ke6")
    text = text.replace("1...Rg1?! 2.Kd6 Kd1+? 3.Ke6", "1...Rg1?! 2.Kd6 Rd1+? 3.Ke6")
    text = text.replace("4.!lh7", "4.Rh7")
    text = text.replace("\n2.Rg1!\n.\n", "\n2...Rg1!\n")
    text = text.replace("3.Iia7 Iie l!", "3.Ra7 Re1!")
    text = text.replace("4JH7+!", "4.Rh7+!")
    text = text.replace("Iie 16.Kf6", "Re1 6.Kf6")
    text = text.replace("5.Iid7 Re1", "5.Rd7 Re1")
    text = text.replace("8JKKh8+", "8.Rh8+")
    text = text.replace("9.lie8!?", "9.Re8!?")
    text = text.replace("17.l:ig l Rh7+", "17.Rg1 Rh7+")
    text = text.replace("1.:S:d8", "1.Rd8")
    text = text.replace("2.\n:C.\nd7", "2.Rd7")
    text = text.replace("3.Kes Ra5+", "3.Ke5 Ra5+")
    text = text.replace("Rta8", "Ra8")
    text = text.replace("Rtd8", "Rd8")
    text = text.replace("Rrd7", "Rd7")
    text = text.replace("ldcS", "Rc5")
    text = text.replace("7.Kb7 Rc8 8.Kb6 Rc8", "7.Kb7 Rc5 8.Kb6 Rc8")
    text = text.replace("Ric8", "Rc8")
    text = text.replace("3...J la1?", "3...Ra1?")
    text = text.replace("3...J lb8?", "3...Rb8?")
    text = text.replace("2...JU1+", "2...Rf1+")
    text = text.replace("2...a: f1+!", "2...Rf1+!")
    text = text.replace("1.Kb7 Kg6 2.:a.b6", "1.Rb7 Rg6 2.Rb6")
    text = text.replace("2...Kg4!\n.", "2...Rg4!")
    text = text.replace("2...Kg1?! losing, on account of3.Kc6! Kc1+", "2...Rg1?! losing, on account of 3.Kc6! Rc1+")
    text = text.replace(
        "4.Kd6+- and now 4...Kc8 5.Ka6 Kb8 6.Ke6 Kc8 7.d6 Kb8 8.Ka1 Kc8 9.Kh1",
        "4.Kd6+- and now 4...Rc8 5.Ra6 Rb8 6.Ke6 Rc8 7.d6 Rb8 8.Ra1 Rc8 9.Rh1",
    )
    text = text.replace("but in this line3...Kc8! holds", "but in this line 3...Kc8! holds")
    text = text.replace("2...Kg7?! also loses, according to Dvoretsky: 3.Rb8+! Kc7 4.Ka8", "2...Rg7?! also loses, according to Dvoretsky: 3.Rb8+! Kc7 4.Ra8")
    text = text.replace(
        "4...Kg1! (4...Kg6? is indeed losing: 5.d6+ Kd7 6.Ka7+ Kd8 7.Kc6+-) 5.Ka7+\nKc8 6.Kc6 Kc1+ 7.Kd6 Rc4!",
        "4...Rg1! (4...Rg6? is indeed losing: 5.d6+ Kd7 6.Ra7+ Kd8 7.Kc6+-) 5.Ra7+\nKc8 6.Kc6 Rc1+ 7.Kd6 Rc4!",
    )
    text = text.replace(
        "8.Ke5 Kb4! (8...Kd8 is natural but loses on ac count of 9.Ka6! Kb4 10.Kd6 Kc8 11.Ka8+ Kb7 12.Kc5!",
        "8.Ke5 Rb4! (8...Kd8 is natural but loses on account of 9.Ra6! Rb4 10.Kd6 Kc8 11.Ra8+ Kb7 12.Kc5!",
    )
    text = text.replace(
        "12...Kb1 13.Kh8 Kc7 14.Kh7+ Kc8 15.Kc6 Kc1+ 16.Kd6",
        "12...Rb1 13.Rh8 Kc7 14.Rh7+ Kc8 15.Kc6 Rc1+ 16.Kd6",
    )
    text = text.replace(") 9.Ka6 Kd7.In conclusion", ") 9.Ra6 Kd7. In conclusion")
    text = text.replace(
        "6.Ra6 Kc8 7.R!a8+ Kb7 8 J ld8\nRrh4! = o g Side",
        "6.Ra6 Kc8 7.Ra8+ Kb7 8.Rd8 Rh4!= Long Side",
    )
    text = text.replace("3...Kd4 4.Rb8+", "3...Rxd4 4.Rb8+")
    text = text.replace("4.Kd6 Kc8 5.Kc6+ Kd8", "4.Kd6 4...Kc8 5.Kc6 Kd8")
    text = text.replace("2...RHI", "2...Rh1")
    text = text.replace("Rf.g7", "Rg7")
    text = text.replace("Rf.g5", "Rg5")
    text = text.replace("Rf.e7", "Re7")
    text = text.replace("Rf.e8", "Re8")
    text = text.replace("Rf.e6", "Re6")
    text = text.replace("Rf.a1", "Ra1")
    text = text.replace("Rf.a2", "Ra2")
    text = text.replace("Rf.a5", "Ra5")
    text = text.replace("Rf.a6", "Ra6")
    text = text.replace("Rf.a8", "Ra8")
    text = text.replace("Rf.xh6", "Rxh6")
    text = text.replace("Rf.h1", "Rh1")
    text = text.replace("Rf.fl", "Rf1")
    text = text.replace("1.gb8?", "1.Rb8?")
    text = text.replace("8.d7 gh5+", "8.d7 Rh5+")
    text = text.replace("10.Kc5 bth5+", "10.Kc5 Rh5+")
    text = text.replace("and5.Kc6", "and 5.Kc6")
    text = text.replace("3.Rg7.Kg3", "3.Rg7 Kg3")
    text = text.replace("5....r! g1+", "5...Rg1+")
    text = text.replace("Ii xf5", "Rxf5")
    text = text.replace("Iie2+", "Re2+")
    text = text.replace("Iie8+", "Re8+")
    text = text.replace("Iif2", "Rf2")
    text = text.replace("Ii f2", "Rf2")
    text = text.replace("Iia2", "Ra2")
    text = text.replace("IiaS", "Ra5")
    text = text.replace("Iia8", "Ra8")
    text = text.replace("l:la1", "Ra1")
    text = text.replace("l:la7", "Ra7")
    text = text.replace("l:la8", "Ra8")
    text = text.replace("l:lb1", "Rb1")
    text = text.replace("l:lc1", "Rc1")
    text = text.replace("l:lh7", "Rh7")
    text = text.replace("l:lh8", "Rh8")
    text = text.replace("l:lg8", "Rg8")
    text = text.replace("l:i. b1+", "Rb1+")
    text = text.replace("l:l h8+", "Rh8+")
    text = text.replace("l:l xb 19.a8=Q", "Rxb1 9.a8=Q")
    text = text.replace("7R;[b6+!", "7.Rb6+!")
    text = text.replace("SRa6?", "8.Ra6?")
    text = text.replace("With6.Ra7", "With 6.Ra7")
    text = text.replace("Ke8lready", "we already")
    text = text.replace("10) Ke8rrange", "10) Arrange")
    text = text.replace("2.tt.Rf2!", "2.Nf2!")
    text = text.replace("5.t2Rg3", "5.Ng3")
    text = text.replace("6.t2lf5+", "6.Nf5+")
    text = text.replace("9.t2Rd6!", "9.Nd6!")
    text = text.replace("10.t2Rb5", "10.Nb5")
    text = text.replace("10.t2Rd6+!", "10.Nd6+!")
    text = text.replace(
        "11.<J;;>c6 <J;;>as 12.jLd 4 <J;t b4 13.t2Re3",
        "11.Kc6 Ka8 12.Bd4 Kb4 13.Ne3",
    )
    text = text.replace(
        "ever, it requires analysis as well. 11.Kc6 Ka8 12.Bd4 Kb4 13.Ne3",
        "10...Kb8\n10...Ka6 is a somewhat illogical attempt to flee towards the mating corner. However, it requires analysis as well. 11.Kc6 Ka5 12.Bd4 Kb4 13.Ne3",
    )
    text = text.replace("28.tLlf5 <J;th8.If", "28.Nf5 Kh8. If")
    text = text.replace(
        "29.Jtcs <J;tg8 30.tLlh6+ <J;th8 3 I.Jtd4 mate.",
        "29.Bc5 Kg8 30.Nh6+ Kh8 31.Bd4 mate.",
    )
    text = text.replace("19.t2Re7 <J;tf6", "19.Ne7 Kf6")
    text = text.replace("Analysis diagra m 13.5", "Analysis diagram 13.5")
    text = text.replace(
        "Step 4: The king occupies the pivotal square. The rest of the ending is purely me chanical.\n\nStep 5:",
        "Step 4: The king occupies the pivotal square. The rest of the ending is purely mechanical.\n11...Ka8 12.Nd6\n\nStep 5:",
    )
    text = text.replace(
        "Step 5: The knight gets ready t o drive the king off the corner from the c7 -square.\n\nStep 6:",
        "Step 5: The knight gets ready to drive the king off the corner from the c7-square.\n12...Kb8 13.Nb5 Ka8 14.Nc7+ Kb8 15.Bd4 Kc8 16.Ba7\n\nStep 6:",
    )
    text = text.replace(
        "Who do you think was the inventor of this manoeuvre? Yes, it was Philidor!\n\nAnd now the king must make a decision.",
        "Who do you think was the inventor of this manoeuvre? Yes, it was Philidor!\n16...Kd8 17.Nd5 Ke8 18.Kd6\n\nAnd now the king must make a decision.",
    )
    text = text.replace(
        "In practical play, the main concern for\nWhite is the attempt to escape. It is also the longest line.\n\nBy now, the knight must complete the first cycle.",
        "In practical play, the main concern for\nWhite is the attempt to escape. It is also the longest line.\n18...Kf7\n18...Kd8 is weaker. Here the knight repeats its manoeuvre (7th-5th and 5th-7th).\nBy now, the knight must complete the first cycle.",
    )
    text = text.replace(
        "19.Ke7 Ke8 20.Ke6 Kd8\n21.Kb6+",
        "19.Ne7 Ke8 20.Ke6 Kd8\n21.Bb6+",
    )
    text = text.replace("22.Kc7\n(zugzwang again)", "22.Bc7\n(zugzwang again)")
    text = text.replace("22...Kf8 23.Kf5", "22...Kf8 23.Nf5")
    text = text.replace("23...Ke8\n24.Kg7+", "23...Ke8\n24.Ng7+")
    text = text.replace("(26.Ke6 Kh7 27.Kf4 Kg8", "(26.Ne6 Kh7 27.Bf4 Kg8")
    text = text.replace("30.Kf8+ Kh8 31.Ke5 mate", "30.Nf8+ Kh8 31.Be5 mate")
    text = text.replace("26...Kf8 27.Kd6+", "26...Kf8 27.Bd6+")
    text = text.replace("28.tLlf5 <J;th8.If", "28.Nf5 Kh8. If")
    text = text.replace("28.tLlf5 Kh8.If", "28.Nf5 Kh8. If")
    text = text.replace("20.li,e3!", "20.Be3!")
    text = text.replace("21.li,g5", "21.Bg5")
    text = text.replace("2 I... <J;t g 7", "21...Kg7")
    text = text.replace("22.<J;te6", "22.Ke6")
    text = text.replace("22.t2Rc6", "22.Nc6")
    text = text.replace("23.t2Re5+", "23.Ne5+")
    text = text.replace("26.Jth6!", "26.Bh6!")
    text = text.replace("K98", "Kg8")
    text = text.replace("28.li,h6", "28.Bh6")
    text = text.replace("29.li,f8", "29.Bf8")
    text = text.replace("32.t2Rg4", "32.Ng4")
    text = text.replace("33.li,g7+", "33.Bg7+")
    text = text.replace("34.tt:Rf6", "34.Nf6")
    text = text.replace("1.5.f8+!", "1.Rf8+!")
    text = text.replace("1...a:ea2.Rf7", "1...Re8 2.Rf7")
    text = text.replace("1 ... a:ea 2Jlf7", "1...Re8 2.Rf7")
    text = text.replace("2.Re2!", "2...Re2!")
    text = text.replace("White threatens Ka7 -Ka8", "White threatens Ra7-Ra8")
    text = text.replace("3.5.h7! Re1!", "3.Rh7! Re1!")
    text = text.replace("3.S.h7! lie1 !", "3.Rh7! Re1!")
    text = text.replace("2...Kc8?! 3.Ka7 Rd8+ 4.c;!tc6 Kb8 5.Kb7+ c;!ta8", "2...Kc8?! 3.Ra7 Rd8+ 4.Kc6 Kb8 5.Rb7+ Ka8")
    text = text.replace("2...Kc8?! 3.Ka7 Rd8+ 4.Kc6 Kb8 5.Kb7+ Ka8", "2...Kc8?! 3.Ra7 Rd8+ 4.Kc6 Kb8 5.Rb7+ Ka8")
    text = text.replace("5...c;!t c8 6.Ke6+", "5...Kc8 6.Be6+")
    text = text.replace("5...Kc8 6.Ke6+", "5...Kc8 6.Be6+")
    text = text.replace("6.Rb5 c;!ta7\n7.Ra5+ Kb8 8.c;!tb6+-", "6.Rb5 Ka7\n7.Ra5+ Kb8 8.Kb6+-")
    text = text.replace("2...Kh8?! 3..U.a7 Kh6+", "2...Kh8?! 3.Ra7 Kh6+")
    text = text.replace("2...Kh8?! 3.Ra7 Kh6+\n4.Ke6", "2...Rh8?! 3.Ra7 Rh6+\n4.Be6")
    text = text.replace("3...Ke3 4.Rd7+ This", "3...Ke3 4.Rd7+ This")
    text = text.replace("4...c;!t e8", "4...Ke8")
    text = text.replace("4...Kc8 5.Ka7+- and mate, as Rb3", "4...Kc8 5.Ra7+- and mate, as Rb3")
    text = text.replace("lethal threat Kc6+", "lethal threat Bc6+")
    text = text.replace("6.Kf7+ (again a time-gaining check)", "6.Rf7+ (again a time-gaining check)")
    text = text.replace("6...c;!t e8 7.Rf4!", "6...Ke8 7.Rf4!")
    text = text.replace("threatening7.Kc6", "threatening 7.Kc6")
    text = text.replace("threatening 7.Kc6", "threatening 7.Bc6")
    text = text.replace("4..Rc1", "4...Rc1")
    text = text.replace("8.Ke4! +-", "8.Be4!+-")
    text = text.replace("4.Kb3 Ke2!", "4.Bb3 Re2!")
    text = text.replace("4...c;!t c8 5.Ka7 Kb1", "4...Kc8 5.Ra7 Rb1")
    text = text.replace("4...Kc8 5.Ka7 Kb1", "4...Kc8 5.Ra7 Rb1")
    text = text.replace("6.:l:H7!", "6.Rh7!")
    text = text.replace("6...c;!t b8", "6...Kb8")
    text = text.replace("6...Kb6+ 7.Kc6", "6...Rb6+ 7.Bc6")
    text = text.replace("7.Kf8+ c;!ta7", "7.Rf8+ Ka7")
    text = text.replace("8.Ra8+ c;!tb6", "8.Ra8+ Kb6")
    text = text.replace("9.Kb8+ +-", "9.Rb8++-")
    text = text.replace("5..tb3!!", "5.Bb3!!")
    text = text.replace("5..Rc3", "5...Rc3")
    text = text.replace("7.Rh4 Iie 1", "7.Rh4 Re1")
    text = text.replace("8..Rd7+", "8.Rd7+")
    text = text.replace("10..Rb7+", "10.Rb7+")
    text = text.replace("11.R(b4", "11.Rb4")
    text = text.replace("11...KdB", "11...Kd8")
    text = text.replace("end of the3... Ii e3", "end of the 3...Re3")
    text = text.replace("1.Ke8+ Kd8 2.Ke7 Kd2", "1.Re8+ 1...Rd8 2.Re7 2...Rd2")
    text = text.replace("2...J lh8", "2...Rh8")
    text = text.replace("5.Kd6 l:lh 16.Rg7 Rc1+", "5.Kd6 Rh1 6.Rg7 Rc1+")
    text = text.replace("7.Kc5 l:lb 18.Rg4", "7.Bc5 Rb1 8.Rg4")
    text = text.replace(
        "3.Kf7 Kd1 4.Ka7 Kb1 5.Ka3 Kb3 6.Kd6 Kc3+ 7.Kc5 Kb3 8.Kc7+ Kb8 9.Kh7\nKa5 10.Ka7+",
        "3.Rf7 Rd1 4.Ra7 Rb1 5.Ba3 Rb3 6.Bd6 Rc3+ 7.Bc5 Rb3 8.Rc7+ Kb8 9.Rh7\nKa8 10.Ra7+",
    )
    text = text.replace("10...Kb8 11.Ka4 Kc8\n12.Kb4+-", "10...Kb8 11.Ra4 Kc8\n12.Bb4+-")
    text = text.replace("1.Kd8+ Kc8 2.Kd7 Kc1 3.Kf7 Kc2 4.Kg7", "1.Rd8+ Rc8 2.Rd7 Rc1 3.Rf7 Rc2 4.Rg7")
    text = text.replace("4...Kc1 5.Ka4!", "4...Rc1 5.Ba4!")
    text = text.replace("5...Kc3 (5...Rb1+", "5...Rc3 (5...Rb1+")
    text = text.replace("6.Kc6;g_b3+! 7.Kb5 Kc3! 8.Kc6 Kb3+ 9.Kc5", "6.Bc6 Rb3+! 7.Bb5 Rc3! 8.Bc6 Rb3+ 9.Kc5")
    text = text.replace("9...Rf.b1", "9...Rb1")
    text = text.replace("10.Ad5", "10.Bd5")
    text = text.replace("10...Rf1!", "10...Rf1!")
    text = text.replace("12.R'!e7", "12.Re7")
    text = text.replace("Rh1 l 7.Kd5 Rh6+", "Rh1 17.Bd5 Rh6+")
    text = text.replace("11..J U6+! 12.Ae6 1:lf1 13.:C:g8+", "11...Rf6+! 12.Be6 Rf1 13.Rg8+")
    text = text.replace("14.Ad5 Kd1", "14.Bd5 Rd1")
    text = text.replace("15. .Ma8+", "15.Ra8+")
    text = text.replace("16Jlb8+", "16.Rb8+")
    text = text.replace("17J:ra8+", "17.Ra8+")
    text = text.replace("18Jla2 l:rb1", "18.Ra2 Rb1")
    text = text.replace("1..J lb1", "1...Rb1")
    text = text.replace("1.Rh2 (1.Rc8+.i:!Rb8 2.Rc7 Rb7!)", "1.Rh2 (1.Rc8+ Rb8 2.Rc7 Rb7!)")
    text = text.replace("1...Ra7+ 2.Kb6 Rb7+ 3.Kc6 Rb1\n4.Kc3! Rb7 5 J Kg2!", "1...Ra7+ 2.Kb6 Rb7+ 3.Kc6 Rb1\n4.Bc3! Rb7 5.Rg2!")
    text = text.replace("2.Rh6 (2.Rh3 Rb7 3.Kb6?? Ra7+! =) 2.Rb7 3.Ab6.Ra7+ 4.Kb5 1:lf7 5.Kc6 Rf8 6.Ac7 Rg8 7.Ad6 1:le8 8.Rh1+-", "2.Rh6 (2.Rh3 Rb7 3.Bb6?? Ra7+!=) 2...Rb7 3.Bb6 Ra7+ 4.Kb5 Rf7 5.Kc6 Rf8 6.Bc7 Rg8 7.Bd6 Re8 8.Rh1+-")
    text = text.replace("5.i?Le3?", "5.Be3?")
    text = text.replace(".ric5+ 7.Ke5", "Rc5+ 7.Ke5")
    text = text.replace("h;thal", "lethal")
    text = text.replace("7.i?Lf4+", "7.Bf4+")
    text = text.replace("8.:blc1", "8.Rc1")
    text = text.replace("11.i?Lg3!?", "11.Bg3!?")
    text = text.replace("1 2JU3+", "12.Rf3+")
    text = text.replace("14...J ie2!", "14...Re2!")
    text = text.replace("18.. ki:e2=", "18...Re2=")
    text = text.replace("19 J Ka1", "19.Ra1")
    text = text.replace("22Ri:e4", "22.Rxe4")
    text = text.replace("25.Kh3.Rc2", "25.Kh3 Rc2")
    text = text.replace("1.f2-1.f2", "1/2-1/2")
    text = re.sub(r"(?<![A-Za-z])([KQRBN])([a-h])\s+([1-8])", r"\1\2\3", text)
    text = text.replace(
        "4..J Ke1+ 5.Kd6Rd1+ 6.Ke6Re1+ 7.Kd5Rd1+",
        "4...Re1+ 5.Kd6 Rd1+ 6.Ke6 Re1+ 7.Kd5 Rd1+",
    )
    text = text.replace(
        "4..J Ke1+ 5.Kd6 Rd1+ 6.Ke6 Re1+ 7.Kd5 Rd1+",
        "4...Re1+ 5.Kd6 Rd1+ 6.Ke6 Re1+ 7.Kd5 Rd1+",
    )
    text = text.replace(
        "4..J Ke1+ 5.Kd6.Rd1+ 6.Ke6.Re1+ 7.Kd5.Rd1+",
        "4...Re1+ 5.Kd6 Rd1+ 6.Ke6 Re1+ 7.Kd5 Rd1+",
    )
    text = re.sub(
        r"(?<![A-Za-z])(?:l:i:?|l:\.|li|ll|tl|I:t|:)\s*x?\s*([a-h])\s*([lIit1-8S])(?=[,.;:)!?=+\s-]|$)",
        lambda match: "R" + match.group(1) + normalize_square_rank(match.group(2)),
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z])(?:\.t:i:?|t:i:?|JK:|R:)\s*x?\s*([a-h])\s*([lIit1-8S])(?=[,.;:)!?=+\s-]|$)",
        lambda match: "R" + match.group(1) + normalize_square_rank(match.group(2)),
        text,
    )
    return text


def clean_late_ocr_notation_collisions(text: str) -> str:
    # Repairs that only become visible after generic chess-font glyph handling.
    text = text.replace(
        "2...Kg1?! losing, on account of3.Kc6! Kc1+",
        "2...Rg1?! losing, on account of 3.Kc6! Rc1+",
    )
    text = text.replace(
        "4.Kd6+- and now 4...Kc8 5.Ka6 Kb8 6.Ke6 Kc8 7.d6 Kb8 8.Ka1 Kc8 9.Kh1",
        "4.Kd6+- and now 4...Rc8 5.Ra6 Rb8 6.Ke6 Rc8 7.d6 Rb8 8.Ra1 Rc8 9.Rh1",
    )
    text = text.replace(
        "but in this line3...Kc8! holds",
        "but in this line 3...Kc8! holds",
    )
    text = text.replace(
        "4.Kd6+- and now 4...Kc8 5.Ra6 Kb8 6.Ke6 Kc8 7.d6 Kb8 8.Ra1 Kc8 9.Rh1",
        "4.Kd6+- and now 4...Rc8 5.Ra6 Rb8 6.Ke6 Rc8 7.d6 Rb8 8.Ra1 Rc8 9.Rh1",
    )
    text = text.replace(
        "but in this line 3...Kc8! holds",
        "but in this line 3...Kc8! holds",
    )
    text = text.replace(
        "but in this line 3...Rc8! holds",
        "but in this line 3...Kc8! holds",
    )
    return text


def clean_final_ocr_notation_collisions(text: str) -> str:
    text = text.replace(
        "but in this line 3...Rc8! holds",
        "but in this line 3...Kc8! holds",
    )
    text = text.replace(") 9.Ka6 Kd7.In conclusion", ") 9.Ra6 Kd7. In conclusion")
    text = text.replace("1...a:ea2.Rf7", "1...Re8 2.Rf7")
    text = text.replace("1.Re8+ Kd8 2.Re7 Rd2", "1.Re8+ 1...Rd8 2.Re7 2...Rd2")
    text = text.replace("The threat i s... Re2", "The threat is ...Re2")
    text = text.replace("25.Kh3.Rc2", "25.Kh3 Rc2")
    text = text.replace("and2.h3.If", "and 2.h3. If")
    text = text.replace("and2.h3. If", "and 2.h3. If")
    text = text.replace("of1.Kc5", "of 1.Kc5")
    text = text.replace("the1.b4?", "the 1.b4?")
    text = text.replace("Here1.h6", "Here 1.h6")
    text = text.replace("5.dS + .. Kd6", "5.d5+ Kd6")
    text = text.replace("5.dS +\n..\nKd6", "5.d5+ Kd6")
    text = text.replace("Ke8k side", "weak side")
    text = text.replace("6.Kb8+- the rest", "6.Kb8+-. The rest")
    text = text.replace("5.dS + Kd6", "5.d5+ Kd6")
    text = text.replace("7.dS + Kd6", "7.d5+ Kd6")
    text = text.replace("key squares cS and d6", "key squares c5 and d6")
    text = text.replace("that square is dS", "that square is d5")
    text = text.replace("1.Ka6\nWe can", "1.Ka6.\nWe can")
    text = text.replace("1...Kc8!\nThis is", "1...Kc8!\nThis is")
    text = text.replace("With6.Ra7", "With 6.Ra7")
    text = text.replace("alternative3.Rb7", "alternative 3.Rb7")
    text = text.replace("10..Re1!", "10...Re1!")
    text = text.replace("for example:... Kg6", "for example: ...Kg6")
    text = text.replace("cutting off the king4...Ra2!", "cutting off the king 4...Ra2!")
    text = text.replace("if4...Ka4", "if 4...Ka4")
    text = text.replace("threatening5.Rg8", "threatening 5.Rg8")
    text = text.replace("10.Kf8.As", "10.Kf8. As")
    text = text.replace("and3.f7.", "and 3.f7.")
    text = text.replace("Rxf8+ 11.Kf8", "Rxf8+ 11.Kxf8")
    text = text.replace("So... 1...Kg1+ 2.Kf6", "So... 1...Kg1+ 2.Kf6")
    text = text.replace("13.Kf8! +-", "13.Kf8!+-")
    text = text.replace("Ka5+= makes no progress and4.h7.", "Ka5+= makes no progress and 4.h7.")
    text = text.replace("Ending 66, .. White", "Ending 66, White")
    text = text.replace("2.a5 Or 2.h5", "2.a5. Or 2.h5")
    text = text.replace("and5.Kc6", "and 5.Kc6")
    text = text.replace("if2...Ra2+", "if 2...Ra2+")
    text = text.replace("2...g 53.Rb2\ng3", "2...g5 3.Rb2\ng3")
    text = text.replace("Black intends.. Rf4-f2", "Black intends ...Rf4-f2")
    text = text.replace("3.Rg7.Kg3", "3.Rg7 Kg3")
    text = text.replace("4.Kf1 Rta l +", "4.Kf1 Ra1+")
    text = text.replace("gxf1 K+", "gxf1=Q+")
    text = text.replace("2. \\i?f2??", "2.Kf2??")
    text = text.replace("2...\\i? xf4", "2...Kxf4")
    text = text.replace("2... \\i? e3 3.\\i?fl", "2...Ke3 3.Kf1")
    text = text.replace("1.\\i?g4? \\i?c2!", "1.Kg4? Kc2!")
    text = text.replace("2.\\i? f3 \\i?d3!", "2.Kf3 Kd3!")
    text = text.replace("3.\\i?f2 \\i?c4 4.\\i?e2 \\i?bS 5.\\i?d3 \\i?xb6 6.\\i?c3 \\i?b5", "3.Kf2 Kc4 4.Ke2 Kb5 5.Kd3 Kxb6 6.Kc3 Kb5")
    text = text.replace("2.rKi>f2!", "2.Kf2!")
    text = text.replace("5.'Kc3 1it>xb6", "5.Kc3 Kxb6")
    text = text.replace("1 <Re6.I. \\iie7?", "1.Re6! 1.Ke7?")
    text = text.replace("1... \\i ic3 2.\\iid7 <Rd4 3.\\iic7", "1...Kc3 2.Kd7 Rd4 3.Kc7")
    text = text.replace("4.Kb7 <Rd6 5.\\iixa7\n\\iic7=", "4.Kb7 Rd6 5.Kxa7\nKc7=")
    text = text.replace("1 <Rc3", "1.Rc3")
    text = text.replace("2...<Rd3", "2...Rd3")
    text = text.replace("1. rJifg2? rJiff4 2.rJiff2", "1.Kg2? Kf4 2.Kf2")
    text = text.replace("2... rJ? xe5 3.rJiff3 rJiff5", "2...Kxe5 3.Kf3 Kf5")
    text = text.replace("2... rJ?xe4", "2...Kxe4")
    text = text.replace("13.<it> b7+-", "13.Kb7+-")
    text = text.replace("6.d5 'litb2", "6.d5 Kb2")
    text = text.replace("9.d8Qa1 if 10.Qd2+!+-", "9.d8=Q a1=Q 10.Qd2+!+-")
    text = text.replace("9.d8Qa2 10.Qd4+-", "9.d8=Q a2 10.Qd4+-")
    text = text.replace("3.Kd5? Wxfs 4.Kc5", "3.Kd5? Kxf5 4.Kc5")
    text = text.replace("b4the moment", "b4 the moment")
    text = text.replace("hS pawn", "h5 pawn")
    text = text.replace("the hS pawn", "the h5 pawn")
    text = text.replace("from h 1", "from h1")
    text = text.replace("on fl", "on f1")
    text = text.replace("1...£4!", "1...f4!")
    text = text.replace("1.Kg6...As", "1.Kg6. As")
    text = text.replace("will be5.Kh6", "will be 5.Kh6")
    text = text.replace("7.c;tJes c;tJf7 8.c;tJfs c;tJg7 9.c;tJe6!", "7.Ke5 Kf7 8.Kf5 Kg7 9.Ke6!")
    text = text.replace("9...c;tJ g6 10.h5+!", "9...Kg6 10.h5+!")
    text = text.replace(
        "1...c;tJ gs\nO\n(1...c;tJ g7 11.c;tJe7 c;tJh7 12.c;tJf6 c;tJg8 13.c;tJg6",
        "10...Kg5\n(10...Kg7 11.Ke7 Kh7 12.Kf6 Kg8 13.Kg6",
    )
    text = text.replace("11.c;tJf7 c;tJxg4", "11.Kf7 Kxg4")
    text = text.replace("2...c;tJ h6", "2...Kh6")
    text = text.replace("1.gS fS +!", "1.g5 f5+!")
    text = text.replace("1...f xgS", "1...fxg5")
    text = text.replace("3.Kfs Ke7", "3.Kf5 Ke7")
    text = text.replace("bS pawn", "b5 pawn")
    text = text.replace("cS, dS and eS", "c5, d5 and e5")
    text = text.replace("key squares cS and dS", "key squares c5 and d5")
    text = text.replace("attacks cS and dS", "attacks c5 and d5")
    text = text.replace("square is dS", "square is d5")
    text = text.replace("from cS to c4", "from c5 to c4")
    text = text.replace("the g 7 pawn", "the g7 pawn")
    text = text.replace("1...g S", "1...g5")
    text = text.replace("4...g 55.b6", "4...g5 5.b6")
    text = text.replace("5...g 56.b6", "5...g5 6.b6")
    text = text.replace("7.rJiia7", "7.Ka7")
    text = text.replace("9.b8K+", "9.b8Q+")
    text = text.replace("2.b4 W£73.b5", "2.b4 Kf7 3.b5")
    text = text.replace("3.b5 cJile7", "3.b5 Ke7")
    text = text.replace("<JidS", "Kd5")
    text = text.replace("square is cS", "square is c5")
    text = text.replace("4...h 55.g5+", "4...h5 5.g5+")
    text = text.replace("4...h 65.Kg4!", "4...h6 5.Kg4!")
    text = text.replace("1...h 62.g4+ c;t?gs 3.c;t?g3! hS", "1...h6 2.g4+ Kg5 3.Kg3! h5")
    text = text.replace("3...c;t? f6 4.c;t?f4", "3...Kf6 4.Kf4")
    text = text.replace("5.g S +-", "5.g5+-")
    text = text.replace("1...c;t? gs 2.c;t?e4 hS 3.c;t?es h4", "1...Kg5 2.Ke4 h5 3.Ke5 h4")
    text = text.replace("2.c;t?e3", "2.Ke3")
    text = text.replace("2.h4 c;t?es", "2.h4 Ke5")
    text = text.replace("2...c;t?e5 3.g3 cJtf5", "2...Ke5 3.g3 Kf5")
    text = text.replace("4.c;t?f3 r;t>gs 5.h3 c;t(fS =", "4.Kf3 Kg5 5.h3 Kf5=")
    text = text.replace("4...cJt e5=", "4...Ke5=")
    text = text.replace("I..Rrb7?", "1...Rb7?")
    text = text.replace("4...J';la3", "4...Ra3")
    text = text.replace("and3.f7.Checks", "and 3.f7. Checks")
    text = text.replace("10.Kf8.As", "10.Kf8. As")
    text = text.replace("f7 -f8.It", "f7-f8. It")
    text = text.replace("Rrxf8+", "Rxf8+")
    text = text.replace("In the previous ending Ke1earnt", "In the previous ending we learnt")
    text = text.replace("3.<it>f6\n..", "3...Kf6")
    text = text.replace("4.. Stiff7?", "4...Kf7?")
    text = text.replace("5.<it>g5 k:rg1+!", "5.Kg5 Rg1+!")
    text = text.replace("7.<it>h6", "7.Kh6")
    text = text.replace("8.k:re7", "8.Re7")
    text = text.replace("8...k:rb1", "8...Rb1")
    text = text.replace("10.k:re5 I:ta 111 Rd5 Kf1", "10.Re5 Ra1 11.Rd5 Kf1")
    text = text.replace("12.Rd4 k:ra1.Back", "12.Rd4 Ra1. Back")
    text = text.replace("13.k:rd6 Ka5+ 14.<it>g4 k:ra1", "13.Rd6 Ra5+ 14.Kg4 Ra1")
    text = text.replace("15.k:re6 k:rg1+ 16.<it>f5 k:ra1", "15.Re6 Rg1+ 16.Kf5 Ra1")
    text = text.replace("23JKte6 Ka2", "23.Ke6 Ra2")
    text = text.replace("27JJ..e7", "27.Re7")
    text = text.replace("30.Ke6Ra6+", "30.Ke6 Ra6+")
    text = text.replace("6.Kd6 ctitb7 7.'Jil d 7", "6.Kd6 Kb7 7.Kd7")
    text = text.replace("9.c:Ji;c7", "9.Kc7")
    text = text.replace("2.Kf2 <Rh3", "2.Kf2 Kh3")
    text = text.replace("9.d8=Qa1=Q", "9.d8=Q a1=Q")
    text = text.replace("Therefore, l h6 is", "Therefore, 1...h6 is")
    text = text.replace("Ke8knesses", "weaknesses")
    text = text.replace("9...cJif h8!", "9...Kh8!")
    text = text.replace("10.RIbS", "10.Rb5")
    text = text.replace("3.'iitf3 Kh5", "3.Kf3 Kh5")
    text = text.replace("3..Ra1!", "3...Ra1!")
    text = text.replace("10.Kf6! 1:lf4+", "10.Kf6! Rf4+")
    text = text.replace("11 J lg7+!", "11.Rg7+!")
    text = text.replace("4.h7.Rg1-\n+!", "4.h7 Rg1+!")
    text = text.replace("5.fS cJfh7", "5.f5 Kh7")
    text = text.replace(
        "6.RIh3 RIg l + 7.cJfh5 RIfl 8.Kg5 RIg l + 9.Kf6 RIa l! I O.RIe3 RIa2\n11.RIe6",
        "6.Rh3 Rg1+ 7.Kh5 Rf1 8.Kg5 Rg1+ 9.Kf6 Ra1! 10.Re3 Ra2\n11.Re6",
    )
    text = text.replace("Threatening RIc6 and Kg5", "Threatening Rc6 and Kg5")
    text = text.replace("5.Rc7\nThreatening RIc6", "5.Rc7\nThreatening Rc6")
    text = text.replace(
        "6.Kf5 k:ra 17.k:rc7+ (7.Kg6+ K£7=)",
        "6.Kf5 Ra1 7.Rc7+ (7.Kg6+ Kf7=)",
    )
    text = text.replace("8.cJfe4 RIhS 9.RIa7 RIh 110.RId7", "8.Ke4 Rh5 9.Ra7 Rh1 10.Rd7")
    text = text.replace("13.Ke7 cJfxh7=", "13.Ke7 Kxh7=")
    text = text.replace("6...RIg1+? 7.Kf3 RIh 1", "6...Rg1+? 7.Kf3 Rh1")
    text = text.replace("10.Kd5 RId1+ 11.Ke6 RIe1+ 12.Kd6 RId1+", "10.Kd5 Rd1+ 11.Ke6 Re1+ 12.Kd6 Rd1+")
    text = text.replace("10.Rd7 (10.Kd5 RId1+ 11.Ke6 RIe1+\n12.Kd6 RId1+", "10.Rd7 (10.Kd5 Rd1+ 11.Ke6 Re1+\n12.Kd6 Rd1+")
    text = text.replace("7.Rr 5.RIg1+, drawing easily.\nc", "7.Rc5 Rg1+, drawing easily.")
    text = text.replace("waiting move7.Rb7", "waiting move 7.Rb7")
    text = text.replace("7...l'l h2.Now after 8.l'lb5the", "7...Rh2. Now after 8.Rb5 the")
    text = text.replace("7...Rh2.Now after 8.Rb5the", "7...Rh2. Now after 8.Rb5 the")
    text = text.replace("9.l'lg5+", "9.Rg5+")
    text = text.replace("9.cJifg3 l'lxh7=", "9.Kg3 Rxh7=")
    text = text.replace("9.f5 RIxh7=", "9.f5 Rxh7=")
    text = text.replace(
        "10...RIh5 11.RIc7 RIh 112.Kd5 RId1+ 13.Kc6 Kc1+",
        "10...Rh5 11.Rc7 Rh1 12.Kd5 Rd1+ 13.Kc6 Rc1+",
    )
    text = text.replace(
        "14.Kd7 RId1+ 15.cJfe8 RIa 116.RId7 RIe1+ 17.l'le7 RIa 118.Kf8 RIh 119.Kg8+-",
        "14.Kd7 Rd1+ 15.Ke8 Ra1 16.Rd7 Re1+ 17.Re7 Ra1 18.Kf8 Rh1 19.Kg8+-",
    )
    text = text.replace("5.Rlgl +!? 6.Kf3 RIh1=", "5.Rg1+!? 6.Kf3 Rh1=")
    text = text.replace("S l:lh l?! 6.RIc6+ Kf7", "5.Rh1?! 6.Rc6+ Kf7")
    text = text.replace(".Rrg1+ 4.Kh6 Kf1", "Rg1+ 4.Kh6 Rf1")
    text = text.replace("2...Rrb1!", "2...Rb1!")
    text = text.replace("18...n as + 19.Kg4", "18...Ra5+ 19.Kg4")
    text = text.replace("23.Kg6 Kg1+ 24.Kf6.tih1!", "23.Kg6 Rg1+ 24.Kf6 Rh1!")
    text = text.replace(
        "31.Rd6\nnaa 32.Rd4 Kgs 33.Rg4+ Kf8",
        "31.Rd6\nRa8 32.Rd4 Kg8 33.Rg4+ Kf8",
    )
    text = text.replace(
        "76.s... Kh7 7.Ke5 nbs a.Kd5 Kg6 9.'tt c5 Kf6 10.Kb5.tU5+! 11.Kb6 Kf6+!",
        "76. 6...Kh7 7.Ke5 Rb5+ 8.Kd5 Kg6 9.Kc5 Kf6 10.Kb5 Rb5+! 11.Kb6 Rf6+!",
    )
    text = text.replace("1 J1d4.:Ib6", "1.Rd4 Rb6")
    text = text.replace("1. l:la l?", "1.Ra1?")
    text = text.replace("6.Kc4 Kg4+!", "6.Kc4 Rg4+!")
    text = text.replace("8.Kb4 Kg4+", "8.Kb4 Rg4+")
    text = text.replace("2...Rib4+", "2...Rb4+")
    text = text.replace("3..Rb7!", "3...Rb7!")
    text = text.replace("h7.3...Kg5??", "h7. 3...Kg5??")
    text = text.replace("4..Bg8+", "4.Rg8+")
    text = text.replace("8.h7 I:1.b8! =", "8.h7 Rb8!=")
    text = text.replace("4.f.tg8+", "4.Rg8+")
    text = text.replace("5.f.te8 Kg6", "5.Re8 Kg6")
    text = text.replace("5..Rb5+", "5...Rb5+")
    text = text.replace("6.Kf6 f.txg5!", "6.Kf6 Rxg5!")
    text = text.replace("6.Kf4 f.tb4+", "6.Kf4 Rb4+")
    text = text.replace("7.Ke5 1:lb7=", "7.Ke5 Rb7=")
    text = text.replace("1.:Ie4 Kb6", "1.Re4 Kb6")
    text = text.replace("With3...Bb5+?!", "With 3...Rb5+?!")
    text = text.replace("With3...Rb5+?!", "With 3...Rb5+?!")
    text = text.replace("4..Bd5.Bb7", "4.Rd5 Rb7")
    text = text.replace("5...Bb6+ 6.Ke7.Bb7+", "5...Rb6+ 6.Ke7 Rb7+")
    text = text.replace("7..Bd7 Mb5", "7.Rd7 Rb5")
    text = text.replace("(threatening.Bg5)", "(threatening Rg5)")
    text = text.replace("l'la2=.", "Ra2=.")
    text = text.replace("23._ge6 l'lf2!", "23.Ke6 Rf2!")
    text = text.replace("8._ga7!", "8.Ra7!")
    text = text.replace("8... _gxf4", "8...Rxf4")
    text = text.replace("_gg4+", "Rg4+")
    text = text.replace("RIa l! I O.RIe3 RIa2 11.RIe6", "Ra1! 10.Re3 Ra2 11.Re6")
    text = text.replace("1...i:tal?", "1...Ra1?")
    text = text.replace("1.. 1ia8.Preventing Ka4.", "1...Ra8. Preventing Ka4.")
    text = text.replace("Second method: 3.lla.", "Second method: 3.Ra8.")
    text = text.replace("to c8.Note", "to c8. Note")
    text = text.replace("3.Rf5.A", "3.Rf5. A")
    text = text.replace("4...Kf5! Note", "4...Kxf5! Note")
    text = text.replace("3.Kc4 Ud8=.", "3.Kc4 Kd8=.")
    text = text.replace("2...JKtg4!", "2...Kg4!")
    text = text.replace(". Ke7? Preparing", "1...Ke7? Preparing")
    text = text.replace("this is a1...useful resource", "this is a useful resource")
    text = text.replace("5.Ka6\n5.Ka5!?", "5.Ka6.\n5.Ka5!?")
    text = text.replace("2.1ic6", "2.Rc6")
    text = text.replace("5.blh6 Kd5", "5.Rh6 Kd5")
    text = text.replace("2...J1b8", "2...Rb8")
    text = text.replace("3...cJi;d5 4.cJ;;a4! cJ;;c4 5.Rc6+! cJi;d5", "3...Kd5 4.Ka4! Kc4 5.Rc6+! Kd5")
    text = text.replace("7.cJi;b4", "7.Kb4")
    text = text.replace("7... 1ib8 8.1ic7 cJi;d6 9.Ra7 cJi;d5 10.cJi;a5 cJ;;c5 11.1ic7+ cJi;d6 12.b6 Ira8+ 13.cJi;b5 1:1.a1", "7...Rb8 8.Rc7 Kd6 9.Ra7 Kd5 10.Ka5 Kc5 11.Rc7+ Kd6 12.b6 Ra8+ 13.Kb5 Ra1")
    text = text.replace("1...Irb8 2.Irh5 cJ;;f4 3.c5 1ic8 4.cJ;;c4 cJ;;e4 5.Rh6 cJi;e5", "1...Rb8 2.Rh5 Kf4 3.c5 Rc8 4.Kc4 Ke4 5.Rh6 Ke5")
    text = text.replace("1....tib8!", "1...Rb8!")
    text = text.replace("2.tig6 Rb7!", "2.Rg6 Rb7!")
    text = text.replace("Answer: No!.. Ke7?", "Answer: No! 1...Ke7?")
    text = text.replace("as 1.he will", "as he will")
    text = text.replace("2...K £73.Rh8", "2...Kf7 3.Rh8")
    text = text.replace("with2...Kh7?", "with 2...Kh7?")
    text = text.replace("6...Rb7.Ka7.That is the\nI +\npoint", "6...Rb7+ 7.Ka7. That is the point")
    text = text.replace("1.Kf6 Re1 2JJ.g3 I!e2", "1.Kf6 Re1 2.Rg3 Re2")
    text = text.replace("7.Kb6 l:Rf6+ a.Ka7", "7.Kb6 Rf6+ 8.Ka7")
    text = text.replace("11.Kd4 a:ts", "11.Kd4 Rf5")
    text = text.replace("with3...J ie2+?!", "with 3...Re2+?!")
    text = text.replace("with3...Re2+?!", "with 3...Re2+?!")
    text = text.replace("9.Kb4 ria l 10.Kc5+-", "9.Kb4 Ra1 10.Kc5+-")
    text = text.replace("6 J.lh7!", "6.Rh7!")
    text = text.replace("6... n as 7.a7", "6...Ra5 7.a7")
    text = text.replace("9.Kb4 Ka1 10.Kb5! +-.", "9.Kb4 Ra1 10.Kb5!+-.")
    text = text.replace("soundest being...Kg6:", "soundest being ...Kg6:")
    text = text.replace("a6-a7.4...Kf6", "a6-a7. 4...Kf6")
    text = text.replace("5.Kd4 Kb6 6.Kh7+-", "5.Kd4 Kb6 6.Rh7+-")
    text = text.replace("2.\\i(c3 l:la3+", "2.Kc3 Ra3+")
    text = text.replace("3.\\i(c2 Ka8=", "3.Kc2 Ka8=")
    text = text.replace("2...c;t>g3", "2...Kg3")
    text = text.replace("Attempting \\i(d3 or \\i(c3", "Attempting Kd3 or Kc3")
    text = text.replace("3.Rh7 \\i(f4", "3.Rh7 Kf4")
    text = text.replace("5.\\i(d3 \\i(f6", "5.Kd3 Kf6")
    text = text.replace("59.3Rh6", "59. 3.Rh6")
    text = text.replace("king of£", "king off")
    text = text.replace("5.\\i(c4 Ka4+", "5.Kc4 Ka4+")
    text = text.replace("7.\\i(b4", "7.Kb4")
    text = text.replace("3...c;t>g4", "3...Kg4")
    text = text.replace("king off3...Kf4", "king off 3...Kf4")
    text = text.replace("5.d5 Kf41", "5.d5 Kf4")
    text = text.replace("5.e7.Ra7+", "5.e7 Ra7+")
    text = text.replace("7.Kc5:Ie6", "7.Kc5 Re6")
    text = text.replace("1...Kf6Z", "1...Kf6")
    text = text.replace("2.Kd7Z", "2.Kd7")
    text = text.replace("3.Ke7Z", "3.Ke7")
    text = text.replace("3...<tt>g6", "3...Kg6")
    text = text.replace("4..Ra8!", "4.Ra8!")
    text = text.replace("5.Kd6:a:b6+", "5.Kd6 Rb6+")
    text = text.replace("7.Kc6.Re7", "7.Kc6 Re7")
    text = text.replace("8.Kd6 I:tb 79.e7+-", "8.Kd6 Rb7 9.e7+-")
    text = text.replace("4.Ra1!Rb7+", "4.Ra1! Rb7+")
    text = text.replace("5..Rb8+", "5...Rb8+")
    text = text.replace("11.:a:a1!", "11.Ra1!")
    text = text.replace("6.Kc7 l:Rb2", "6.Kc7 Rb2")
    text = text.replace("g7.7..J Kc2+", "g7. 7...Rc2+")
    text = text.replace("8.Kd7.ttd2+", "8.Kd7 Rd2+")
    text = text.replace("9.<tt>e8 Ka2", "9.Ke8 Ra2")
    text = text.replace("3 J!xd8 Kd8", "3.Rxd8 Kxd8")
    text = text.replace("2..Rb8+", "2...Rb8+")
    text = text.replace("5.Ka6 a:cs", "5.Ka6 Rc5")
    text = text.replace("15.l:la l Kb6=;", "15.Ra1 Kb6=;")
    text = text.replace("15.l:la l\nKb6=;", "15.Ra1\nKb6=;")
    text = text.replace("9.Kb6 ldb l + 10.Kc5 lda l =", "9.Kb6 Rb1+ 10.Kc5 Ra1=")
    text = text.replace("c6 or c7.3..Ra1", "c6 or c7. 3...Ra1")
    text = text.replace("In case of6...J ig 1", "In case of 6...Rg1")
    text = text.replace("8.Ra6? Ilh8+", "8.Ra6? Rh8+")
    text = text.replace("11.Kb8 And the pawn promotes. S ary", "11.Kb8. And the pawn promotes. Summary")
    text = text.replace("Summary of the ideas in this ending for the strong side:\numm\n", "Summary of the ideas in this ending for the strong side:\n")
    text = text.replace("1...J Kb8?!", "1...Kb8?!")
    text = text.replace("c8.2.c5", "c8. 2.c5")
    text = text.replace("1.f2-1h", "1/2-1/2")
    text = text.replace("Rf.h 15.Kg6", "Rh1 5.Kg6")
    text = text.replace("6...Rf. a 17.f6", "6...Ra1 7.f6")
    text = text.replace("Rf.aS +", "Ra8+")
    text = text.replace("2...Rf. a 13.Re7", "2...Ra1 3.Re7")
    text = text.replace("4..Re2+", "4...Re2+")
    text = text.replace("4...Rf. a5+", "4...Ra5+")
    text = text.replace("Rf.aS 7.Kg6", "Ra8 7.Kg6")
    text = text.replace("Rf.e5", "Re5")
    text = text.replace("Rf.e2+", "Re2+")
    text = text.replace("Rf.g8", "Rg8")
    text = text.replace("28.tLlf5 <J;th8.If", "28.Nf5 Kh8. If")
    text = text.replace("28.tLlf5 <J;th8. If", "28.Nf5 Kh8. If")
    text = text.replace("19... <J;t g7", "19...Kg7")
    text = text.replace("1..J lb5", "1...Rb5")
    text = text.replace("3.Rra6 Kc5", "3.Ra6 Rc5")
    text = text.replace("4.Kd3 Rrc7", "4.Bd3 Rc7")
    text = text.replace("6.Kd4 Rrg5", "6.Kd4 Rg5")
    text = text.replace("7.Ke4 Kh5 8.Rrg6!la5", "7.Be4 Rh5 8.Rg6 Ra5")
    text = text.replace("10.Ke5 Ke1+ 11.i,e4 Re2", "10.Ke5 Re1+ 11.Be4 Re2")
    text = text.replace("1 2Rig7+ Ke8", "12.Rg7+ Ke8")
    text = text.replace("1 3RRa7 Re1", "13.Ra7 Re1")
    text = text.replace("15.i,f5", "15.Bf5")
    text = text.replace(
        "Let us compare this situation to the starting position.",
        "15...Re7 16.Ra8+ Kf7 17.Ra1 Kf6 18.Bc8\nLet us compare this situation to the starting position.",
    )
    text = text.replace(
        "15...Re7 16.Ra8+ Kf7 17.Ra1 Kf6 18.Bc8\n15...Re7 16.Ra8+ Kf7 17.Ra1 Kf6 18.Bc8\nLet us compare this situation to the starting position.",
        "15...Re7 16.Ra8+ Kf7 17.Ra1 Kf6 18.Bc8\nLet us compare this situation to the starting position.",
    )
    text = re.sub(
        r"(15\.\.\.Re7 16\.Ra8\+ Kf7 17\.Ra1 Kf6 18\.Bc8)\s+\1(?=\s+Let us compare)",
        r"\1",
        text,
    )
    text = text.replace(
        "Black keeps the white king cut off for some moves.\n\n24.Kd5",
        "Black keeps the white king cut off for some moves.\n\n18...Re5+ 19.Kd6 Re2 20.Rf1+ Kg5 21.Bb7 Re3 22.Kd5 Re2 23.Kd4 Re7\n24.Bd5",
    )
    text = text.replace(
        "18...Re5+ 19.Kd6 Re2 20.Rf1+ Kg5 21.Bb7 Re3 22.Bd5 Re2 23.Bd4 Re7\n24.Kd5 Re8 25.Rh7 Rb8",
        "18...Re5+ 19.Kd6 Re2 20.Rf1+ Kg5 21.Bb7 Re3 22.Kd5 Re2 23.Kd4 Re7\n24.Bd5 Re8 25.Rf7 Rb8",
    )
    text = text.replace("24.Kd5 Ue8 25JH7 Ub8", "24.Bd5 Re8 25.Rf7 Rb8")
    text = text.replace("24.Bd5 Ue8 25JH7 Ub8", "24.Bd5 Re8 25.Rf7 Rb8")
    text = text.replace("25...Re1 26..i,e4 lda l 27.Ke5 ldaS + 28..i,ds l:lbS", "25...Re1 26.Be4 Rd1 27.Ke5 Rd5+ 28.Bd5 Rb5")
    text = text.replace("26.<ifJe5.:tb5 27.Rf1Ra5 28.Rg1+ <ifJh5", "26.Ke5 Rb5 27.Rf1 Ra5 28.Rg1+ Kh5")
    text = text.replace("29.Rh1+ <iii;g5", "29.Rh1+ Kg5")
    text = text.replace("30...<ifJh5 31.M.g 1 I;lb5 32.<ifJd4", "30...Kh5 31.Rg1 Rb5 32.Kd4")
    text = text.replace("30...Kh5 31.Bg1 Rb5 32.Kd4", "30...Kh5 31.Rg1 Rb5 32.Kd4")
    text = text.replace("32...<ifJh6 33.Ke4Rg5", "32...Kh6 33.Ke4 Rg5")
    text = text.replace("34.Itf1 <iii;g 7", "34.Rf1 Kg7")
    text = text.replace("35.Kf5 Kf6", "35.Bf5 Kf6")
    text = text.replace("38.Kd7+ <ifJf6", "38.Kd7+ Kf6")
    text = text.replace("37.Rd1.:tg2", "37.Rd1 Rg2")
    text = text.replace("39.Itd6+ <JJe7", "39.Rd6+ Ke7")
    text = text.replace("40.M.e6+ <ifJf7 41.Ra6Re2+ 42.<ifJd5 <JJe7", "40.Be6+ Kf7 41.Ra6 Re2+ 42.Kd5 Ke7")
    text = text.replace("43.Ke4 Itd2+ 44.<ifJe5 Ite2", "43.Ke4 Rd2+ 44.Ke5 Re2")
    text = text.replace("12.45..:te6+ <ifJd 7 46JKr h 6 <ifJe7", "12. 45.Re6+ Kd7 46.Rh6 Ke7")
    text = text.replace("48..:ta7 Ite1 49.<ifJd5", "48.Ra7 Re1 49.Kd5")
    text = text.replace("50.Kf5 (5.O.Rb7 Ke8)", "50.Bf5 (50.Rb7 Ke8)")
    text = text.replace("50... Ite7 1.f2-1h", "50...Re7 1/2-1/2")
    text = text.replace("7.Kc5 Rb1 8.Rg4", "7.Bc5 Rb1 8.Rg4")
    text = text.replace(
        "3.Rf7 Rd1 4.Ra7 Rb1 5.Ra3 Rb3 6.Kd6 Rc3+ 7.Kc5 Rb3 8.Rc7+ Kb8 9.Rh7\nKa5 10.Ra7+",
        "3.Rf7 Rd1 4.Ra7 Rb1 5.Ba3 Rb3 6.Bd6 Rc3+ 7.Bc5 Rb3 8.Rc7+ Kb8 9.Rh7\nKa8 10.Ra7+",
    )
    text = text.replace(
        "10...Kb8 11.Ra4 Kc8\n12.Rb4+-",
        "10...Kb8 11.Ra4 Kc8\n12.Bb4+-",
    )
    text = text.replace(
        "17.Bd5 Rh6+ =.\n\n17.Ra8+ Kb6 18.Ra2 Rb1 reaching the second-rank defence",
        "17.Bd5 Rh6+=.\n\n11...Rf6+! 12.Be6 Rf1 13.Rg8+ Ka7! 14.Bd5 Rd1 15.Ra8+ Kb6 16.Rb8+ Ka7\n17.Ra8+ Kb6 18.Ra2 Rb1 reaching the second-rank defence",
    )
    text = text.replace(
        "The idea is... Kg2.2.Kf4:ig2 3.:ih7+ Kg4 4.Ke4",
        "The idea is...Rg2. 2.Kf4 Rg2 3.Rh7+ Kg4 4.Ke4",
    )
    text = text.replace("Rc5+ 7.Ke5 and White's set-up is lethal.", "Rc5+ 7.Be5 and White's set-up is lethal.")
    text = text.replace(
        "11...Kf1! (11...Kd1! =) 12.Rf3+\n\ntry.\n\nNow i t would b e wrong",
        "11...Kf1! (11...Kd1!=) 12.Rf3+\n12.Kf3 Rf2+!= is a well-known stalemate resource; White does not want to try.\n12...Ke2 13.Re3+ Kd2!\nNow it would be wrong",
    )
    text = text.replace("13...Kf1?? 14.Ke1+#", "13...Kf1?? 14.Re1+#")
    text = text.replace("14.Kf3?! Rg3+ =.", "14.Kf3?! Rxg3+=.")
    text = text.replace("26.Ka5 Ka2", "26.Ka5 Ra2")
    text = text.replace("4.Rb1 iLdS 5.Rg1+", "4.Rb1 Bd5 5.Rg1+")
    text = text.replace("(I.. Bg8?", "(1...Bg8?")
    text = text.replace("iLxf7", "Bxf7")
    text = text.replace("2.\\itf4", "2.Kf4")
    text = text.replace("4Ri:c7 Ba2!", "4.Rc7 Ba2!")
    text = text.replace("7JJ.a7\nIf7.f7 Kf7! =", "7.Ra7\nIf 7.f7 Bxf7!=")
    text = text.replace("7...Kc4=", "7...Bc4=")
    text = text.replace("1.Ra7 itd3", "1.Ra7 Bd3")
    text = text.replace("with1...Bb3?", "with 1...Bb3?")
    text = text.replace("3.l:f.g7+", "3.Rg7+")
    text = text.replace("5.l:f.c8+", "5.Rc8+")
    text = text.replace("3.Ka8+ Bg8", "3.Ra8+ Bg8")
    text = text.replace("5.h6.idS 6.Ka7+", "5.h6 Bd5 6.Ra7+")
    text = text.replace("7.l:f.e7!", "7.Re7!")
    text = text.replace("3.1Ia8+ Kf7", "3.Ra8+ Kf7")
    text = text.replace("view of3...Kh8 4.1Id7+-", "view of 3...Kh8 4.Rd7+-")
    text = text.replace("4...jlc2!", "4...Bc2!")
    text = text.replace("SRKg6", "5.Rg6")
    text = text.replace("3...Kf5!\nAgain, this move is easy to find in view of3...Kh8", "3...Kf8!\nAgain, this move is easy to find in view of 3...Kh8")
    text = text.replace("3...Kf5!\nAgain, this move is easy to find in view of 3...Kh8", "3...Kf8!\nAgain, this move is easy to find in view of 3...Kh8")
    text = text.replace("8.Kg5 ilxg6=.", "8.Kg5 Bxg6=.")
    text = text.replace(
        "1.Kh6 Kg8 2.Rg7+ Kf8 3.1Ig3 Kf7 4.Kh5 Kf6 (4...Bb1 s Jlgs Bc2 6.Kg4+-;\n"
        "4...Kf8 s. ligs ild l + 6.Kg6 Kg8 7.Rc5+-) 5.1Ig5 Bd1+ (5...il fs 6.Kh6 Bd3\n"
        "7.1Ig3 Be4 8.Re3 ildS 9.1Ie2 Kf7 10.Kh7+-) 6.Kh6 Kf7 7.!Ig7+ Kf8 (7...Kf6\n"
        "8.Kg1 Be2 9.:gg2 ild l 10.Rf2+ +-) 8.Kg6 Bh5+ 9.Kf6+-",
        "1.Kh6 Kg8 2.Rg7+ Kf8 3.Rg3 Kf7 4.Kh5 Kf6 (4...Bb1 5.Rg5 Bc2 6.Kg4+-;\n"
        "4...Kf8 5.Rg5 Bd1+ 6.Kg6 Kg8 7.Rc5+-) 5.Rg5 Bd1+ (5...Bf5 6.Kh6 Bd3\n"
        "7.Rg3 Be4 8.Re3 Bd5 9.Re2 Kf7 10.Kh7+-) 6.Kh6 Kf7 7.Rg7+ Kf8 (7...Kf6\n"
        "8.Rg1 Be2 9.Rg2 Bd1 10.Rf2++-) 8.Kg6 Bh5+ 9.Kf6+-",
    )
    text = text.replace("7...Kf6\n8.Kg1 Be2 9.Rg2", "7...Kf6\n8.Rg1 Be2 9.Rg2")
    text = text.replace("6.Qe8.tieS + 7.Kf4::t:fS +", "6.Qe8 Re5+ 7.Kf4 Rf5+")
    text = text.replace("8...JU5 9.Qd8+", "8...Rf5 9.Qd8+")
    text = text.replace(
        "Attacking the pawn and forcing the black king to hinder his own rook. 10.Kg3!\n"
        "wins faster thanks to zugzwang, but continuing the queen manoeuvre is more the matic.",
        "Attacking the pawn and forcing the black king to hinder his own rook. 10.Kg3!\n"
        "wins faster thanks to zugzwang, but continuing the queen manoeuvre is more thematic.\n"
        "10...Kd5 11.Qc7!",
    )
    text = text.replace(
        "11...Ke4\n\n13, only faster.\n12.Qd6!",
        "11...Ke4\n11...Re5 12.Qd7+ Ke4 13.Qd6 leads to the same position as the note to move 13, only faster.\n12.Qd6!",
    )
    text = text.replace(
        "12.Qd6!\nThe white queen exerts more pressure.\n\nThe position",
        "12.Qd6!\nThe white queen exerts more pressure.\n\n12...Re5\nThe position",
    )
    text = text.replace(
        "After 14.Kf5 Kd8 the simplest way would be 15.Kd5 Re7 16.Ra8+ Kc7",
        "After 14.Kf5 Kd8 the simplest way would be 15.Bd5 Re7 16.Ra8+ Kc7",
    )
    text = text.replace(
        "and the king leaves the edge of the board.\n\nIt is important to note",
        "and the king leaves the edge of the board.\n\n14...Kf8!\nIt is important to note",
    )
    text = text.replace(
        "13...Rg5+ 14.Kh4 Re5\n\n14.Kf3 Kd5 15.'ii'f8+",
        "13...Rg5+ 14.Kh4 Re5 15.Kg4!+- with total zugzwang.\n\n14.Kf3 Rd5 15.Qf8+",
    )
    text = text.replace(
        "Finally White succeeds in driving the king away from the pawn, so the black infant will be captured in a few moves.\n\npawn dies.",
        "Finally White succeeds in driving the king away from the pawn, so the black infant will be captured in a few moves.\n\n"
        "15...Kg6 (15...Ke5? 16.Qf4 mate) 16.Ke4 Rf5 17.Qe7 Rf6 18.Ke5+- and the\n"
        "pawn dies.",
    )
    text = text.replace(
        "1.Qh8+ Kd7 2.'ii'f8 Ke6+ 3.Kd5 Kd6+ 4.Kc5 Kf6",
        "1.Qh8+ Kd7 2.Qf8 Re6+ 3.Kd5 Rd6+ 4.Kc5 Rf6",
    )
    text = text.replace("were safe", "we're safe")
    text = text.replace("2.Kh6.Now", "2.Kh6. Now")
    text = text.replace("2...Bc4.B)", "2...Bc4. B)")
    text = text.replace("b l -h7", "b1-h7")
    text = text.replace("there is no way to due to stalemate resources", "there is no way to win due to stalemate resources")
    text = text.replace("+-\n2.Kh6", "+-\n\n2.Kh6")
    text = text.replace(
        "4...Rd2?! 5.Kb6 l:!.d6+? (5...l:!. b2+! is still a draw) 6.Kb7, threatening Qc8",
        "4...Rd2?! 5.Kb6 Rd6+? (5...Rb2+! is still a draw) 6.Kb7, threatening Qc8",
    )
    text = text.replace(
        "6...l:!. f6 7.'li'c8+\nKd6 8.'li'g4 l:!.f8 9.'li'd4+ Ke6 10.Kc7 l:!.f6 11.'li'c4+! \\tieS 12.Kd7+-",
        "6...Rf6 7.Qc8+\nKd6 8.Qg4 Rf8 9.Qd4+ Ke6 10.Kc7 Rf6 11.Qc4+! Ke5 12.Kd7+-",
    )
    text = text.replace("4.it'd6 Ka7", "4.Qd6 Ka7")
    text = text.replace("5.'ifcS + Ka8 6.it'd6 Ka7", "5.Qc5+ Ka8 6.Qd6 Ka7")
    text = text.replace("1.Ka7 2.Qf7+Rb7!", "1...Ka7 2.Qf7+ Rb7!")
    text = text.replace("9.Kc6.Rb8", "9.Kc6 Rb8")
    text = text.replace("1 I.Qd8+ Ka7", "11.Qd8+ Ka7")
    text = text.replace("Kas", "Ka8")
    text = text.replace("7.'i:VeS+ Ka7", "7.Qe8+ Ka7")
    text = text.replace("10.'i:VhS+ Ka7 11.'i:VdS", "10.Qh8+ Ka7 11.Qd8")
    text = text.replace("The only move - but enough.\n18.Kg4", "17...Rf2+!\nThe only move - but enough.\n18.Kg4")
    text = text.replace(
        "18.Ke4 would lead to a repetition.\n\nTransferring the rook",
        "18.Ke4 would lead to a repetition.\n\n18...Rc2\nTransferring the rook",
    )
    text = text.replace("18...Kd2=", "18...Rd2=")
    text = text.replace("not 18.Rg2? 19.Ra1 Ke2", "not 18...Rg2? 19.Ra1+ Ke2")
    text = re.sub(r"(?:17\.\.\.Rf2\+!\n){2,}", "17...Rf2+!\n", text)
    text = text.replace("and the\n+\n...\nrook is trapped.", "and the\nrook is trapped.")
    text = text.replace("23.Kd6 Kf1", "23.Bd6 Kf1")
    text = text.replace("24.Kb4 Rg2+ 25.Kh3 Rc2 26.Ka5 Ra2 27.Kb6?!", "24.Bb4 Rg2+ 25.Kh3 Rc2 26.Ba5 Ra2 27.Bb6?!")
    text = text.replace("27...Ra3+ 28.Kg4 Kg3+", "27...Ra3+ 28.Kg4 Rg3+")
    text = text.replace("1.'Rc7 Kd3!", "1.Rc7 Bd3!")
    text = text.replace("1...Kb3? loses easily: 2.h7 Kd5", "1...Bb3? loses easily: 2.h7 Bd5")
    text = text.replace("1...Kb3? loses easily: 2.h7 Bd5", "1...Bb3? loses easily: 2.h7 Bd5")
    text = text.replace("Or also 1...Kh7? 2.Rc8+ Kg8", "Or also 1...Bh7? 2.Rc8+ Bg8")
    text = text.replace("Kh7 4.Kd7+ Kh8", "Kh7 4.Rd7+ Kh8")
    text = text.replace("2.Kf6 Ke4 3.h7 Kh7=", "2.Kf6 Be4 3.h7 Bxh7=")
    text = text.replace("33.Ke4 33...Rg5", "33.Ke4 Rg5")
    text = text.replace("34.Rf1 34...Kg7 35.Bf5 35...Kf6 36.Ke4 36...Ke7 37.Rd1 37...Rg2 38.Kd7+ 38...Kf6 39.Rd6+ 39...Ke7", "34.Rf1 Kg7 35.Bf5 Kf6 36.Ke4 Ke7 37.Rd1 Rg2 38.Kd7+ Kf6 39.Rd6+ Ke7")
    text = text.replace("40.Be6+ 40...Kf7 41.Ra6 41...Re2+ 42.Kd5 42...Ke7", "40.Be6+ Kf7 41.Ra6 Re2+ 42.Kd5 Ke7")
    text = text.replace("43.Ke4 43...Rd2+ 44.Ke5 44...Re2", "43.Ke4 Rd2+ 44.Ke5 Re2")
    text = text.replace("45.Re6+ 45...Kd7 46.Rh6 46...Ke7 47.Rh7+ 47...Ke8 48.Ra7 48...Re1 49.Kd5", "45.Re6+ Kd7 46.Rh6 Ke7 47.Rh7+ Ke8 48.Ra7 Re1 49.Kd5")
    text = text.replace("...<J;;>d7 with jLd6", "...Kd7 with Bd6")
    text = text.replace("9.Nd6! <J;;>d7 10.Nb5", "9.Nd6! Kd7 10.Nb5")
    text = text.replace("threatening7.Bc6", "threatening 7.Bc6")
    text = text.replace("If7.f7", "If 7.f7")
    text = text.replace("view of3...Kh8", "view of 3...Kh8")
    text = text.replace("Kg8= White", "Kg8=. White")
    text = text.replace("aS -square....Ka7", "a5-square. 1...Ka7")
    text = text.replace("aS -square. 1...Ka7", "a5-square. 1...Ka7")
    text = text.replace("1.Kc4the", "1.Kc4 the")
    text = text.replace("3.Qc7\nKb7", "3.Qc7\nRb7")
    text = text.replace("triangle a8-b8-a7.5.Qe3+", "triangle a8-b8-a7. 8.Qe3+")
    text = text.replace(
        "2.Rh6 (2.Rh3 Rb7 3.Kb6?? Ra7+! =) 2.Rb7 3.Ab6.Ra7+ 4.Kb5 1:lf7 5.Kc6 Rf8 6.Ac7 Rg8 7.Ad6 1:le8 8.Rh1+-",
        "2.Rh6 (2.Rh3 Rb7 3.Bb6?? Ra7+!=) 2...Rb7 3.Bb6 Ra7+ 4.Kb5 Rf7 5.Kc6 Rf8 6.Bc7 Rg8 7.Bd6 Re8 8.Rh1+-",
    )
    return text


def normalize_square_rank(rank: str) -> str:
    if rank in {"l", "I", "i", "t"}:
        return "1"

    if rank == "S":
        return "5"

    if rank == "a":
        return "8"

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
    text = re.sub(r"\b(Section\s+\d+\.)\s*(?=[A-Z])", r"\1 ", text)
    text = re.sub(r"\b(Ending\s+\d+)\.(?=[A-Z])", r"\1. ", text)
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
    preserved_positions = [
        section
        for section in sections[1:first_ending_index]
        if section.get("type") == "position"
        and isinstance(section.get("content"), dict)
        and isinstance(section["content"].get("caption"), str)
    ]
    del sections[1:first_ending_index]
    intro_sections = split_structural_text("text", intro)
    intro_sections = restore_intro_positions(intro_sections, preserved_positions)
    sections[1:1] = intro_sections


def restore_intro_positions(
    intro_sections: list[dict[str, Any]],
    preserved_positions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not preserved_positions:
        return intro_sections

    positions_by_caption = {
        section["content"]["caption"]: section for section in preserved_positions
    }
    restored: list[dict[str, Any]] = []
    restored_captions: set[str] = set()

    for section in intro_sections:
        if section.get("type") == "caption" and section.get("content") in positions_by_caption:
            caption = section["content"]
            restored.append(positions_by_caption[caption])
            restored_captions.add(caption)
        else:
            restored.append(section)

    for caption, position in positions_by_caption.items():
        if caption not in restored_captions:
            restored.append(position)

    return restored


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
