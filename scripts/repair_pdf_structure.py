#!/usr/bin/env python3
"""Repair source-layout structure lost during chapter text extraction."""

from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "app/src/app_x/pdf"
PDF_PATH = PDF_DIR / "100-endgames-you-must-know-2008.pdf"
REPORT_PATH = PDF_DIR / "pdf_structure_audit.json"

CHAPTER_PRINTED_PAGE_RANGES = {
    "1": range(27, 45),
    "3": range(51, 59),
    "4": range(59, 68),
    "5": range(68, 83),
    "6": range(83, 89),
    "7": range(89, 96),
    "8": range(96, 105),
    "9": range(104, 123),
    "10": range(123, 153),
    "11": range(153, 169),
    "12": range(169, 204),
    "13": range(204, 229),
}

# Printed page and top coordinate of each ending banner, measured from the
# source PDF. The banner text is artwork rather than selectable text, so these
# coordinates provide the missing structural anchors for source-order repair.
ENDING_BOUNDARIES = {
    str(number): boundary
    for number, boundary in enumerate(
        [
            (27, 413.3), (29, 411.8), (33, 310.3), (37, 310.3),
            (38, 447.1), (39, 344.2), (40, 293.0), (41, 154.8),
            (42, 472.3), (51, 412.6), (53, 239.0), (54, 292.3),
            (55, 357.1), (57, 600.5), (58, 420.5), (59, 342.7),
            (60, 531.4), (62, 377.3), (65, 428.4), (67, 51.8),
            (68, 355.0), (69, 652.3), (71, 137.5), (74, 51.1),
            (76, 360.0), (77, 556.6), (79, 291.6), (80, 51.1),
            (82, 51.1), (83, 360.7), (84, 360.0), (85, 652.3),
            (89, 501.1), (90, 463.0), (91, 360.0), (93, 344.9),
            (96, 414.0), (98, 465.1), (101, 481.0), (103, 53.3),
            (105, 51.1), (106, 703.4), (109, 463.0), (111, 318.2),
            (112, 51.1), (113, 120.2), (114, 51.8), (117, 51.1),
            (118, 151.2), (119, 59.8), (120, 506.2), (124, 257.8),
            (125, 566.6), (127, 546.5), (128, 525.6), (129, 298.1),
            (132, 278.6), (134, 277.9), (136, 532.1), (138, 637.9),
            (140, 43.2), (141, 549.4), (143, 568.8), (144, 429.1),
            (145, 624.2), (146, 480.2), (150, 290.2), (152, 53.3),
            (153, 484.6), (155, 189.4), (157, 51.8), (158, 51.1),
            (160, 668.9), (165, 86.4), (167, 87.1), (168, 85.7),
            (169, 550.8), (170, 635.8), (172, 394.6), (174, 223.2),
            (177, 51.8), (177, 651.6), (181, 480.2), (184, 669.6),
            (187, 218.2), (188, 41.8), (190, 139.0), (196, 353.5),
            (198, 325.4), (200, 275.0), (201, 51.8), (202, 343.4),
            (204, 141.8), (209, 223.2), (213, 671.0), (217, 51.8),
            (219, 566.6), (221, 182.2), (224, 51.1), (227, 190.1),
        ],
        start=1,
    )
}


@dataclass(frozen=True)
class PanelSpec:
    chapter: str
    page: int
    start: str
    end: str
    title: str | None = None
    replacement_text: str | None = None


