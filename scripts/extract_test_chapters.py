#!/usr/bin/env python3
"""Extract the Basic Test and Final Test into structured problem sections."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

import pdfplumber

from extract_chapters_3_4 import normalize_pdf_text


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf"
PDF_DIR = ROOT / "app/src/app_x/pdf"


@dataclass(frozen=True)
class Problem:
    number: str
    prompt: str
    fen: str
    solution_fen: str | None = None


CHAPTER_2 = (
    Problem("2.01", "White to move. Is it a draw?", "8/8/K7/N7/8/7p/7k/8 w - - 0 1"),
    Problem("2.02", "White to move. Is it a draw?", "8/8/K7/8/7N/7p/7k/8 w - - 0 1"),
    Problem("2.03", "White to move. Is it a draw?", "7Q/8/8/3K4/8/8/2pk4/8 w - - 0 1"),
    Problem("2.04", "Black to move. What should you play and with which result?", "4k3/R7/5K2/4P3/8/8/8/1r6 b - - 0 1"),
    Problem("2.05", "White to move. What should you play and with which result?", "8/2K5/8/8/3kN3/8/7p/8 w - - 0 1"),
    Problem("2.06", "Black to move. Is it a draw?", "3b4/8/2K5/1P6/3B4/8/4k3/8 b - - 0 1"),
    Problem("2.07", "White to move. Is it a draw?", "8/7K/6P1/6k1/8/2b5/8/2B5 w - - 0 1"),
    Problem("2.08", "Black to move. Is 1...Bc4 a good or a bad move? Or is it irrelevant?", "8/6k1/8/1b2PP2/4K3/8/8/3B4 b - - 0 1"),
    Problem("2.09", "White to move. Is it a draw?", "8/1PbB4/8/6k1/4K3/5P2/8/8 w - - 0 1"),
    Problem("2.10", "Black to move. Is it a draw?", "8/6k1/p5p1/8/8/1B3K2/3b4/8 b - - 0 1"),
    Problem("2.11", "White to move. What should you play and with which result?", "3R4/4K3/8/8/3pk3/8/8/8 w - - 0 1"),
    Problem("2.12", "Black to move. Is it a draw?", "R7/8/8/8/8/pk1K4/8/8 b - - 0 1"),
    Problem("2.13", "White to move. Can he win?", "R7/4k3/P7/8/8/8/6K1/r7 w - - 0 1"),
    Problem("2.14", "White to move. Is it worth playing on?", "8/3K4/8/8/8/4p3/2Pk4/8 w - - 0 1"),
    Problem("2.15", "White to move. Can he win?", "8/3Pk3/8/1K3P2/8/8/8/8 w - - 0 1"),
    Problem("2.16", "White to move. What should he do and with which result?", "8/8/8/3p4/5k2/3P4/8/2K5 w - - 0 1"),
    Problem("2.17", "White to move. Can he draw?", "7K/8/8/8/8/2p4N/8/2k5 w - - 0 1"),
    Problem("2.18", "White to move. Can he win?", "2k5/8/8/8/6P1/8/8/4K3 w - - 0 1"),
    Problem("2.19", "White to move. What is the correct result?", "8/6P1/8/8/5K2/8/6k1/7q w - - 0 1"),
    Problem("2.20", "White to move. Can he win?", "r7/8/8/3k4/PK6/8/8/7R w - - 0 1"),
    Problem("2.21", "White to move. What is the correct result?", "8/8/8/3kp3/8/8/8/3K4 w - - 0 1"),
    Problem("2.22", "White to move. Can he win?", "8/8/1k5p/8/1P5P/1K6/8/8 w - - 0 1"),
    Problem("2.23", "Suppose you have already spent 30 of your 50 moves to get here. It is time to be accurate. What would you do?", "8/2k4B/4K3/4N3/8/8/8/8 w - - 0 1"),
    Problem("2.24", "White to move. Can he draw?", "8/5KPq/8/8/3k4/8/8/8 w - - 0 1"),
    Problem("2.25", "Black to move. Can he draw?", "8/5R2/K7/8/5pk1/8/8/8 b - - 0 1"),
    Problem("2.26", "Black to move. Would you trade queens on c5 to win?", "8/8/3Q1p2/1q1P4/3k4/8/8/2K5 b - - 0 1"),
)


CHAPTER_14 = (
    Problem("14.01", "White to move. What is the correct result?", "8/K7/1P6/8/6n1/7k/8/8 w - - 0 1"),
    Problem("14.02", "White to move. What is the correct result?", "8/8/6R1/8/p7/4k3/6K1/r7 w - - 0 1"),
    Problem("14.03", "Find a square where a black knight can draw here, with White to move.", "8/4kPK1/8/8/4B3/8/8/8 w - - 0 1", "4n3/4kPK1/8/8/4B3/8/8/8 w - - 0 1"),
    Problem("14.04", "Black to move. Can he draw?", "8/4k3/8/8/r5P1/5R1K/8/8 b - - 0 1"),
    Problem("14.05", "Black to move. Can he draw?", "8/8/8/P7/3k4/1P6/1K5R/r7 b - - 0 1"),
    Problem("14.06", "White to move. What is the correct result?", "8/7p/5k2/8/5K2/7P/6P1/8 w - - 0 1"),
    Problem("14.07", "Black to move. Can he draw?", "3b4/8/8/NK6/P7/1k6/8/8 b - - 0 1"),
    Problem("14.08", "White to move. Is the ending won or drawn?", "3kB3/1K1P4/1P6/8/3b4/8/8/8 w - - 0 1"),
    Problem("14.09", "White to move. Can he draw?", "7K/8/8/8/7N/7p/8/7k w - - 0 1"),
    Problem("14.10", "White to move. Can he win?", "8/8/8/6Kp/kPp5/2P5/8/8 w - - 0 1"),
    Problem("14.11", "White to move. Can he win?", "r7/7R/8/8/8/1P2k3/1K6/8 w - - 0 1"),
    Problem("14.12", "Black to move. Can he draw?", "8/8/8/5p2/1P5k/3K4/8/8 b - - 0 1"),
    Problem("14.13", "Is there any square on the board for the white king such that Black, to move, can draw?", "8/8/1k6/8/P2P4/8/8/8 b - - 0 1", "8/8/1k6/8/P2P4/8/8/K7 b - - 0 1"),
    Problem("14.14", "Black to move. Larsen could not find a way to draw. Can you?", "6r1/8/8/8/R3k1PK/8/8/8 b - - 0 1"),
    Problem("14.15", "White to move. Can he win?", "K7/6k1/8/6p1/8/8/7R/8 w - - 0 1"),
    Problem("14.16", "Is this ending drawn?", "8/8/8/r5KP/8/4k3/8/8 w - - 0 1"),
    Problem("14.17", "Black to move. According to ChessBase Magazine notes, this position is a dead draw, but with Black being an exchange and a pawn up that is difficult to believe, isn't it?", "8/8/3B4/5k2/8/6p1/1r3PK1/8 b - - 0 1"),
    Problem("14.18", "Black to move. Can he draw?", "6KR/8/pk6/8/8/8/8/8 b - - 0 1"),
    Problem("14.19", "White to move. What is the result?", "4K3/7R/8/3rP3/5k2/8/8/8 w - - 0 1"),
    Problem("14.20", "White to move. Can he draw?", "8/8/2p5/8/2P5/8/6K1/4k3 w - - 0 1"),
    Problem("14.21", "What is the result after 1.Kc6, 1.Kc4 or 1.Ke6?", "8/3r4/8/3K4/4P3/8/2k5/8 w - - 0 1"),
    Problem("14.22", "Black to move. Can he win?", "8/7p/8/6K1/3k2PP/8/8/2b5 b - - 0 1"),
    Problem("14.23", "Black to move. Can he win?", "8/6KP/4k3/8/8/5B2/2p4r/8 b - - 0 1"),
    Problem("14.24", "Black to move. Can he draw?", "b7/P1k5/6N1/8/5PK1/8/8/8 b - - 0 1"),
    Problem("14.25", "White to move. Can he win?", "8/5K1k/4p3/4P3/2b1P3/3B2P1/8/8 w - - 0 1"),
    Problem("14.26", "Find mistakes in the printed continuation beginning 90...Kh7.", "6rk/8/5K1p/8/2Q5/8/8/8 b - - 0 90"),
    Problem("14.27", "Everybody knows that, in this game, Janovsky resigned in a drawn position, but it is not so well-known that Capablanca had a forced win. What would you play in this position in which Capablanca made a mistake?", "3b4/6k1/6P1/8/1BK5/1P6/8/8 w - - 0 81"),
    Problem("14.28", "Black is going to lose his rook. Can he draw after all?", "8/7P/7K/3kp2R/8/8/8/6r1 b - - 0 63"),
    Problem("14.29", "Black to move. Can he draw?", "8/8/8/2pr4/R7/8/1k6/3K4 b - - 0 69"),
    Problem("14.30", "Black to move. Can he draw?", "8/8/2k5/8/5KB1/6P1/8/3b4 b - - 0 89"),
    Problem("14.31", "White to move. What is the correct result?", "8/1n2k3/3n4/P7/7K/8/8/8 w - - 0 1"),
    Problem("14.32", "Black to move. What is the correct result?", "8/5p2/4k1p1/1Kp2pP1/2P2P2/8/8/8 b - - 0 50"),
    Problem("14.33", "Black to move. Can he win?", "4R3/8/8/5p2/6P1/5k2/r7/6K1 b - - 0 1"),
    Problem("14.34", "White to move. Can he win?", "1K6/1p6/pp6/B7/8/8/1P6/k7 w - - 0 1"),
    Problem("14.35", "White to move. Choose: 1.gxf3+ or 1.g3?", "8/8/8/p4p2/P5k1/5p2/5KP1/8 w - - 0 1"),
    Problem("14.36", "White to move. Can he win?", "8/8/p2R4/K2P1k2/2r5/P7/8/8 w - - 0 64"),
)


SOLUTION_PAGE_INDEXES = {"2": (49, 50), "14": (235, 236, 237, 238, 239)}

SOLUTION_REPAIRS: dict[str, tuple[tuple[str, str], ...]] = {
    "2": (
        ("s:Qb3+", "5.Qb3+"),
        ("1.... Ke1!", "1...Re1!"),
        (
            "1. Nf2! Setting up a barrier... Kc3 (1... Ke3 2. Ng4+; 1... Ke5 1.\n"
            "2. Ng4+) 2. Kd6 Kd2 3. Ke5 Ke2\n4 Nh Kf3 5. Kd4! Kg2 6. Ke3 Kxh1 1.\n"
            "7. Kf2=.",
            "1.Nf2! Setting up a barrier. 1...Kc3 (1...Ke3 2.Ng4+; 1...Ke5 "
            "2.Ng4+) 2.Kd6 Kd2 3.Ke5 Ke2 4.Nh1 Kf3 5.Kd4! Kg2 6.Ke3 Kxh1 "
            "7.Kf2=.",
        ),
        ("s.Bb6 Bgs", "5.Bb6 Bg5"),
        ("\nKa6 Kb3!", "\n8.Ka6 Kb3!"),
        ("9.Bb6 Bg 5", "9.Bb6 Bg5"),
        ("1....Bc4", "1...Bc4"),
        ("the correct move is. Bd7", "the correct move is 1...Bd7"),
        ("2.Bgs", "2.Bg5"),
        ("1..\n3. Kd4", "3.Kd4"),
        ("2. Kig4", "2.Kg4"),
        ("3.Bc2 gS", "3.Bc2 g5"),
        ("14.w b1", "14.Kb1"),
        ("Wei! 3Ra8", "Kc1! 3.Ra8"),
        ("I... Kd6", "1...Kd6"),
        ("e1 Q", "e1=Q"),
        ("Wxd7", "Kxd7"),
        (
            "3. W d2 Kf3 4. We 2 We 2 s. W e1 Wxd3\n6. W d1 Kc3 7. W e1 d3 -+",
            "3.Kd2 Kf3 4.Ke2 Ke3 5.Ke1 Kxd3 6.Kd1 Kc3 7.Ke1 d3-+",
        ),
        ("2. Kc2 Wxd4", "2.Kc2 Kxd4"),
        ("...c22.Ne2+!\nl", "...c2 2.Ne2+!"),
        ("4.N2)", "4.Na2)"),
        ("hS", "h5"),
        ("3.i.bS!", "3.Bb5!"),
        ("s... Kd8", "5...Kd8"),
        ("Kds", "Kd5"),
        ("Wxc5", "Kxc5"),
        ("s... Kd6", "5...Kd6"),
        ("Wxd5", "Kxd5"),
        ("Wxd3", "Kxd3"),
        ("Suba\nHuerga", "Suba-Huerga"),
        ("Bgs", "Bg5"),
        ("11.Bel", "11.Be1"),
        ("\n8.\n11.Be1", "\n11.Be1"),
        ("Kgl", "Kg1"),
    ),
    "14": (
        ("l:Bg3+", "Rg3+"),
        ("l:Ba2+", "Ra2+"),
        ("66JH3", "66.Rb3"),
        ("79...il h8+", "79...Rh8+"),
        ("80.ilxf8", "80.Rxf8"),
        ("82. Kg3 l:Bf8", "82.Kg3 Rf8"),
        ("79. Kh4 l:Ba8", "79.Kh4 Ra8"),
        ("85Rf2", "85.Rf2"),
        ("l:Bh3", "Rh3"),
        ("198 1", "1981"),
        ("50.1ld8", "50.Rd8"),
        ("57.1le3", "57.Re3"),
        ("Manila ( ol)", "Manila (ol)"),
        ("different -coloured", "different-coloured"),
        ("Pamplona op", "Pamplona op."),
        ("1...h22.Nh4", "1...h2 2.Nh4"),
        ("2...h23.Nf3+", "2...h2 3.Nf3+"),
        ("3. Ng4!..", "3.Ng4!"),
        ("57.b8=Qc2", "57.b8=Q c2"),
        ("not 1 Rd7", "not 1.Rd7"),
        ("a3rd-rank", "a 3rd-rank"),
        ("2. W xa4", "2...Kxa4"),
        ("66. Whs", "66.Kh5"),
        ("66.gs", "66.g5"),
        ("73. Wcs", "73.Kc5"),
        ("72. Kb7 Wfs", "72.Kb7 Kf5"),
        ("2.h6 Ka6+", "2.h6 Ra6+"),
        ("s.wgs", "5.Kg5"),
        ("3...a S??", "3...a5??"),
        ("4.ldhS!", "4.Rh5!"),
        ("6...a37.Rb8+", "6...a3 7.Rb8+"),
        ("10. I:N8+", "10.Rb8+"),
        ("55...l!i. g3+!!", "55...Rg3+!!"),
        ("c1Q'", "c1=Q"),
        ("h8=Q'", "h8=Q"),
        ("57.. Rh3+", "57...Rh3+"),
        ("19 16", "1916"),
        ("winning necessary tempo", "winning a necessary tempo"),
        ("llxh7+", "Rxh7+"),
        ("llxh7!", "Rxh7!"),
        ("h8=Q.t!xh8", "h8=Q Rxh8"),
        ("68Rt:xh8", "68.Rxh8"),
        ("67Jif8", "67.Rf8"),
        ("68.llxh8", "68.Rxh8"),
        ("77Jdf2+", "77.Rf2+"),
        ("199 1", "1991"),
        (" Kc3! Z 70.", " Kc3! 70."),
        ("70. Rb6\na (70.", "70.Rb6 (70."),
        ("89...il a4!", "89...Ba4!"),
        ("96.g5 ilhs", "96.g5 Bh5"),
        ("97.ilb 1", "97.Bb1"),
        ("98. Kfs", "98.Kf5"),
        ("94.ilfs", "94.Bf5"),
        ("95.ildS", "95.Bd5"),
        ("8. Ke3.Rg2!", "8.Ke3 Rg2!"),
        ("3.axb6ep", "3.axb6 e.p."),
        ("6.b8=Q=", "6.b8=Q"),
        ("6...a27.Kb6", "6...a2 7.Kb6"),
    ),
}


SOURCE_TRANSCRIPTIONS: dict[str, str] = {
    "14.02": (
        "Kamsky-Karpov, Linares 1994. 62.Rg4! a3 63.Rg3+ Ke4 64.Rb3 Ra2+ "
        "65.Kg3 Kd4 66.Rf3 Ra1 67.Kg2 1/2-1/2."
    ),
    "14.04": (
        "Fischer-Sherwin, Portoroz 1958. 78...Ke6? (78...Ra8! 79.Kh4 "
        "(79.g5 Rf8=) 79...Rh8+! (79...Rf8? 80.Rxf8 Kxf8 81.Kh5!+-) 80.Kg5 "
        "Rg8+ 81.Kh4 Rh8+ 82.Kg3 Rf8!= 83.Rxf8 Kxf8 84.Kf4 Kg8!) 79.Kh4 "
        "Ra8 80.g5 Rh8+ 81.Kg4 Ke7 82.g6 Rf8 83.Rf5 Rh8 84.Kg5 Rh1 85.Rf2 "
        "Rh3 86.g7 Rg3+ 87.Kh6 Rh3+ 88.Kg6 Rg3+ 89.Kh7 Rh3+ 90.Kg8 1-0."
    ),
    "14.05": (
        "Medina-De la Villa, Calella 1981. 43...Kc6! (43...Rxa6 44.Rh5+! Kd4 "
        "(44...Kc6 45.b5+-) 45.b5 Ra8 46.Kb4 Rb8 47.Rh6 Kd5 48.b6+-) "
        "44.Rh5 Kb6 45.b5 Rb1+ 46.Kc2 Ra1 47.Rd5 Ra3 48.Kb2 Rg3 49.Kc2 Rh3 "
        "50.Rd8 Rh7! 51.Rd5 Rh3 52.Kd2 Ra3 53.Ke2 Rb3 54.Kf2 Ra3 55.Rf5 "
        "Rb3 56.Re5 Ra3 57.Re3 Ra2+ 58.Re2 Ra3 59.Rb2 Rh3 60.Re2 1/2-1/2."
    ),
    "14.07": (
        "Dutreeuw-Hovhanisian, Aalst 2005. 76...Kc3? (76...Ka3 77.Nb7 Bb6=; "
        "76...Ka2 77.Nb7 Bc7 78.Nc5 Ka3!=) 77.Nb7 Bc7 78.Nc5 Bb8 (78...Kb2 "
        "79.Ne6!+-) 79.a5 Ba7 80.a6 Kd4 81.Nd7 Kd5 82.Nb6+ Kd6 "
        "(82...Ke6 83.Kc6+-) 83.Nc8+ 1-0."
    ),
    "14.08": (
        "Moreno-Vinal, Pamplona op. 2005. It is drawn. 73.Ka6 Be3?? "
        "(73...Be5=) 74.b7 Bf4 75.Ka7 1-0."
    ),
    "14.12": (
        "Najdorf-Vinuesa, 1941. Yes, 1...Kh3! (1...Kg3 2.b5+-; 1...f4 "
        "2.Ke2-+) 2.b5 (2.Ke3 Kg3!; 2.Ke2 Kg2!) 2...f4 3.Ke4 Kg3! 4.b6 f3 "
        "5.b7 f2 6.b8=Q+ Kg2= 1/2-1/2."
    ),
    "14.13": (
        "Only the a1-square. 1...Ka5 2.Kb2! (2.d5 Kb6 3.Kb2 Kc5=) "
        "2...Kxa4 3.Kc3 Kb5 4.Kd3 Kc6 5.Ke4 Kd6=."
    ),
    "14.14": (
        "Taimanov-Larsen, Mallorca 1970. 63...Ke5?? (63...Rh8+ 64.Kg3 Ke5! "
        "65.Ra6 Rh7!=; 63...Kf4! 64.Ra4+ Kf3!= (64...Ke5 65.Ra6+-)) 64.Ra6! "
        "Kf4 (64...Rh8+ 65.Kg5 Rg8+ 66.Kh5 Rh8+ 67.Rh6 Rg8 68.g5 Kf5 "
        "69.Rf6+ Ke5 70.Rf2+-) 65.Rf6+ Ke5 66.g5 1-0."
    ),
    "14.16": (
        "Yes, but White must avoid being pushed from the rear, the winning procedure "
        "against a rook's pawn. 1.Kg4! (1.Kg6 Kf4 2.h6 Ra6+ 3.Kg7 Kg5 4.h7 "
        "Ra7+ 5.Kg8 Kg6 6.h8=N+ Kf6-+) 1...Ke4 2.h6 Ra1 3.Kg5 Ke5 4.Kg6 "
        "Ke6 5.Kg7!=."
    ),
    "14.17": (
        "Miladinovic-Beliavsky, Ohrid 2001. 99...gxf3? (99...Rxf3+! 100.Kg2 "
        "Rd3 101.Kc7 Kg5 with the idea Kh4 and Rd2. 102.Ke5 Rd5 103.Kc7 "
        "(103.Kg3 Rd2+; 103.Kh2 Rd2+ 104.Kg3 Ra2 105.Kg1 Ra3+ 106.Kg2 Kf4) "
        "103...Rd2+ 104.Kg3 Rd3+ 105.Kg2 Kh4!-+ and the white king is driven "
        "off his blockade position) 100.Kc5 Ke4 101.Kf2. Now the ending is a real "
        "dead draw. See Ending 97. Black kept on trying for 30 moves. 1/2-1/2."
    ),
    "14.18": (
        "Yes! 3...Kc5!! The only move that secures the draw. Preventing the cut "
        "along the 3rd rank (which would occur after the pawn's advance) is not "
        "enough. The white king must be hindered as well, as analysis proves: "
        "(3...a5?? loses on the spot due to 4.Rh5!; 3...Kb5? (allowing the white "
        "king to arrive) 4.Kf7 a5 5.Ke6 a4 6.Kd5! Done! The white king shoulders "
        "his black counterpart before the pawn reaches the 6th rank. Therefore, "
        "White wins. 6...Kb4 (6...a3 7.Rb8+ Ka4 8.Kc4) 7.Kd4! Again. 7...Kb3 "
        "(7...a3 8.Rb8+) 8.Kd3 And again. 8...Kb2 (8...a3, reaching the important "
        "position on White's turn! 9.Rb8+) 9.Rb8+ Ka2 10.Kc2+-) 4.Kf7 a5! "
        "5.Ke6 a4! (the pawn advances as the king holds) 6.Ke5 a3 7.Ke4 "
        "(7.Ra8 is another attempt. 7...Kb4 8.Kd4 Kb3! 9.Kd3 (See Ending 28) "
        "9...Kb2! (9...a2 10.Rb8+ Ka3 11.Kc2! a1=N+ 12.Kc3+-) 10.Kd2 a2 "
        "11.Rb8+ Ka1!=) 7...Kc4 (7...a2?? 8.Ra8) 8.Rc8+ Kb3 9.Kd3 "
        "(See Ending 28) 9...Kb2! (9...a2 10.Rb8+ Ka3 11.Kc2+-) 10.Rb8+ Kc1! "
        "11.Kc3 a2 12.Ra8 Kb1 13.Rb8+ Kc1!= (13...Ka1?? 14.Re8+-)."
    ),
    "14.19": (
        "3.Kf5! And Black is unable to use any of the defensive procedures: "
        "neither Philidor, nor K&H. Therefore, we will reach the Lucena Position. "
        "3...Rd1 (3...Ra5 4.Kf6+-) 4.Ke6 Kf8 5.Rf7+! Kg8 (5...Ke8 6.Ra7! "
        "White takes the file the black rook would need for efficient distant checks. "
        "6...Kf8 7.Rh8+-) 6.Rd7 Ra1 7.Ke7 Kg7 (7...Ra8 8.Rd8+!) 8.Ke8+! "
        "(8.e6 Ra8=) 8...Kg6 9.Rd6+! (9.e6 Kf6=) 9...Kg7 10.e6 Ra8+ "
        "11.Rd8 Ra6 12.e7 Ra7 13.Rc8+-."
    ),
    "14.21": (
        "Volke-Kovalev, Minsk 1994. The game went 1.Ke6?, which is interesting "
        "for us, as this analysis involves a complete revision of the recurrent "
        "ideas in Rook vs. Pawn endings. (1.Kc4 and 1.Kc6 draw. 1.Ke6 loses. "
        "1.Kc4! Re7 (1...Kd2 2.e5 Ke3 3.Kc5! Ke4 4.e6 Ra7 5.Kd6=) 2.Kd5 Kd3 "
        "3.e5=; 1.Kc6 Re7 2.Kd5 Kd3 3.e5=) 1...Rd4! The rook moves to the rear "
        "of the pawn and chooses a square where later the black king will not "
        "obstruct it. (1...Rd1? 2.e5 Kc3 (2...Kd3 3.Kd5! Shouldering! 3...Ke3+ "
        "4.Kc6! Kf4 and once the kings occupy both sides of the pawn, counting "
        "favours White: 3 tempi for him, 4 for Black. 5.e6 Re1 6.Kd7 Kf5 7.e7=) "
        "3.Kf7 Rf1+ 4.Ke7 (4.Kg7? Re1 5.Kf6 Kd4-+) 4...Kd4 5.Kd6! Shouldering "
        "again. As we know, shouldering from the rear leads to underpromotion to "
        "a knight and a draw. 5...Ra1 6.e6 Ra6+ 7.Kd7 Kd5 8.e7 Ra7+ 9.Kd8 Kd6 "
        "10.e8=N+=) 2.e5 Kd3 3.Kf7 Rf4+ 4.Ke7 Ke4 5.e6 (5.Kd6 Kf5) 5...Ke5 "
        "6.Kd7 Rd4+-+ 0-1."
    ),
    "14.22": "54...Ke4! 55.Kh6 Kf4 56.g5 Bg6! 57.h5 Kf5-+ 0-1.",
    "14.23": (
        "Berkvens-Van Beek, Dieren 2000. Yes, 55...Rg3+!! 56.Kh6 (56.Kxg3 "
        "c1=Q 57.h8=Q Qg5+ 58.Kh7 Kf7-+; 56.Kh8 Kf7-+; 56.Kf8 Rf3!-+) "
        "56...Kf7! 57.Rc1 (57.h8=N+ Kf6 58.Kh7 Rg7+ 59.Kh6 Rg4-+) "
        "57...Rh3+ 0-1."
    ),
    "14.24": (
        "Dominguez-Bruzon, Havana 2005. 89...Kb6? (yes, 89...Be4! 90.Ne7 Kb7= "
        "the black king captures the a7 pawn and the bishop is able to stop the "
        "f-pawn, because both control diagonals are more than 4 squares long) "
        "90.f5 Now one of the diagonals is 4 squares long and Black is lost in any "
        "case, but anyway, the bishop cannot stop the pawn anymore. 90...Kxa7?! "
        "91.Ne7! 1-0."
    ),
    "14.25": (
        "Negulescu-Szuhanek, Bucharest 1998. Yes, due to the unfortunate position "
        "of the black king. 77.g4!! (77.Kxf5+? would allow Black to reach known "
        "defensive set-ups. 77...Kh6 78.g4 (78.Bc2 Be3 79.Kf6 Bd2 80.Kf5 Kg7=) "
        "78...Kf6!= 79.Bc2 Kd8 80.Ke6 Kg7=) 77...Kh8?! (77...Kh6 is more "
        "stubborn: 78.g5+ Kh5 79.Bxf5 Kh4 80.Be6! Kh5 81.g6 Kh6 82.f5+-) "
        "78.g5 Be3 79.g6 Bd4 80.Bxf5 Be5 (80...Be5 81.Bd3 Bd4 82.f5 Be5 "
        "83.f6+-) 1-0."
    ),
    "14.26": (
        "Kramnik-Polgar, Monaco 1994. 90...Kh7?? (90...Rg7!) 91.Qe4+?? "
        "(91.Kf7 Rg7+ 92.Kf8+-) 91...Kh8 92.Qc4 Kh7?? (92...Rg7=) 93.Qf7+?? "
        "(93.Kf7+-) 93...Kh8 94.Qd7 Rg5 95.Qb7 Rg8 96.Qb3 Kh7?? (96...Rg7=) "
        "97.Kf7 Rg5 98.Ke6 Rg7+ 99.Kf8 Rg5 100.Kf6 Rg8+ 101.Kf7 Rg5 102.Kd4 "
        "Rf5+ 103.Ke6 Rg5 104.Kf6?? (104.Kf7 Rf5+ 105.Ke7 Rg5 106.Ke4+ Kh8 "
        "107.Ke6+-) 104...Rg8?? (104...Rg7=) 105.Kd7+?? (105.Ke7 or 105.Kf7+-) "
        "and 1-0. For explanations, see Ending 100."
    ),
    "14.27": (
        "Capablanca-Janovsky, New York 1916. 81.Bc3+? (81.Be1! In principle, "
        "it is difficult to find the difference between this and the game move, but "
        "here the bishop prevents the black king from winning time. 81...Kxg6 "
        "(81...Be7 82.Bf2 Kxg6 83.Bc5+-) 82.b4 Kf5 83.Bd5 Kf4 84.b5 Ke3 "
        "85.Kc6 Kd3 86.Kb7! Kc4 87.Ka6 Kb3 88.Ba5+-; 81.Bd2! also wins, as it "
        "blocks the black king's route to the rear of the pawn. 81...Kxg6 82.b4 "
        "Kf5 83.Bd5 Kg4 84.b5 Kf3 85.Kc6 Ke4 86.Be1 Kd3 87.Kb7! Kc4 88.Ka6) "
        "81...Kxg6 82.b4 Kf5 83.Bd5 Here Janovsky resigned. 83...Kf4 84.Bd4 "
        "(84.b5 Ke3 85.Kc6 Kd3! winning a necessary tempo to reach the c4-square: "
        "86.Be5 Kc4=) 84...Kf3! 85.b5 Ke2!= 1-0."
    ),
    "14.28": (
        "Kamsky-Bacrot, Sofia 2006. Yes, though a difficult defence is exhausting. "
        "63...Ke4!! (63...e4 64.Rf5+-; 63...Kd4 64.Rf5+-; 63...Rh1+ 64.Kg7 "
        "Rxh7+ 65.Kxh7 Kings on both sides of the pawn. If we just count, the result "
        "is 6-6, so Black loses, and that is what happens here. 65...e4 66.Kg6 Kd4 "
        "(66...Ke5 67.Rf8 e3 68.Kg5 Ke4 69.Kg4 e2 70.Re8+ Kd3 71.Kf3+-)) "
        "64.Rf8 Rh1+! 65.Kg6 Rxh7! (the white king must be as far as possible: "
        "65...Kd3? 66.Rd8+! Kc3 (66...Ke3 67.h8=Q Rxh8 68.Rxh8 e4 69.Kf5+-) "
        "67.h8=Q Rxh8 68.Rxh8 e4 69.Re8 Kd3 70.Kf5 e3 71.Kf4 e2 72.Kf3+-) "
        "66.Kxh7 Kd3! 67.Rd8+ Ke3! (67...Kc3 68.Re8 Kd4 69.Kg6+-) 68.Kg6 e4 "
        "69.Kf5 Kf3! 70.Rh8 e3 71.Rh3+ Kf2 72.Kf4 e2 73.Rh2+ Kf1 74.Kf3 "
        "e1=N+= The game should be drawn, but the rest appears in the appendix to "
        "Ending 9. 75.Kg3 Nd3 76.Rd2 Ne1 77.Rf2+ Kg1 78.Rf8 Ng2 79.Kf3 Kf1 "
        "80.Kg3+ Kg1 81.Kf3 Kf1 82.Rf7 Ne1+ 83.Ke3+ Kg1 84.Ke2 Ng2 85.Rh7 "
        "Nf4+ 86.Kf3 Nd3 87.Rh4 Ne5+ 88.Ke2 Kg2 89.Re4 Nf7 90.Re7 Nd6 91.Rg7+ "
        "Kh3 92.Kf3 Kh4 93.Kf4 Kh5 94.Re7 Nc4 95.Re6 Nd2 96.Rc6 Nb3 97.Ke3 "
        "Kg4 98.Rc4+ Kg3 99.Rc3 Na5 100.Ke4+ Kf2 101.Kd5 Nb7 102.Rb3 Nd8 "
        "103.Rb8 1-0."
    ),
    "14.30": (
        "Urbanec-Hora, Prague 1964. Yes! The c5 pawn is lost and the black king "
        "will make it to the rear of the pawn, but the bishop must play accurately. "
        "89...Kb3? Here the bishop will not be able to reach the c8-h3 diagonal. "
        "(89...Ba4! 90.Bf3+ Kxe5 91.g4 (91.Ke5 Bd7! 92.Be4 Bg4! 93.Kf4 Bd7 "
        "94.Bf5 Be8 95.g4 Kd4 96.g5 Bh5 97.Bb1 Be8 98.Kf5 Ke3! 99.Kf6 Kf4!=) "
        "91...Kd4 92.g5 Bc2 93.Bg4 Bg6 94.Bf5 Be8 95.Bc2 Bf7 96.Kf5 Ke3 "
        "97.Kf6 Kf4=) 90.Bf3+ Kxe5 91.Ke5!+- Bf7 92.g4 Bg6 (92...Kc4 93.g5 "
        "Kd3 94.Kf6 Be8 95.Bd5+- and Bf7) 93.Bd5 Bc2 94.Bf7 Kc6 95.Be8+ Kc7 "
        "96.Kf6 Kd6 97.g5 Bd3 98.Bg6 Bc4 99.Bc2 Kd7 100.g6 Ke8 101.g7 Bg8 "
        "102.Bg6+ Kd7 103.Bf7 Bh7 104.Bb3 1-0."
    ),
    "14.29": (
        "Arencibia-Vladimirov, Leon 1991. Yes, but only one move works. 69.Rc5? "
        "(69.Ra6? Kc3! 70.Rb6 (70.Ke1 Kb4-+ 71.Ke2 Kb5 72.Ra1 c5-+; "
        "70.Ke3 Re6+-+) 70...Rd2+ 71.Ke1 c5 72.Rc6 Rd5-+; 69.Ke3! "
        "(transferring the king to a drawing square before using frontal checks for "
        "defence) 69...Kb4 70.Ra1 c5 71.Rb1+ Ka3 72.Rc1 Rd5 73.Ke4=) "
        "69...Kb4-+ 70.Rc1 c5 (the pawn is on the 4th rank and the white king is "
        "cut off along one file, therefore he must be on e3 or e4 to draw) "
        "71.Rb1+ Ka3 72.Rc1 Rd5 (72...Rd5 73.Ke3 Kb2-+) 0-1."
    ),
    "14.36": (
        "Landenbergue-Salgado, Elgoibar, 2006. All rook endings are drawn... "
        "because we play them badly. 64.Rxa6? (White could win with a move by no "
        "means easy to find: 64.Re6! Rd4 65.Kxa6 Rxd5 66.Re1+-, cutting the king "
        "off along the f-file. This position will lead to Ending 67; 64.Rh6 should "
        "win as well) 64...Ke5! 65.d6 Ke6 66.Kb5 Rc1 67.a4 Kd7 68.Rb6 Rb1+? "
        "(68...Rd1! 69.Ka6 Rd5 70.a5 Kc8!= and in this funny position, despite "
        "White being two pawns up, he cannot make progress due to the passivity of "
        "his pieces) 69.Ka6 Ra1 70.a5 Ra2 71.Rb1 Kxd6 72.Kb6 Kd7 73.a6 Kc8 "
        "74.Ka7? Kc7 75.Rc1+ Kd7 76.Rc5 Kd6 77.Rh5 Kc7 78.Rh6 Ra1 79.Rh7+ "
        "Kc6 1/2-1/2."
    ),
}


def main() -> None:
    with pdfplumber.open(PDF_PATH) as pdf:
        for chapter, title, problems in (
            ("2", "Basic Test", CHAPTER_2),
            ("14", "Final Test", CHAPTER_14),
        ):
            solutions = extract_solutions(pdf, chapter)
            expected = {problem.number for problem in problems}
            if set(solutions) != expected:
                missing = sorted(expected - set(solutions))
                extra = sorted(set(solutions) - expected)
                raise ValueError(
                    f"Chapter {chapter} solution mismatch: missing={missing}, extra={extra}"
                )

            sections: list[dict[str, object]] = [
                {"type": "title", "content": title}
            ]
            for problem in problems:
                content: dict[str, object] = {
                    "number": problem.number,
                    "prompt": problem.prompt,
                    "fen": problem.fen,
                    "solution": solutions[problem.number],
                }
                if problem.solution_fen:
                    content["solutionFen"] = problem.solution_fen
                sections.append({"type": "problem", "content": content})

            (PDF_DIR / f"chapter_{chapter}.json").write_text(
                json.dumps(sections, indent=2, ensure_ascii=False) + "\n"
            )


def extract_solutions(
    pdf: pdfplumber.PDF,
    chapter: str,
) -> dict[str, str]:
    parts: list[str] = []
    for page_index in SOLUTION_PAGE_INDEXES[chapter]:
        page = pdf.pages[page_index]
        top = 340 if chapter == "2" and page_index == 49 else 45
        split = 285
        for x0, x1 in ((35, split), (split, page.width - 35)):
            parts.append(extract_column_text(page, x0, x1, top))

    text = normalize_solution_text("\n".join(parts), chapter)
    label_pattern = re.compile(rf"(?m)^{chapter}\.(\d{{2}})\s+")
    matches = list(label_pattern.finditer(text))
    solutions: dict[str, str] = {}

    for index, match in enumerate(matches):
        number = f"{chapter}.{match.group(1)}"
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        solution = text[match.end() : end].strip()
        solutions[number] = SOURCE_TRANSCRIPTIONS.get(number, solution)

    return solutions


def extract_column_text(
    page: pdfplumber.page.Page,
    x0: float,
    x1: float,
    top: float,
) -> str:
    words = [
        word
        for word in page.extract_words(x_tolerance=3, y_tolerance=3)
        if top <= word["top"] < page.height - 24
        and x0 <= (word["x0"] + word["x1"]) / 2 < x1
    ]
    lines: list[list[dict[str, object]]] = []

    for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
        if not lines or abs(float(lines[-1][0]["top"]) - word["top"]) > 3:
            lines.append([word])
        else:
            lines[-1].append(word)

    return "\n".join(
        " ".join(str(word["text"]) for word in sorted(line, key=lambda item: item["x0"]))
        for line in lines
    )


def normalize_solution_text(text: str, chapter: str) -> str:
    text = normalize_pdf_text(text)
    text = re.sub(rf"\b{chapter}\.(\d)\s+([0-9S])\b", normalize_problem_number, text)
    text = re.sub(r"\b([12])\s*([0-9])\s*\.\s*", r"\1\2.", text)
    text = re.sub(r"\b([1-9])\s+([0-9])(?=\.)", r"\1\2", text)
    text = re.sub(r"\b([KQRBNW])\s*([a-h])S\b", r"\1\g<2>5", text)
    text = re.sub(r"\b([KQRBNW])\s*([a-h])l\b", r"\1\g<2>1", text)
    text = re.sub(r"\b([KQRBNW])\s+([a-h][1-8])", r"\1\2", text)
    text = text.replace("i1L", "B").replace("iiL", "B").replace("iL", "B")
    text = re.sub(r"(?:\bi\.|\bil|\biR|\b4J)(?=[a-h][1-8])", "B", text)
    text = text.replace("lN", "N").replace("tb", "N").replace("4J", "N")
    text = text.replace("'R>", "K")
    text = re.sub(r"\bW\s*([a-h][1-8])", r"K\1", text)
    text = re.sub(r"(?:l:I|Il|ll|ld|\.tr|l!B|l;I|l::I|I:i|I:d|J[:;])\s*([a-h][1-8])", r"R\1", text)
    text = re.sub(r"\bQ'(?=[a-h][1-8])", "Q", text)
    text = re.sub(r"\b([a-h][18])K(?=[+#=!?.,;) ]|$)", r"\1=Q", text)
    text = re.sub(r"\b([a-h][18])Q(?=[+#=!?.,;) ]|$)", r"\1=Q", text)
    text = re.sub(r"(?<!\d)\b[Il]\s*\.(?=\s*[KQRBNa-h])", "1.", text)
    text = re.sub(r"(?<!\d)\b[Ss]\s*\.(?=\s*[KQRBNa-h])", "5.", text)
    text = re.sub(r"\b1\s*o\s*\.", "10.", text)
    text = re.sub(r"\bl\s*1\s*\.", "11.", text)
    text = re.sub(r"\b1\s*2\s*\.", "12.", text)
    text = re.sub(r"\b1\s*3\s*\.", "13.", text)
    text = re.sub(r"\b1\s*4\s*\.", "14.", text)
    text = re.sub(r"\b([12])\s+([0-9]{3})\b", r"\1\2", text)
    text = re.sub(r"\bS([0-9])(?=\.)", r"5\1", text)
    text = re.sub(r"\bIO([0-9])(?=\.)", r"10\1", text)
    text = re.sub(r"\b1\s+OO(?=\.)", "100", text)
    text = re.sub(r"\b9I(?=\.)", "91", text)
    text = re.sub(r"\b([a-h])S\b", r"\g<1>5", text)
    text = re.sub(r"\b([KQRBN])\s*x\s*", r"\1x", text)
    text = re.sub(r"\b([a-h])\s+x\s*", r"\1x", text)
    text = text.replace("V2", "1/2").replace("Y2", "1/2")
    text = re.sub(r"\b([KQRBN])\s+([a-h][1-8])", r"\1\2", text)
    text = re.sub(r"\b([a-h])\s+([1-8])", r"\1\2", text)
    text = re.sub(r"(?<=\d)\s+\.\.\.", "...", text)
    text = re.sub(r"(?<=\d)\s+\.", ".", text)
    text = re.sub(r"\b([1-9])\s+([0-9])(?=\b)", r"\1\2", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(rf"(?<!^)(?<!\n)(?={chapter}\.\d{{2}}\s)", "\n", text)
    text = text.replace("di agonal", "diagonal")
    text = text.replace("exam pie", "example")
    text = text.replace("op ponent", "opponent")
    text = text.replace("clos ing", "closing")
    text = text.replace("de fence", "defence")
    text = text.replace("pro cedure", "procedure")
    text = text.replace("win ning", "winning")
    text = text.replace("ap pears", "appears")
    text = text.replace("posi tion", "position")
    text = text.replace("explana tions", "explanations")
    text = text.replace("fol lowed", "followed")
    for before, after in (
        ("hin dered", "hindered"),
        ("shoul ders", "shoulders"),
        ("at tempt", "attempt"),
        ("ob struct", "obstruct"),
        ("be hind", "behind"),
        ("ac cording", "according"),
        ("be cause", "because"),
        ("de spite", "despite"),
        ("passiv ity", "passivity"),
        ("try ing", "trying"),
        ("dif ferent", "different"),
        ("ex hausting", "exhausting"),
    ):
        text = text.replace(before, after)
    for before, after in SOLUTION_REPAIRS.get(chapter, ()):
        text = text.replace(before, after)
    return text.strip()


def normalize_problem_number(match: re.Match[str]) -> str:
    second = "5" if match.group(2) == "S" else match.group(2)
    return f"{match.string[match.start():match.start()+match.group(0).find('.')]}{'.'}{match.group(1)}{second}"


if __name__ == "__main__":
    main()