PANEL_SPECS = [
    PanelSpec("1", 29, "Rule of the square:", "the pawn promotes.", "Rule of the square"),
    PanelSpec(
        "1",
        31,
        "In a King + Pawn vs. King ending, king opposition is decisive",
        "the pawn is on the 6th rank.",
    ),
    PanelSpec(
        "1",
        34,
        "If the strong king occupies one of the key squares",
        "marked in the diagram).",
    ),
    PanelSpec(
        "1",
        36,
        "If the pawn has not reached the 5th rank",
        "two ranks ahead.",
    ),
    PanelSpec(
        "1",
        38,
        "Conclusion: With a rook's pawn",
        "it is a draw.",
        "Conclusion",
    ),
    PanelSpec(
        "1",
        40,
        "Conclusion: In order to draw against a rook's pawn",
        "the c1- and c2-squares.",
        "Conclusion",
    ),
    PanelSpec(
        "1",
        44,
        "Conclusion: In the battle Knight vs. Rook",
        "the g2-square).",
        "Conclusion",
    ),
    PanelSpec(
        "4",
        61,
        "Conclusion: The queen wins against an ordinary pawn",
        "she can check the enemy king.",
        "Conclusion",
    ),
    PanelSpec(
        "4",
        64,
        "Conclusion: Just like in the positions against the rook's pawn",
        "7th-rank bishop's pawn.",
        "Conclusion",
    ),
    PanelSpec(
        "5",
        80,
        "Conclusion: If the defender's king can be forced",
        "dramatically decreased.",
        "Conclusion",
    ),
    PanelSpec(
        "11",
        157,
        "Conclusion of the first scenario. Doubled pawns:",
        "Against rook's pawns, defence is quite easy.",
        "Conclusion of the first scenario. Doubled pawns",
    ),
    PanelSpec(
        "11",
        160,
        "Conclusion: The bishop's pawn must not reach",
        "the rook's pawn has done so.",
        "Conclusion",
    ),
    PanelSpec(
        "11",
        161,
        "Conclusion: When the defending king is cut off",
        "the best winning asset.",
        "Conclusion",
    ),
    PanelSpec(
        "11",
        165,
        "1) The king should avoid being trapped on the back rank",
        "the defending king must get in front of it.",
        replacement_text=(
            "1) The king should avoid being trapped on the back rank, as this usually leads to a losing position.\n"
            "2) The rook is well placed on the 5th rank to hinder the white king's advance, but usually the best policy is to keep the rook in the corner, ready to deliver side and rear checks.\n"
            "3) The king must wait on g7 or, if checked along the g-file, the best place for him is the f-file if all other circumstances are equal.\n"
            "4) When a pawn reaches the 6th rank, the defending king must get in front of it."
        ),
    ),
    PanelSpec(
        "12",
        188,
        "Conclusion: The stronger side always wins",
        "rook's pawn is on the 2nd rank.",
        "Conclusion",
    ),
    PanelSpec(
        "12",
        200,
        "Conclusion: A king can defend a pawn",
        "only in favourable circumstances.",
        "Conclusion",
    ),
    PanelSpec(
        "13",
        222,
        "Conclusion: A rook and a 6th-rank rook's or bishop's pawn",
        "move the king ahead of the pawn.",
        "Conclusion",
    ),
    PanelSpec(
        "13",
        228,
        "1) With any pawn on the second rank",
        "The remaining cases are lost.",
    ),
]


SUBTITLES: dict[str, dict[str, tuple[str, str]]] = {
    "1": {
        "1.7": ("Losing the opposition", "Losing the opposition"),
        "1.8": ("Knight's pawn", "Knight's pawn"),
        "1.10": ("Knight's pawn", "Knight's pawn"),
        "1.11": (
            "Key squares when the pawn has not reached the 5th rank",
            "Key squares when the pawn has not reached the 5th rank",
        ),
        "1.12": ("The distant opposition", "The distant opposition"),
        "1.13": ("Using reserve moves", "Using reserve moves"),
        "1.15": ("Quantity is not quality", "Quantity is not quality"),
    },
    "4": {
        "4.1": ("The winning procedure", "The winning procedure"),
        "4.2": ("When the strong king is an obstacle", "When the strong king is an obstacle"),
        "4.3": ("Stalemate themes", "Stalemate themes"),
        "4.8": ("King on the wrong side", "King on the wrong side"),
        "4.9": ("Checkmate on d7", "Checkmate on d7"),
        "4.12": ("The same trick, on the other side", "The same trick, on the other side"),
    },
    "6": {"6.6": ("The series of checks", "The series of checks")},
    "7": {"7.6": ("Revision of some assorted themes", "Revision of some assorted themes")},
    "8": {
        "8.5": ("When the defending king is further away", "When the defending king is further away"),
        "8.7a": ("Zugzwang, stalemate or perpetual check", "Zugzwang, stalemate or perpetual check"),
    },
    "9": {
        "9.2": ("The bishop in front of the pawns", "The bishop in front of the pawns"),
        "9.3": ("Rook and knight's pawns", "Rook and knight's pawns"),
        "9.4": ("The winning procedure", "The winning procedure"),
        "9.12": ("The defending bishop has control over the promotion square", "The defending bishop has control over the promotion square"),
        "9.15": ("The attacking bishop has control over the promotion square", "The attacking bishop has control over the promotion square"),
        "9.17": ("Outflanking on the edge", "Outflanking on the edge"),
    },
    "10": {
        "10.17": ("Knight's pawn", "Knight's pawn"),
        "10.18": ("Bishop's pawn", "Bishop's pawn"),
    },
    "11": {
        "11.1": ("First scenario", "First scenario"),
        "11.9": (
            "An i m portant variation. Pushing the rook's pawn",
            "An important variation. Pushing the rook's pawn",
        ),
        "11.11": ("Central connected pawns", "Central connected pawns"),
    },
    "12": {
        "12.2": ("M utual defence", "Mutual defence"),
        "12.10": ("G iving up the pawn to cha nge key squa res", "Giving up the pawn to change key squares"),
        "12.12": ("Reti's study", "Reti's study"),
        "12.16": ("Blocked pawns not on the 5th rank yet", "Blocked pawns not on the 5th rank yet"),
        "12.19": ("Blocked pawn on the 6th rank", "Blocked pawn on the 6th rank"),
        "12.20": ("Blocked pawn on the 5th rank", "Blocked pawn on the 5th rank"),
        "12.22": ("Blocked pawn on the 4th rank", "Blocked pawn on the 4th rank"),
        "12.36": ("The defending pawn is two files out of the square", "The defending pawn is two files out of the square"),
        "12.37": ("Protected passed pawn on the 6th rank", "Protected passed pawn on the 6th rank"),
        "12.42": ("Preparing a breakthrough. An innocent couple of pawns", "Preparing a breakthrough. An innocent couple of pawns"),
    },
    "13": {
        "13.7": ("Philidor Position", "Philidor Position"),
        "13.8": ("Same position shifted one file to the left (Lolli)", "Same position shifted one file to the left (Lolli)"),
        "13.9": ("Same position, knight's file (Lolli)", "Same position, knight's file (Lolli)"),
        "13.11": ("Same position, rook's file", "Same position, rook's file"),
        "13.21": ("Pawn on the 6th rank", "Pawn on the 6th rank"),
        "13.22": ("Pawn on the 5th rank", "Pawn on the 5th rank"),
        "13.24": ("Pawn on the 4th rank", "Pawn on the 4th rank"),
        "13.25": ("The win n i ng manoeuvre", "The winning manoeuvre"),
    },
}


STANDALONE_HEADINGS: dict[str, list[tuple[str, str]]] = {
    "1": [
        ("Blocking the way and supporting the pawn with the king", "Blocking the way and supporting the pawn with the king"),
        ("Opposition", "Opposition"),
        ("Both endings mixed in a recent game", "Both endings mixed in a recent game"),
    ],
    "3": [
        ("Lateral control", "Lateral control"),
        ("The barrier", "The barrier"),
        ("Exceptional positions", "Exceptional positions"),
    ],
    "4": [
        ("The strong king is near", "The strong king is near"),
        ("The winning zone for the king. Defending king on the right side", "The winning zone for the king. Defending king on the right side"),
    ],
    "8": [
        ("Section 1. Knight + Pawn vs. Bishop", "Section 1. Knight + Pawn vs. Bishop"),
        ("Section 2. Bishop + Pawn vs. Knight", "Section 2. Bishop + Pawn vs. Knight"),
        ("First scenario:", "First scenario"),
        ("Second scenario:", "Second scenario"),
        ("Third scenario:", "Third scenario"),
    ],
    "9": [
        ("Section 1. Connected pawns", "Section 1. Connected pawns"),
        ("Section 2. Separated pawns. The three drawing scenarios", "Section 2. Separated pawns. The three drawing scenarios"),
        ("Section 3. Pawns separated by two files", "Section 3. Pawns separated by two files"),
        ("Section 4. Pawns separated by three files", "Section 4. Pawns separated by three files"),
    ],
    "10": [
        ("Practical aspects", "Practical aspects"),
        ("Technical aspects", "Technical aspects"),
        ("Section 1. Basic endings", "Section 1. Basic endings"),
        ("Section 2. Pawn on 5th rank or less", "Section 2. Pawn on 5th rank or less"),
        ("Section 3. C utti ng off the king along files", "Section 3. Cutting off the king along files"),
        ("Section 4. C utt i ng off the king along ranks", "Section 4. Cutting off the king along ranks"),
        ("Section 5. The rook's pawn", "Section 5. The rook's pawn"),
        ("DT: Distant (rear) checks, cut-off king", "DT: Distant rear checks, cut-off king"),
        ("DT: Distant (rear) checks", "DT: Distant rear checks"),
        ("DT: Distant (side) checks", "DT: Distant side checks"),
        ("DT: Side checks", "DT: Side checks"),
        ("DT: Rook in the rear of the pawn. Side checks", "DT: Rook in the rear of the pawn. Side checks"),
        ("DT: Attacking king trapped, distant checks", "DT: Attacking king trapped, distant checks"),
        ("DT: Frontal checks, rook swap", "DT: Frontal checks, rook swap"),
        ("DT: Frontal checks", "DT: Frontal checks"),
        ("DT: Rear checks. Rook in the rear of the pawn", "DT: Rear checks. Rook in the rear of the pawn"),
        ("Summary of Section", "Summary of section"),
        ("Summary of the ideas in this ending for the strong side", "Summary of the ideas in this ending for the strong side"),
        ("Some ideas about cutting off", "Some ideas about cutting off"),
        ("Summary: cutting the king off a long a rank", "Summary: cutting the king off along a rank"),
    ],
    "11": [
        ("Second-rank defence", "Second-rank defence"),
        ("Second scenario", "Second scenario"),
        ("Series about rook and bishop's pawns.", "Series about rook and bishop's pawns"),
        ("Defending king cut off on the back rank; bishop's pawn on the 6th rank.", "Defending king cut off on the back rank; bishop's pawn on the 6th rank"),
        ("Bishop's pawn on the 5th rank.", "Bishop's pawn on the 5th rank"),
        ("Bishop's pawn on the 4th rank.", "Bishop's pawn on the 4th rank"),
        ("Th ird scenario", "Third scenario"),
        ("Another example of central pawns", "Another example of central pawns"),
        ("Fou rth scenario", "Fourth scenario"),
        ("Fifth scenario", "Fifth scenario"),
    ],
    "12": [
        ("Section 1. King + 2 pawns vs. King", "Section 1. King + 2 pawns vs. King"),
        ("Section 2. King + Pawn vs. King + Pawn", "Section 2. King + Pawn vs. King + Pawn"),
        ("Section 3. Two pawns vs. one", "Section 3. Two pawns vs. one"),
        ("Section 4. Multi-pawn endgames. Some themes in pawn endings", "Section 4. Multi-pawn endgames. Some themes in pawn endings"),
        ("Delaying the capture", "Delaying the capture"),
        ("Reservi ng squares to attack", "Reserving squares to attack"),
        ("With more pawns on the board", "With more pawns on the board"),
        ("Manoeuvres previous to the capture of the pawn. The king's multiple routes", "Manoeuvres previous to the capture of the pawn. The king's multiple routes"),
        ("Drawing the king to a certain square", "Drawing the king to a certain square"),
        ("Drawing lines", "Drawing lines"),
        ("All pawns are on the 2nd rank", "All pawns are on the 2nd rank"),
        ("Same position, Wh ite to move", "Same position, White to move"),
        ("A pawn is a l ready advanced", "A pawn is already advanced"),
        ("An important d efensive position", "An important defensive position"),
        ("The floating square", "The floating square"),
        ("Pawns separated by three files", "Pawns separated by three files"),
        ("Pawns separated by one file", "Pawns separated by one file"),
        ("Crippled majority", "Crippled majority"),
        ("Pawn majority on one wing, doubled pawn on the other", "Pawn majority on one wing, doubled pawn on the other"),
    ],
    "13": [
        ("Rook + Bishop vs. Rook", "Rook + Bishop vs. Rook"),
        ("The defensive set-up", "The defensive set-up"),
    ],
}


CHAPTER_SPILLOVERS = {
    "10": "In rook endings, there are many positions where two pawns are not enough to win.",
    "11": "After many chapters, we come back to pawn endings.",
    "12": "This is the last chapter on endgame theory",
}


TEXT_REPAIRS = (
    ("it is the worth observing", "it is worth observing"),
    (
        "get the opposi-\n\n8. Kf6 stalemate",
        "get the opposition now that the enemy king must retreat from that file) "
        "6... Ke8! 7.f7+ Kf8\n8. Kf6 stalemate",
    ),
    ("re markable", "remarkable"),
    ("remem ber", "remember"),
    ("ex tremely", "extremely"),
    ("pre venting", "preventing"),
    ("pawn ifit advances", "pawn if it advances"),
    ("Kffectiveness", "effectiveness"),
    ("Po sition", "Position"),
    ("king i s ready", "king is ready"),
    ("varia tions", "variations"),
    ("Per fect", "Perfect"),
    ("appli cation", "application"),
    ("to wards", "towards"),
    ("pre vent", "prevent"),
    ("ad vanced", "advanced"),
    ("j ourney", "journey"),
    ("cor rectly", "correctly"),
    ("Rook End ings", "Rook Endings"),
    ("suc cessfully", "successfully"),
    ("as sume", "assume"),
    ("trans ferred", "transferred"),
    ("se quence", "sequence"),
    ("and2)", "and 2)"),
    ("mul tiple", "multiple"),
    ("en emy", "enemy"),
    ("stron ger", "stronger"),
    ("oppo sition", "opposition"),
    ("con sisting", "consisting"),
    ("resis tance", "resistance"),
    ("orig inal", "original"),
    ("bat tlefield", "battlefield"),
    ("maj or ity", "majority"),
    ("behindered", "be hindered"),
    ("re sistance", "resistance"),
    ("com ments", "comments"),
    ("po sition", "position"),
    ("or der", "order"),
    ("front o f the", "front of the"),
    ("enough t o draw", "enough to draw"),
    ("aware o f a", "aware of a"),
    ("defence i s", "defence is"),
    ("theory i s", "theory is"),
    ("pawn i s on", "pawn is on"),
    ("has t o keep", "has to keep"),
    ("i t i s easy", "it is easy"),
    ("Same procedure5ame procedure", "Same procedure Same procedure"),
    (
        "S ary of the ideas in this ending for the strong side:\numm",
        "Summary of the ideas in this ending for the strong side",
    ),
    ("the5teinitz Rule", "the Steinitz Rule"),
    ("to fmd out", "to find out"),
    ("all many amateurs", "many amateurs"),
    ("practical play Some masters", "practical play. Some masters"),
    ("looks like very close", "looks very close"),
    ("black king off2)", "black king off.\n2)"),
    ("a5afe Corner", "a Safe Corner"),
    ("the5afe Corner", "the Safe Corner"),
    ("from c7 or b6.6)", "from c7 or b6.\n6)"),
    ("or b8.7)", "or b8.\n7)"),
    ("Position 13.3.9)", "Position 13.3.\n9)"),
    ("after reaching the . Moreover", "after reaching the Philidor Position. Moreover"),
    ("a5panish Team Championship", "a Spanish Team Championship"),
    ("123 7 games", "1237 games"),
    ("among123 7 games", "among 1237 games"),
    ("260 0+ players", "2600+ players"),
    ("19 24", "1924"),
    ("195 0", "1950"),
    ("199 2", "1992"),
    ("b7.Only", "b7. Only"),
    ("h3.Of course", "h3. Of course"),
    ("c5.Otherwise", "c5. Otherwise"),
    ("Kd8.It is", "Kd8. It is"),
    ("h7.Then", "h7. Then"),
    ("Rb6.Now", "Rb6. Now"),
    ("Rc3.Now", "Rc3. Now"),
    ("8.Kc5.The", "8.Kc5. The"),
    ("players solve it correctly. what is", "players solve it correctly. What is"),
    ("black sheep of checkmates", "black sheep of all checkmates"),
    ("10) Arrange the checkmate", "10) We arrange the checkmate"),
    ("Ending7 arises", "Ending 7 arises"),
    ("the all aim is to find out", "the aim is to find out"),
    ("1..tia8 2..tic5..", "1...Ra8 2.Rc5"),
    ("12.l'la1!", "12.Ra1!"),
    ("3. Kg7Qe7+", "3. Kg7 Qe7+"),
    ("Qh7mate", "Qh7 mate"),
    ("3. Ke7Qe4+", "3. Ke7 Qe4+"),
    ("c8 or d7the bishop", "c8 or d7 the bishop"),
    ("Too n1any checks", "Too many checks"),
    ("2.Kd5Rd5+", "2.Kd5 Rd5+"),
    ("7.b8Qf1=Q+", "7.b8Q f1=Q+"),
    ("14.Kf5 Kd8the simplest", "14.Kf5 Kd8 the simplest"),
    ("case of6...Rg1", "case of 6...Rg1"),
    ("from more complex ending.", "from more complex endings."),
    (
        "2. Ne5! The.\n\n1... Kg3",
        "2.Ne5! The point! Now the pawn cannot advance and the knight reaches "
        "g4: 2...Kf1 3.Ng4!=; 1...Kg3",
    ),
    ("makes it to h2..", "makes it to h2."),
    ("3. Kg7 Qe7+..", "3. Kg7 Qe7+."),
    ("a step away from the.\nkey square", "a step away from the key square"),
    ("two key squares: (here or g6).\nf7", "two key squares (here f7 or g6)."),
    ("from the e7- square", "from the e7-square"),
    ("\nwe already know that an attack", "\nWe already know that an attack"),
    ("drawing a Then the route will de\npend", "drawing a V. Then the route will depend"),
    ("Kg8.By the way", "Kg8. By the way"),
    ("from a 7\nor b8", "from a7 or b8"),
)


def main() -> None:
    manifest = json.loads((PDF_DIR.parent / "chapterManifest.json").read_text())
    chapters: dict[str, list[dict[str, Any]]] = {}

    for entry in manifest:
        chapter_id = entry["id"]
        path = PDF_DIR / f"chapter_{chapter_id}.json"
        chapters[chapter_id] = json.loads(path.read_text())

    trim_chapter_spillovers(chapters)
    restore_required_ending_boundaries(chapters)
    recover_panels(chapters)
    apply_subtitles(chapters)
    repair_english_extraction(chapters)
    repair_partial_heading_splits(chapters)
    apply_standalone_headings(chapters)
    reclassify_panel_tails(chapters)
    convert_heading_captions(chapters)
    remove_redundant_position_captions(chapters)
    repair_position_1_9_markers(chapters["1"])
    trim_chapter_14_exercises(chapters["13"])
    remove_text_fragment(chapters["13"], "13.Other material relations")
    ending_boundaries = restore_source_ending_order(chapters)
    normalize_prose_sections(chapters)

    for chapter_id, sections in chapters.items():
        path = PDF_DIR / f"chapter_{chapter_id}.json"
        path.write_text(json.dumps(sections, indent=2, ensure_ascii=False) + "\n")

    write_report(chapters, ending_boundaries)


def restore_source_ending_order(
    chapters: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    audit: list[dict[str, Any]] = []

    with pdfplumber.open(PDF_PATH) as pdf:
        for chapter_id, sections in chapters.items():
            source_tokens = extract_source_tokens(
                pdf,
                CHAPTER_PRINTED_PAGE_RANGES[chapter_id],
            )
            json_tokens = extract_json_tokens(sections)
            matcher = SequenceMatcher(
                None,
                [token[0] for token in source_tokens],
                [token[0] for token in json_tokens],
                autojunk=False,
            )
            if matcher.ratio() < 0.55:
                raise ValueError(
                    f"Chapter {chapter_id} source alignment is too weak: "
                    f"{matcher.ratio():.3f}"
                )

            source_to_json: dict[int, int] = {}
            for source_start, json_start, size in matcher.get_matching_blocks():
                for offset in range(size):
                    source_to_json[source_start + offset] = json_start + offset

            events: dict[int, list[tuple[int, dict[str, Any]]]] = {}
            for ending in (
                section for section in sections if section.get("type") == "ending"
            ):
                ending_number = ending["content"]["number"]
                printed_page, banner_top = ENDING_BOUNDARIES[ending_number]
                source_index = next(
                    index
                    for index, (_, page, top) in enumerate(source_tokens)
                    if (
                        page > printed_page
                        or (page == printed_page and top > banner_top + 38)
                    )
                    and index in source_to_json
                )
                json_index = source_to_json[source_index]
                _, section_index, character_offset = json_tokens[json_index]
                target = sections[section_index]
                events.setdefault(id(target), []).append((character_offset, ending))
                audit.append(
                    {
                        "chapter": chapter_id,
                        "ending": ending_number,
                        "page": printed_page,
                        "targetStartsWith": section_text(target)[character_offset:][
                            :80
                        ],
                        "targetType": (
                            "text" if target["type"] == "moves" else target["type"]
                        ),
                    }
                )

            rebuilt: list[dict[str, Any]] = []
            for section in sections:
                if section.get("type") == "ending":
                    continue

                section_events = sorted(events.get(id(section), []))
                if not section_events:
                    rebuilt.append(section)
                    continue

                text = section_text(section)
                cursor = 0
                for character_offset, ending in section_events:
                    before = text[cursor:character_offset].strip()
                    if before:
                        rebuilt.append(with_section_text(section, before))
                    rebuilt.append(ending)
                    cursor = character_offset

                after = text[cursor:].strip()
                if after:
                    rebuilt.append(with_section_text(section, after))
                elif section.get("type") == "position":
                    rebuilt.append(section)

            chapters[chapter_id] = rebuilt

    if len(audit) != 100:
        raise ValueError(f"Expected 100 source ending boundaries, found {len(audit)}")

    return sorted(audit, key=lambda item: int(item["ending"]))


def extract_source_tokens(
    pdf: pdfplumber.PDF,
    printed_pages: range,
) -> list[tuple[str, int, float]]:
    tokens: list[tuple[str, int, float]] = []
    for printed_page in printed_pages:
        for line in pdf.pages[printed_page].extract_text_lines(
            layout=False,
            strip=True,
        ):
            tokens.extend(
                (match.group().lower(), printed_page, line["top"])
                for match in re.finditer(r"[A-Za-z]+|\d+", line["text"])
            )
    return tokens


def extract_json_tokens(
    sections: list[dict[str, Any]],
) -> list[tuple[str, int, int]]:
    tokens: list[tuple[str, int, int]] = []
    for section_index, section in enumerate(sections):
        if section.get("type") in {"ending", "title"}:
            continue
        text = section_text(section)
        tokens.extend(
            (match.group().lower(), section_index, match.start())
            for match in re.finditer(r"[A-Za-z]+|\d+", text)
        )
    return tokens


def section_text(section: dict[str, Any]) -> str:
    content = section.get("content")
    if section.get("type") == "position" and isinstance(content, dict):
        return f"Position {content['number']}"
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        return " ".join(
            str(content[key]) for key in ("title", "text") if content.get(key)
        )
    return ""


def with_section_text(
    section: dict[str, Any],
    text: str,
) -> dict[str, Any]:
    if section.get("type") == "position":
        return section
    return with_string_content(section, text)


def normalize_prose_sections(
    chapters: dict[str, list[dict[str, Any]]],
) -> None:
    for sections in chapters.values():
        for section in sections:
            if section.get("type") == "moves":
                section["type"] = "text"


def trim_chapter_spillovers(chapters: dict[str, list[dict[str, Any]]]) -> None:
    for chapter_id, marker in CHAPTER_SPILLOVERS.items():
        sections = chapters[chapter_id]
        for index, section in enumerate(sections):
            text = string_content(section)
            if marker not in text:
                continue
            before = text.split(marker, 1)[0].rstrip()
            sections[index:] = [with_string_content(section, before)] if before else []
            break


def repair_english_extraction(
    chapters: dict[str, list[dict[str, Any]]],
) -> None:
    for sections in chapters.values():
        for section in sections:
            content = section.get("content")
            if isinstance(content, str):
                section["content"] = repair_text(content)
                continue
            if not isinstance(content, dict):
                continue
            for key, value in content.items():
                if key in {"fen", "number"} or not isinstance(value, str):
                    continue
                content[key] = repair_text(value)


def repair_text(text: str) -> str:
    for before, after in TEXT_REPAIRS:
        text = text.replace(before, after)
    text = re.sub(r"\b([a-h][1-8])\s+-square\b", r"\1-square", text)
    text = re.sub(r"\b([a-h][1-8])-\s+square\b", r"\1-square", text)
    text = re.sub(r"\b([a-h])\s+-file\b", r"\1-file", text)
    text = re.sub(r"\b(\d+(?:st|nd|rd|th))\s+-rank\b", r"\1-rank", text)
    artifact_lines = {
        ".", "..", "...", "..•", "O", "o", "W", "+", "+-", "V.",
        "M", "L n", "(", "•• •••", "=,",
    }
    text = "\n".join(
        line for line in text.splitlines() if line.strip() not in artifact_lines
    )
    return text


def restore_required_ending_boundaries(
    chapters: dict[str, list[dict[str, Any]]]
) -> None:
    sections = chapters["9"]
    if any(
        section.get("type") == "ending"
        and section.get("content", {}).get("number") == "46"
        for section in sections
    ):
        return

    position_index = next(
        index
        for index, section in enumerate(sections)
        if section.get("type") == "position"
        and section.get("content", {}).get("number") == "9.11"
    )
    sections.insert(
        position_index,
        {"type": "ending", "content": {"number": "46", "text": "The winning procedure"}},
    )


def recover_panels(chapters: dict[str, list[dict[str, Any]]]) -> None:
    for spec in PANEL_SPECS:
        sections = chapters[spec.chapter]
        expected_start = " ".join(normalize(spec.start).split()[:5])
        expected_end = " ".join(normalize(spec.end).split()[-4:])
        if any(
            section.get("type") == "panel"
            and normalize(panel_search_text(section)).startswith(expected_start)
            and normalize(panel_search_text(section)).endswith(expected_end)
            for section in sections
        ):
            continue

        for index, section in enumerate(sections):
            text = string_content(section)
            start = text.find(spec.start)
            if start < 0:
                continue
            end_start = text.find(spec.end, start)
            if end_start < 0:
                raise ValueError(f"Panel end not found: chapter {spec.chapter}, page {spec.page}")
            end = end_start + len(spec.end)
            panel_text = text[start:end].strip()
            if spec.title and panel_text.startswith(f"{spec.title}:"):
                panel_text = panel_text[len(spec.title) + 1 :].strip()
            if spec.replacement_text:
                panel_text = spec.replacement_text

            replacement: list[dict[str, Any]] = []
            before = text[:start].strip()
            after = text[end:].strip()
            if before:
                replacement.append(with_string_content(section, before))
            content: dict[str, str] = {"text": panel_text}
            if spec.title:
                content["title"] = spec.title
            replacement.append({"type": "panel", "content": content})
            if after:
                replacement.append(with_string_content(section, after))
            sections[index : index + 1] = replacement
            break
        else:
            raise ValueError(f"Panel start not found: chapter {spec.chapter}, page {spec.page}")


def apply_subtitles(chapters: dict[str, list[dict[str, Any]]]) -> None:
    for chapter_id, subtitles in SUBTITLES.items():
        sections = chapters[chapter_id]
        for position_number, (source, subtitle) in subtitles.items():
            position = next(
                section
                for section in sections
                if section.get("type") == "position"
                and section["content"]["number"] == position_number
            )
            position["content"]["subtitle"] = subtitle
            remove_text_fragment(sections, source)


def apply_standalone_headings(chapters: dict[str, list[dict[str, Any]]]) -> None:
    for chapter_id, headings in STANDALONE_HEADINGS.items():
        sections = chapters[chapter_id]
        for source, heading in sorted(headings, key=lambda item: len(item[0]), reverse=True):
            if any(
                section.get("type") == "heading" and section.get("content") == heading
                for section in sections
            ):
                continue
            split_fragment_as_heading(sections, source, heading)


def repair_partial_heading_splits(
    chapters: dict[str, list[dict[str, Any]]]
) -> None:
    sections = chapters["10"]
    for index in range(len(sections) - 1):
        if (
            sections[index] == {"type": "heading", "content": "DT: Frontal checks"}
            and sections[index + 1] == {"type": "heading", "content": ", rook swap"}
        ):
            sections[index : index + 2] = [
                {"type": "heading", "content": "DT: Frontal checks, rook swap"}
            ]
            return


def reclassify_panel_tails(chapters: dict[str, list[dict[str, Any]]]) -> None:
    chapter_ten = chapters["10"]
    prose_starts = (
        "In our first example, we saw the most frequent procedure to draw",
        "There are two ways of cutting off the king",
    )
    for index, section in enumerate(chapter_ten):
        if section.get("type") != "panel":
            continue
        text = string_content(section)
        if text.startswith(prose_starts):
            chapter_ten[index] = {"type": "text", "content": text}


def convert_heading_captions(chapters: dict[str, list[dict[str, Any]]]) -> None:
    for sections in chapters.values():
        for section in sections:
            if section.get("type") != "caption" or not isinstance(section.get("content"), str):
                continue
            if re.match(r"^(?:Position|Analysis diagram)\s+\d+\.", section["content"]):
                continue
            section["type"] = "heading"


def remove_redundant_position_captions(
    chapters: dict[str, list[dict[str, Any]]]
) -> None:
    for sections in chapters.values():
        for section in sections:
            if section.get("type") != "position":
                continue
            content = section["content"]
            caption = content.get("caption")
            if isinstance(caption, str) and normalize(caption) == normalize(
                f"Position {content['number']}"
            ):
                del content["caption"]


def repair_position_1_9_markers(sections: list[dict[str, Any]]) -> None:
    position = next(
        section
        for section in sections
        if section.get("type") == "position" and section["content"]["number"] == "1.9"
    )
    position["content"]["markers"] = [
        {"square": square, "symbol": "*", "meaning": "key square"}
        for square in ("e6", "f6", "g6")
    ]


def trim_chapter_14_exercises(sections: list[dict[str, Any]]) -> None:
    marker = "14.01 White to move."
    for section in sections:
        if section.get("type") != "panel":
            continue
        text = string_content(section)
        if marker in text:
            section["content"]["text"] = text.split(marker, 1)[0].rstrip()


def remove_text_fragment(sections: list[dict[str, Any]], fragment: str) -> None:
    for index in range(len(sections) - 1, -1, -1):
        section = sections[index]
        if section.get("type") not in {"caption", "heading", "moves", "text"}:
            continue
        text = string_content(section)
        position = text.rfind(fragment)
        if position < 0:
            continue
        new_text = (text[:position] + text[position + len(fragment) :]).strip()
        if new_text:
            sections[index] = with_string_content(section, new_text)
        else:
            sections.pop(index)
        return


def split_fragment_as_heading(
    sections: list[dict[str, Any]], fragment: str, heading: str
) -> None:
    for index, section in enumerate(sections):
        if section.get("type") not in {"caption", "moves", "text"}:
            continue
        text = string_content(section)
        position = text.find(fragment)
        if position < 0:
            continue
        replacement: list[dict[str, Any]] = []
        before = text[:position].strip()
        after = text[position + len(fragment) :].strip()
        if before:
            replacement.append(with_string_content(section, before))
        replacement.append({"type": "heading", "content": heading})
        if after:
            replacement.append(with_string_content(section, after))
        sections[index : index + 1] = replacement
        return
    raise ValueError(f"Heading fragment not found in chapter content: {fragment}")


def string_content(section: dict[str, Any]) -> str:
    content = section.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, dict) and isinstance(content.get("text"), str):
        return content["text"]
    return ""


def panel_search_text(section: dict[str, Any]) -> str:
    content = section.get("content")
    if not isinstance(content, dict):
        return string_content(section)
    title = content.get("title")
    return " ".join(
        value for value in (title, content.get("text")) if isinstance(value, str)
    )


def with_string_content(section: dict[str, Any], text: str) -> dict[str, Any]:
    copy = {**section}
    if isinstance(section.get("content"), str):
        copy["content"] = text
    else:
        copy["content"] = {**section["content"], "text": text}
    return copy


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def write_report(
    chapters: dict[str, list[dict[str, Any]]],
    ending_boundaries: list[dict[str, Any]],
) -> None:
    report = {
        "schemaVersion": 2,
        "referenceCase": "Position 1.9",
        "endingBoundaries": ending_boundaries,
        "recoveredVectorBoxPanels": [
            {
                "chapter": spec.chapter,
                "page": spec.page,
                "title": spec.title,
                "textStartsWith": spec.start,
            }
            for spec in PANEL_SPECS
        ],
        "subtitles": [
            {"chapter": chapter, "position": position, "text": value[1]}
            for chapter, positions in SUBTITLES.items()
            for position, value in positions.items()
        ],
        "standaloneHeadings": [
            {"chapter": chapter, "text": value[1]}
            for chapter, headings in STANDALONE_HEADINGS.items()
            for value in headings
        ],
        "chapterSpilloversRemoved": sorted(CHAPTER_SPILLOVERS),
        "markerOverlays": [
            {"chapter": "1", "position": "1.9", "square": "e6"}
        ],
        "countsByChapter": {
            chapter: {
                "headings": sum(s.get("type") == "heading" for s in sections),
                "panels": sum(s.get("type") == "panel" for s in sections),
                "positions": sum(s.get("type") == "position" for s in sections),
                "subtitles": sum(
                    s.get("type") == "position" and bool(s["content"].get("subtitle"))
                    for s in sections
                ),
            }
            for chapter, sections in chapters.items()
        },
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
