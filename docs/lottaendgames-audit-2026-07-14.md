# Lotta Endgames — independent PDF-to-app release audit

**Audit completed:** 2026-07-15

**Repository:** /Users/danielcepeda/repos/lottaendgames
**Verdict:** **Ready to show the author**

## Direct result

The audit found material source drift. It was not a confirmation exercise: rendered pages exposed wrong pieces and colours, missing pieces and diagram overlays, incorrect side-to-move values, rook glyphs transcribed as king moves, lost captures and ellipses, wrong names and punctuation, flattened captions, move-tree association failures, and source moves that the generic parser silently left unplayable.

Every identified in-scope discrepancy has been repaired from the rendered PDF, regression-covered, rebuilt into the runtime payload, and reinspected. The final ledger has **zero unresolved units, zero blocked units, and zero unexplained source differences**. All automated gates and the final desktop/mobile interaction pass are clean.

The source-fidelity work does not need to continue for this edition unless the authoritative PDF changes or new contrary page evidence appears. The five explicitly excluded product areas remain optional follow-up product work, not release blockers for source fidelity.

## Authority, method, and exact scope

Only one plausible supplied edition exists:

- PDF: app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf
- Rendered pages: 249
- SHA-256: 7610f6c98410ab22a6dd41f97a1f4e0b6dfeeb18ff8eeb4eac55b80a22bf293a
- Edition represented by the PDF: 2008

The PDF was read visually from rendered page 1 through rendered page 249 in source order. The whole book was rendered at 150 dpi; ambiguous chess glyphs, diagrams, and every corrected item were reinspected at 300–600 dpi. Extracted text, existing JSON, ledgers, hashes, tests, and prior reports were used only as navigation aids, never as proof.

For every board, the rendered diagram was reconstructed square-by-square and compared with the app FEN, side to move, White-side orientation, coordinates, overlays, prompt/caption, and solution association. Every supplied move and variation was then replayed, including branches, captures, checks, promotions, mates, evaluations, results, and deliberately non-playable published inconsistencies. All **337 diagrams use the book’s White orientation**.

### Independently derived inventory

| Source range | Units | Matched | Accepted deviation | Unresolved | Blocked |
|---|---:|---:|---:|---:|---:|
| Front matter PDF 1–9 plus blank PDF 27 | 10 | 0 | 10 | 0 | 0 |
| Introduction and Chapters 1–4 | 145 | 145 | 0 | 0 | 0 |
| Chapters 5–9 | 126 | 126 | 0 | 0 | 0 |
| Chapters 10–12 | 174 | 166 | 8 | 0 | 0 |
| Chapter 13 | 55 | 55 | 0 | 0 | 0 |
| Chapters 14–15 and Bibliography | 76 | 74 | 2 | 0 | 0 |
| **Complete inventory** | **586** | **566** | **20** | **0** | **0** |

The independently derived body totals are exactly the project expectation: **239 page-copy units and 337 board/problem/diagram units**. The complete inventory is 586 because that expectation omitted the nine front-matter units on PDF 1–9 and the blank interstitial on PDF 27.

The machine-readable evidence is in app/src/app_x/pdf/source_fidelity_ledger.json. Each unit records the PDF page, printed page where applicable, chapter/source identifier, route and anchor or section index, fields checked, status, and concise evidence.

## Defect register

Severity is release impact, not a judgment about the author:

- **High:** changed chess meaning, board state, turn, solution, or playback.
- **Medium:** omitted or mis-associated source content, hierarchy, caption, navigation, or metadata.
- **Low:** exact-copy typography, punctuation, spacing, or diacritic drift that did not change chess meaning.

All entries below are **fixed** unless explicitly marked accepted in the separate deviation register. Related micro-corrections on one rendered page are grouped into one row, but each changed item is named.

### Found during the full visual reconstruction

| PDF / print | App location | PDF evidence and prior app drift | Type / severity | Disposition |
|---|---|---|---|---|
| 1–5 / unnumbered | /book/about | Subtitle, back-cover description, author biography, ISBN/prices, and production credits were absent. Restored Vital Lessons for Every Chess Player and the printed metadata/credits semantically. | Metadata/association / Medium | Fixed and visually rechecked |
| 19 / 18 | /book/intro | App invented an Endgame statistics caption and verbose column headings; PDF has no caption and two percent headings. | Presentation/association / Medium | Fixed; empty-caption rendering regression added |
| 23 / 22 | /book/intro | The direct, upper, and lower king routes from a4 to h4 were missing from The king’s multiple routes diagram. | Diagram / High | Restored all three rendered paths and tested overlays |
| 29 / 28 | /book/chapter1#p1.2 | Printed pawn-square outline a4-a8-e8-e4-a4 was absent. | Diagram / High | Restored and tested |
| 39 / 38 | /book/chapter1#p1.16 | Pawn, king, and stars were a4/c2/b2/b1; PDF shows a5/d2/c2/c1. | Diagram / High | Corrected FEN/markers; replayed through 5.Kc1 |
| 40 / 39 | /book/chapter1 | 1...Kh2 was a king-glyph error; PDF visibly prints 1...Bh2. | Transcription / High | Corrected and source-asserted |
| 44 / 43 | /book/chapter1#p1.24 | Kamsky - Bacrot, Sofia 2006 was flattened; PDF separates players from Sofía 2006. | Caption association / Medium | Structured subtitle/caption restored |
| 49 / 48 | /book/chapter2#p2.20 | App showed a different rook/pawn/king position; PDF reconstructs as 1r6/8/8/8/1P1k4/K7/8/7R. | Diagram / High | Corrected; printed 1.Rh5! replayed |
| 50 / 49 | /book/chapter2#p2.26 | Black pawn d3 was missing. | Diagram / High | Added and square-map tested |
| 52 / 51 | /book/chapter3#p3.1 | White king a6; PDF shows a7. | Diagram / High | Corrected |
| 53 / 52 | /book/chapter3#p3.2 | Black pawn/king d2/d1; PDF shows c2/c1. | Diagram / High | Corrected; branch associations repaired |
| 57 / 56 | /book/chapter3 | App normalized the printed “the essential ... part ... are” to “is.” | Exact copy / Low | Printed wording restored |
| 58 / 57 | /book/chapter3#p3.8 | Knight/pawn f3/h3; PDF shows f2/h2; counters also drifted. | Diagram / High | Corrected and replayed |
| 59 / 58 | /book/chapter3#p3.10 | Black king e8; PDF shows d8. | Diagram / High | Corrected |
| 62 / 61 | /book/chapter4#p4.4 | App said White to move and 4.Qg8; PDF shows Black to move and 4.Kg8. | Turn/transcription / High | Corrected and branch-tested |
| 65 / 64 | /book/chapter4 | 1...Ka7+ and 2...Kb8+ were king-glyph errors; PDF prints Qa7+ and Qb8+. | Transcription / High | Corrected |
| 66 / 65 | /book/chapter4#p4.10 | White queen e4; PDF shows e3. | Diagram / High | Corrected |
| 67 / 66 | /book/chapter4#p4.11 | Legacy extraction provenance claimed queen e3 although the PDF/app board has e2. | Provenance / Medium | Extraction record corrected and validated |
| 78, 89, 101, 111, 116 / 77, 88, 100, 110, 115 | Chapters 5, 6, 8, 9 analysis diagrams | Printed Analysis diagram labels were ordinary captions or omitted their numbers for 5.10, 6.7, 8.6, 9.8, 9.13, and 9.14. | Hierarchy/association / Medium | Exact display labels restored |
| 88, 94, 100, 115 / 87, 93, 99, 114 | #p6.6, #p7.5, #p8.5, #p9.12 | Two-line player/event captions were flattened into invented comma-separated lines. | Caption association / Medium | Subtitle/caption pairs restored |
| 90 / 89 | /book/chapter7 | App normalized the printed “reasonably frequency”; PDF wording was restored. | Exact copy / Low | Fixed and forbidden-normalization test added |
| 102, 104 / 101, 103 | /book/chapter8#p8.7a and #p8.7b | PDF visibly labels two distinct diagrams Position 8.7; app exposed internal disambiguators 8.7a/8.7b. | Presentation/association / Medium | Unique anchors retained; both visible labels restored |
| 103 / 102 | Chapter 8 knight-blockades series 1–2 | First two diagrams had shifted kings, knight, and pawn placements. | Diagram / High | Both FENs reconstructed and tested |
| 108 / 107 | /book/chapter9, immediately before #p9.5 | App normalized the printed “the right positional for the defending bishop” to “right position.” | Exact copy / Low | Printed wording restored |
| 113 / 112 | /book/chapter9#p9.10 | PDF visibly truncates the label to Position 9.1; app exposed normalized internal 9.10. | Presentation/association / Medium | Safe internal ID retained; printed label restored |
| 120 / 119 | /book/chapter9#p9.18 | White king g2; PDF shows f2, which is required by 2.Kg3. | Diagram / High | Corrected and line replayed through 9...Ke6 |
| 121 / 120 | /book/chapter9#p9.20 | White king c3 instead of c4; app also hid PDF’s truncated Position 9.2 label. | Diagram/association / High | FEN and display label corrected; replayed through 8.Bd5 |
| 125–153 / 124–152 | /book/chapter10 | Systemic chess-font drift changed rook moves into king moves, stripped captures/ellipses/evaluations, and left many variations attached to the wrong state. | Transcription/move-tree / High | Page-level repairs listed below; all 940 tokens now legal/associated or deliberately source-nonplayable |
| 135 / 134 | /book/chapter10#p10.11 | Board used a White rook where PDF has Black’s rook. | Diagram / High | FEN corrected |
| 149 / 148 | /book/chapter10#p10.24 | All 15 printed mined/drawing-zone stars were absent: e6, f5, g5, h5, f4, g4, h4, e3, g3, h3, d2, e2, f2, g2, h2. Positions 10.22, 10.23, and 10.26 were separately verified and already had their present markers. | Diagram / High | Position 10.24 overlay restored and tested |
| 154–169 / 153–168 | /book/chapter11 | Rook glyphs, checks, captures, waiting moves, side-to-move, and variation attachment were materially corrupt; 17...Kh7! was missing. | Transcription/move-tree / High | Reconstructed page by page; 648 tokens pass |
| 158 / 157 | /book/chapter11#p11.4 | Wrong rook colour and wrong side to move. | Diagram/turn / High | FEN corrected and main line replayed |
| 167–169 / 166–168 | #p11.12–#p11.14 | PDF prints Position 11.12 on two diagrams; app failed to preserve the visible duplication and provenance coverage. | Association/provenance / Medium | Unique IDs retained, display duplication and all provenance restored |
| 156, 162, 179–181 / 155, 161, 178–180 | #p11.3, #p11.6, #p12.11–#p12.13 | Printed study/game metadata was flattened or missing: Kolesnikov–Bocharov / Sochi 2004; Gligoric–Smyslov / Moscow 1947; Duras 1905; Réti’s study / Réti; Ljubojevic–Browne / Amsterdam 1972. | Caption association / Medium | Structured metadata restored |
| 176, 180, 185, 198 / 175, 179, 184, 197 | #p12.8, route-count diagram after #p12.12, #p12.18, #p12.33 | Missing visual semantics: successful 12.8 route/star, complete 18-label multiple-route diagram, both 12.18 arrows, and 12.33 floating-square outline. | Diagram / High | Structured overlays restored and tested |
| 176 / 175 | /book/chapter12#p12.8 | A route/key-square star at b4 was misclassified as a white pawn. | Diagram / High | Phantom pawn removed; 6.Kb4 now legal |
| 201 / 200 | /book/chapter12#p12.38 | App printed 4.Ke5 Kh6; PDF visibly prints 4.Kxe5 Kxh6. | Transcription / High | Captures restored and downstream replayed through 8.Kc6 |
| 206 / 205 | #p13.1–#p13.4 | Three printed instructional diagrams and their star markers were omitted; 13.4 also contained corrupt “See Position 13.22. 13.3.” text. | Diagram/copy / High | Sequence/markers restored; text corrected to See Position 13.3 |
| 208 / 207 | /book/chapter13#p13.5 | Printed V/W knight route c7-d5-e7-f5-g7 and subtitle were missing. | Diagram / High | Route and subtitle restored/tested |
| 211–214 / 210–213 | Chapter 13 around #p13.7–#p13.11 | Four standalone printed headings were absent or attached to the wrong following material. | Hierarchy/association / Medium | Philidor and three Lolli headings restored in source order |
| 215, 218 / 214, 217 | #p13.12 and #p13.16 | Budnikov–Novik / Moscow 1991 and García González–Balashov / Leningrad 1977 were flattened or missing. | Caption association / Medium | Structured game metadata restored |
| 221 / 220 | #p13.19–#p13.20 | Text said g5 instead of printed g8; extraction provenance for 13.20 encoded star squares as pieces/false markers although the app’s piece FEN was already correct. | Copy/provenance / High | Wording and provenance corrected; a2/b3/c4/e6 stars restored |
| 225 / 224 | Ending 99 | Müller & Lamprecht was normalized. | Exact copy / Low | Name restored |
| 229 / 228 | Ending 100, #p13.29–#p13.30 vicinity | Two Kb5 OCR transcriptions where PDF prints Kb8. | Transcription / High | Moves restored and replayed |
| 230, 232–234 / 229, 231–233 | Final Tests 14.05, 14.17, 14.19, 14.20, 14.23, 14.25, 14.30 | Demonstrated board drift was: shifted clusters in 14.05/14.17; reversed king colours in 14.19; black king e1→d1 in 14.20; bishop/rook one rank low in 14.23; materially wrong 14.25 FEN; and missing white c5 pawn in 14.30. | Diagram / High | Affected FENs reconstructed and solution openings replayed |
| 236, 238, 240 / 235, 237, 239 | Final Test solutions 14.08, 14.24, 14.32 | Moreno-Viñal, Domínguez-Bruzón, and Andrés-De la Villa were normalized/corrupted. | Exact copy / Low | Accents restored |
| 236–240 / 235–239 | Final Test solutions | Promotions, rook/bishop/king glyphs, captures, ellipses, evaluations, and Z/ep annotations were repeatedly corrupt or omitted. | Transcription / High | Exact page-level corrections below; 1,088 solution tokens pass |
| 241 / 240 | /book/chapter15 | Appendix hierarchy dropped the visible “1.” from “1. Fortresses.” | Hierarchy / Medium | Heading restored |
| 241–247 / 240–246 | /book/chapter15 | All 20 fortress/Troitsky boards, including the eight Troitsky markers, were visually verified and already matched; no marker repair is claimed. | Verification / — | Matched |
| Chapter-opening pages 28, 46, 52, 60, 69, 84, 90, 97, 105, 124, 154, 170, 205, 230, 241 | All chapter routes | App omitted printed chapter-number prefixes 1. through 15. | Hierarchy / Medium | Exact visible prefixes restored; selector labels unchanged |
| 248–249 / 247–248 | /book/bibliography | Names, headings, and exact title/publisher copy included accent and association drift. | Exact copy/hierarchy / Low | All nine entries and prose restored |

### Page-level exact-copy and notation repairs from the adversarial pass

| PDF / print | App location | Rendered evidence: prior app → PDF | Type / severity |
|---|---|---|---|
| 18 / 17 | Introduction | Cheron → Chéron. | Exact copy / Low |
| 91–92 / 90–91 | Chapter 7 | Restored rear-opposition paragraph break; now → Now; pawn. → pawn!; diagonal, a4-e8 → diagonal (a4-e8). | Exact copy / Low |
| 93 / 92 | Chapter 7 | Restored “Now we can draw some important conclusions.”; retained the author’s printed “It think.” | Exact copy / Low |
| 94 / 93 | Chapter 7 | “make sure that it is impossible” → printed “make sure that is impossible.” | Exact copy / Low |
| 96 / 95 | Chapter 7 | 3...Ke8! → 3...Ke8!=. | Notation / High |
| 97 / 96 | Chapter 8 | Restored “(see statistics),” “(most positions),” and “Bishop + Pawn vs. Bishop: 47% wins; here just 25%.” | Copy/hierarchy / Medium |
| 98 / 97 | Chapter 8 | Restored “(4 squares long),” “(...Nd5, ...Ne3),” 4.Kd7 ... 4...Kf1, the repeated four-square explanation, and First/Second point capitalization. | Copy/notation / High |
| 100 / 99 | #p8.4 | Black king f1 → printed g1. | Diagram / High |
| 101 / 100 | Chapter 8 | Restored □ and Z markers, ellipsis, the Kd1 preference, and 6...Nb2Z. | Notation / High |
| 102 / 101 | Chapter 8 | Restored parentheses around the knight-fork exception and paired dashes around “sometimes complicated.” | Exact copy / Low |
| 103 / 102 | Chapter 8 | Recommended Exercise: Look → look; conclusion restored as a two-item Perpetual/Stalemate list; pawn-square explanation parenthesized. | Copy/hierarchy / Medium |
| 104 / 103 | Chapter 8 | 5.Ba4+ Kc5 → 5.Ba4+ 5...Kc5; restored the 8...Kd5? exception, 6.Be4Z+-, and Zugzwang! | Notation / High |
| 107 / 106 | Chapter 9 | “There is one exception.” → printed colon. | Exact copy / Low |
| 109 / 108 | Chapter 9 | c8 or d7 → c8 (or d7); removed extra “the” before 4th rank; 3.Bd2?/5.Be3 → 3.Kd2?/5.Ke3; added 5.Kc3Z; Finally → and finally. | Transcription / High |
| 111 / 110 | Chapter 9 | Restored “(avoiding blockade)”; allows wins → always wins; removed extra “the” before 5th rank; added 5.Bb3Z and 9.Bc4Z. | Copy/notation / High |
| 112 / 111 | Chapter 9 | Andre → André. | Exact copy / Low |
| 113 / 112 | Chapter 9 | “Here the defensive procedure is simple too.” → printed colon. | Exact copy / Low |
| 114 / 113 | Chapter 9 conclusion | “Two bishop’s pawns, c- and f-files,” → printed parenthetical form. | Exact copy / Low |
| 115 / 114 | Chapter 9 | 3.Bd1 → 3.Kd1; left-hand → left hand. | Transcription / High |
| 116 / 115 | Chapter 9 | Restored “as we will see in the next examples.” | Exact copy / Low |
| 117 / 116 | Chapter 9 | Added 3.Be3Z and 8.e6+!+-; restored parenthetical note before 18...Kc6. | Notation / High |
| 118 / 117 | Chapter 9 | Restored printed parenthetical/hyphenation for a-/d- and h-/e-pawns and the rook-pawn caveat. | Exact copy / Low |
| 119 / 118 | Chapter 9 | Added 4.Bc8Z and 8.Be6Z. | Notation / High |
| 120 / 119 | Chapter 9 | Added 9.Be5Z. | Notation / High |
| 122 / 121 | Chapter 9 | Added 6.Bb7Z, 11.Bb7Z, and 15.Bd5Z. | Notation / High |
| 125 / 124 | Chapter 10 | 3...Kd8? → 3...Rd8?. | Transcription / High |
| 128 / 127 | Chapter 10 | 3.Ra8. → 3.Ra1.; 8.Rd4+ → printed 8.Rd4+− evaluation. | Transcription / High |
| 131 / 130 | Chapter 10 | 1...Rf2, → printed unnumbered ...Rf2,. | Association / Medium |
| 132 / 131 | Chapter 10 | 4.Rh7+! → 4.Rf7+!; 4...Re8 → Ke8; 7...Kd5 → 7...Kd8. | Transcription / High |
| 133 / 132 | Chapter 10 | Restored period after strategy. | Exact copy / Low |
| 134 / 133 | Chapter 10 | Repaired evaluation attachment: Ke6!=, 4.Rd8++-, Ra8!=. | Notation / High |
| 135 / 134 | Chapter 10 | 5.Ra1 → 5...Ra1; we’re → we are; restored Kf6Z, Kd7Z, Ke7Z. | Transcription / High |
| 136 / 135 | Chapter 10 | 6...Re7?! → 6...Rxe7?!; “Summary of section” → “Summary of Section 2.” | Transcription/hierarchy / High |
| 138 / 137 | Chapter 10 | Kd8/Rc5 drift → printed Rd8/Rc8; evaluation spacing restored. | Transcription / High |
| 139 / 138 | Chapter 10 | Removed invented period after 5.Ka6; 11.Kb5 → 11.Rb5. | Transcription / High |
| 140 / 139 | Chapter 10 | Kc8!? → Rc8!?. | Transcription / High |
| 143 / 142 | Chapter 10 | Restored standalone 1...Ra8 without invented period. | Exact copy / Low |
| 144 / 143 | Chapter 10 | “disposal.” → printed “disposal..”; 4.Ke5 → 4.Re5; restored Kf4!. | Copy/transcription / High |
| 145 / 144 | Chapter 10 | 1...Kc7 → 1...Rc7; 4.Kd6+ → 4.Rd6+. | Transcription / High |
| 146 / 145 | Chapter 10 | Removed period after Kf4; sentence-internal We → we. | Exact copy / Low |
| 147 / 146 | Chapter 10 | Evaluation attachment repaired: 2.Rh8!+- and 2.Re8++-. | Notation / High |
| 148 / 147 | Chapter 10 | g7 -h7 → g7-h7; 6...Rb7+ → 6...Rb1+; Ra6!= restored. | Transcription / High |
| 149 / 148 | Chapter 10 | Four Kb7 rook-glyph errors → Rb7 variants. | Transcription / High |
| 152 / 151 | Chapter 10 | Rb5/Rb6 → Kb5/Kb6; a8=Q → printed a8Q. | Transcription / High |
| 154 / 153 | Chapter 11 | “First scenario” detached from Position 11.1 and restored as a standalone heading. | Hierarchy / Medium |
| 155 / 154 | Chapter 11 | Legitimate line 3...Kc8!/5.Kc6 → 3...Rc8!/5.Rc6+; a separate printed illegal 3...Rc8! remains accepted. | Transcription / High |
| 156 / 155 | Chapter 11 | 3.Kc6/4.Rb7+ → 3.Rh6/4.Rh7+; Kf3 → Rf3; second-rank → Second-rank. | Transcription / High |
| 157 / 156 | Chapter 11 | Kb2 → Rb2; 1...Rb7? → 1.Rb7?; 3.Rg7 → 3.Rxg7; gxf1=Q → printed gxf1Q. | Transcription / High |
| 158 / 157 | Chapter 11 | Kb8/Kg7/Rxg7 drift → Rb8/Rg7/Kxh7; f8=Q → printed f8Q. | Transcription / High |
| 159 / 158 | Chapter 11 | Ra8+ → Ra5+; two Kg7 rook-glyph errors → Rg7. | Transcription / High |
| 160–161 / 159–160 | Chapter 11 | Four series headings restored with final periods. | Exact copy / Low |
| 162 / 161 | Chapter 11 | Kg6/Kg5/Kg7/Kg8 rook-glyph errors → Rg6/Rg5/Rg7/Rg8. | Transcription / High |
| 163 / 162 | Chapter 11 | Removed period after standalone 3.Rc5; Kg6 → Rg6; two Kh5= moves → Kxh5=. | Transcription / High |
| 164 / 163 | Chapter 11 | Two 23.Ke6 → 23.Re6; 23...Rh2 → 23...Ra2; Position 11.9 White-to-move → Black-to-move; source dash restored. | Transcription/turn / High |
| 166 / 165 | Chapter 11 | 3...Kg5?? → 3...Kxg5??. | Transcription / High |
| 167 / 166 | Chapter 11 | 2.Ke6+! → 2.Re6+!. | Transcription / High |
| 169 / 168 | Chapter 11 | Rg4 → Rf4; 6...Rh7 → 6...Kh7. | Transcription / High |
| 171 / 170 | Chapter 12 | we’re → printed We are. | Exact copy / Low |
| 173 / 172 | Chapter 12 | Restored missing comma after them. | Exact copy / Low |
| 176–177 / 175–176 | Chapter 12 | we’re → printed we are on both pages. | Exact copy / Low |
| 184 / 183 | Chapter 12 | Bahr → W. Bahr. | Exact copy / Low |
| 186 / 185 | Chapter 12 | “8.Kc6...trapping” → printed “8.Kc6 trapping.” | Exact copy / Low |
| 189 / 188 | Chapter 12 | Muller → Müller. | Exact copy / Low |
| 189 / 188 | #p12.24 | Added white pawn a5 and corresponding-square labels d8/c7/d6/c5. | Diagram / High |
| 191 / 190 | #p12.25 | Black pawn/king h6/f5 → h7/f6. | Diagram / High |
| 192–193 / 191–192 | Chapter 12 | Duplicate 4.g3 continuation was attached to the wrong board/state. | Move-tree association / High |
| 194 / 193 | #p12.29 | Missing white pawn g2 added. The later 1...Kg6 2.Kg4 continuation had been associated with the sibling 1.h4 variation; the PDF resumes the 1.h3 main line after separately discussing 1.h4, 1.g3, and 1.g4?. | Diagram/move-tree association / High |
| 197 / 196 | #p12.32 | Missing white pawn g6 added; a5-d5-d2-a2-a5 outline restored. | Diagram / High |
| 198 / 197 | #p12.33 | Pawn formation shifted to printed rank: black a6/e6/g6 and white g5/h6; +− evaluation parsing repaired. | Diagram/notation / High |
| 199 / 198 | Chapter 12 | “as in the examples” → “as in all the examples”; 12.34/12.35 outlines restored. | Copy/diagram / High |
| 200 / 199 | Chapter 12 | Position 12.36/12.37 pawn-square outlines restored. | Diagram / High |
| 207 / 206 | Chapter 13 | 9.Kc5 → 9.Bc5; we’re → we are; spacing before ...Kd7 restored. | Transcription / High |
| 210–211 / 209–210 | Chapter 13 | 3...Ke3 → 3...Re3; 8.Kg4 → 8.Rg4; branch repaired. | Transcription/move-tree / High |
| 211 / 210 | Chapter 13 | 6.Rh7! → 6.Rf7!, restoring the line through 7.Rf8+. | Transcription / High |
| 212 / 211 | Chapter 13 | Five king-glyph errors → bishop moves Be6, Bd5, Ba4, Bd7, Bc4. | Transcription / High |
| 214 / 213 | Chapter 13 | Restored standalone 10...Rf1!; 14.Ke6 → 14.Be6. | Transcription / High |
| 215 / 214 | Chapter 13 | 9.Kd5!? → 9.Bd5!?. | Transcription / High |
| 216 / 215 | #p13.13 | White rook a5 → printed black rook a5. | Diagram / High |
| 217 / 216 | Chapter 13 | 33.Ke4/40.Be6+/43.Ke4 → 33.Be4/40.Re6+/43.Be4. The printed 38.Rd7+ Kf6 remains unchanged. | Transcription / High |
| 218 / 217 | Chapter 13 | 2.Kf4 → 2.Bf4; duplicate prose ...Rg2 no longer creates a fake move. | Transcription/parser / High |
| 219 / 218 | Chapter 13 | 7.Kg5/9.Kf4+ → 7.Bg5/9.Bf4+; restored 14...Kd1; 15.Ka3 → 15.Ra3. | Transcription / High |
| 220 / 219 | Chapter 13 | 22.Rxe4 → 22.Re4. | Transcription / High |
| 221 / 220 | Chapter 13 | The printed variation 8.Kg5? 8...Kg7= was text-only; it is now deterministically playable. | Move-tree association / High |
| 223 / 222 | Chapter 13 | Rank punctuation/evaluation spacing repaired; Position 13.23 White-to-move → Black-to-move. | Copy/turn / High |
| 227 / 226 | Chapter 13 | 5...Kd6 → 5...Rd6, restoring 6.Qb7+. | Transcription / High |
| 228 / 227 | Chapter 13 | rank → printed file. | Exact copy / Low |
| 229 / 228 | Chapter 13 | 10...Ra7? → 10...Ka7?; 12...Rb8 → 12...Rb5, restoring 13.Qd7+. | Transcription / High |
| 232 / 231 | #p14.14 | White rook a4 → a3; fullmove 1 → 63. | Diagram/provenance / High |
| 234 / 233 | #p14.28 | White rook h5 → f6. | Diagram / High |
| 236 / 235 | Final solutions | 14.06 65.g3!+- spacing; 14.10 b8Q and 61.Kg3; 14.12 b8Q+. | Transcription / High |
| 237 / 236 | Final solutions | 14.15 ellipses; 14.16 h8N+; 14.17 six king glyphs → bishops and printed “with idea”; 14.18 a1N+. | Transcription / High |
| 238 / 237 | Final solutions | 14.21 e8N+= and 6...Rd4+−+; 14.23 Bxg3 and printed promotion forms. | Transcription/parser / High |
| 239 / 238 | Final solutions | 14.27 three 83.Bd5 → 83.Kd5; 14.28 promotion spacing; 14.29 Kc3!Z and 70...Re6+−+. | Transcription/parser / High |
| 240 / 239 | Final solutions | 14.31 a8Q; 14.34 ...a4-a3 spacing, axb6ep, and b8Q=. | Transcription / High |
| 246 / 245 | Chapter 15 | Missing “2.” restored in Different material relations; Muller → Müller. | Hierarchy/copy / Medium |
| 248 / 247 | Bibliography | Ramon → Ramón. | Exact copy / Low |
| 249 / 248 | Bibliography | Muller → Müller in two headings and prose. | Exact copy / Low |

### Playback and association defect scopes

The generic parser had silently missed or mis-associated variations. The repaired source now contains **340 deterministic segments, 22 exact anchors, two alternate FENs, one related-position link, and one explicit section scope across 69 source scopes**. These are data associations, not invented book moves.

| Chapter / PDF evidence | Affected source scopes | Disposition |
|---|---|---|
| Ch1 PDF 34 | Position 1.9: alternate FEN. | Fixed/tested |
| Ch3 PDF 53, 58 | 3.2: 1 anchor; 3.8/3.7: 3 segments, 1 anchor, related-position link. | Fixed/tested |
| Ch4 PDF 62 | 4.4: 2 records. | Fixed/tested |
| Ch5 PDF 77–78 | 5.9 commentary scope. | Fixed/tested |
| Ch7 PDF 93 | 7.4: 2 anchors. | Fixed/tested |
| Ch8 PDF 100, 102 | 8.5: 4 anchors; 8.7a: 4 records. | Fixed/tested |
| Ch9 PDF 108, 109, 112, 115 | 9.4: 5; 9.6: 7 anchors; 9.9: 2 anchors; 9.12: 3 anchors. | Fixed/tested |
| Ch10 PDF 125, 127, 129–131, 133–136, 138, 140, 142, 144, 147, 149, 151, 153 | Positions 10.1 (4), 10.3 (3), 10.4 (2), 10.6 (3), 10.7 (15), 10.9 (10), 10.10 (3), 10.11 (15), 10.12 (2), 10.13 (8), 10.14 (1), 10.15 (3), 10.17 (3), 10.19 (6), 10.20 (3), 10.23 (7), 10.24 (19), 10.26 (17), 10.27 (8). | Fixed/tested |
| Ch11 PDF 154–166 | 11.1 (15), 11.2 (5), 11.4 (10), 11.5 (21), series 4.1 (1), 11.6 (3), 11.7 (7), 11.8 (9), 11.9 (9), 11.10 (2 anchors). | Fixed/tested |
| Ch12 PDF 176, 181, 183, 186, 191–192, 194, 197, 201 | 12.8 (3), 12.14 (1), 12.16 (3), 12.19 (6), 12.25 (5), 12.27 (10), 12.29 (5 segments preserving the main-line/sibling associations), 12.32 (5), 12.38 (2). | Fixed/tested |
| Ch13 PDF 206–229 | 13.4 (4), 13.5 (1), 13.6 (1), 13.7 (2), 13.8 (5), 13.10 (7), 13.12 (1), 13.15 (11), 13.16 (1), 13.17 (10), 13.18 (7), 13.19 (7), 13.22 (1), 13.23 (4), 13.28 (1), 13.29 (1), 13.30 (1). | Fixed/tested |
| Final Test PDF 234/238 and 235/240 | 14.25 prompt/solution (4); 14.34 prompt/solution (5). | Fixed/tested |

Systemic parser defects were also repaired:

- +− is an evaluation, not a false check; +−+ retains check plus the −+ evaluation.
- Promotions printed without an equals sign normalize to legal playback without changing displayed source.
- Z, □, and ep no longer break continuation parsing.
- Prose plans, routes, and duplicated references no longer become fake moves.
- Published illegal continuations remain visible but deliberately non-playable.

## Accepted deviations

There are **13 deviation IDs covering 20 ledger units**. These are source-visible, explicitly documented, or presentation-only; none is an unexplained app alteration.

| PDF / print | App location | Accepted difference and justification | Units |
|---|---|---|---:|
| 1–4 / unnumbered | /book/about | Cover, back-cover, half-title, and title-page identity/marketing copy are preserved semantically; photographic composition, barcode, publisher marks, isolated-page spacing, and print layout are not recreated. | 4 |
| 5 / unnumbered | /book/about | The full “All rights reserved…” paragraph is intentionally hidden. Author, edition, publisher, copyright, publisher link, photo credit, production credits, and ISBN remain. | 1 |
| 6–9 / unnumbered | About table of contents | Four printed contents pages become one linked semantic TOC in source order; dot leaders and printed page numbers become routes/deep links. | 4 |
| 27 / 26 | Reader transition | Visually blank verso omitted. | 1 |
| 144 / 143 | Chapter 10 | PDF repeats 3.Rh5 while the rook already occupies h5. Exact source remains visible; null move is non-playable and continuation resumes from the unchanged board. | 1 |
| 150 / 149 | Chapter 10 | PDF prints 7...Ke6 8.Kc4 although White’s king is on e4. Exact source retained; illegal jump non-playable. | 1 |
| 152 / 151 | Chapter 10 | PDF prints 8.Rb5? Rh8+ even though Rb5 checks Black’s king. Exact source retained; impossible continuation non-playable. | 1 |
| 155 / 154 | Chapter 11 | One printed 3...Rc8! cannot be played by the rook on g1. Exact source retained and non-playable. | 1 |
| 174 / 173 | /book/chapter12#p12.6 | Book analyzes both turns and gives no single turn. App uses White as a neutral analysis default. | 1 |
| 184 / 183 | Chapter 12, Position 12.16 line | PDF prints 1...Kxb4 although b4 is empty. Exact notation retained/non-playable; the legal downstream state is staged from king b4 without silently rewriting the move. | 1 |
| 185 / 184 | /book/chapter12#p12.18 | Diagram is after 1.b4? and therefore Black to move, while the continuation starts 1.Kb3. Diagram preserved; White continuation staged separately. | 1 |
| 186 / 185 | Chapter 12, Position 12.19 line | PDF’s prospective 4...Kb5 jumps Black’s king d4→b5. Exact notation retained/non-playable. | 1 |
| 234 / 233 | /book/chapter14#p14.29 and its page copy | Prompt prints “Black to move. Can he draw?” but the solution begins White’s move 69. App prompt is simply “White to move. Can he draw?”; About neutrally cites both pages and deep-links the problem. | 2 |

The Position 12.8 extraction report still records an ambiguous classifier warning for a putative b4 pawn. The promoted FEN correctly omits that phantom pawn; this is retained as extraction provenance, not an unresolved fidelity item.

## Required regression checks

- **Chapter 13, Ending 95 — PDF 217 / printed 216:** the rendered page visibly prints **38.Rd7+ Kf6**. The app displays that exact line; neither 38.Kd7+ nor an “author error” description appears.
- **Position 12.29 — PDF 194 / printed 193:** the later **1...Kg6 2.Kg4** continuation resumes the **1.h3** main line. The earlier **1.h4 ...Kg6 2.Kg4+−** variation remains separate, as do the **1.g3** and **1.g4?** alternatives.
- **Final Test 14.29 — prompt PDF 234 / printed 233; solution PDF 239 / printed 238:** the problem prompt is **White to move. Can he draw?** The About disclosure is neutral and includes the page references and deep link.
- **Rights treatment — PDF 5:** the full rights paragraph is absent from About; all required publication metadata and credits remain.
- **Mate:** the entry remains present and marked coming soon.

## Unresolved or blocked items

**None.** The ledger contains zero unresolved and zero blocked units. No rendered source was too ambiguous to decide after high-resolution reinspection. Published illegalities are not “corrected”; they are the accepted deviations listed above.

## Presentation and usability audit

### Source-adjacent presentation repairs made

- About now carries the subtitle, source front matter, publication metadata, linked TOC, and the neutral Final Test 14.29 disclosure.
- A table no longer renders a caption when the PDF has none.
- Hyphenated deep-link anchors resolve correctly.
- Source overlays support the restored paths, arrows, squares, and markers.
- Printed board orientation and visible coordinates are preserved for all 337 boards.

### Final interaction evidence

Desktop was checked at 1280 px and mobile at 390 × 844:

- About metadata, credits, TOC, and Mate entry render correctly; the rights paragraph is absent. “Note on this digital edition” contains exactly one neutral Final Test 14.29 disclosure, both prompt/solution page references, one deep link, and no Chapter 12 note links.
- Ending 95 deep-links to the exact line 38.Rd7+ Kf6.
- Position 12.8 shows the star at b4, no phantom pawn, and playable 6.Kb4.
- Position 12.29 keeps the later 1...Kg6 2.Kg4 on the 1.h3 main line: the active path is `h3 Kg6 Kg4`, the board has White king g4 and pawns g2/h3, and Previous/Next traverses that exact ancestry. The separate 1.h4 variation retains `h4 Kg6 Kg4` and its h4 pawn state.
- Position 12.38 plays 4.Kxe5 Kxh6 with the captured pawn removed.
- Position 13.19 plays the restored 8.Kg5? 8...Kg7= branch to the correct final squares.
- Final Test 14.29 deep-links to the corrected prompt, reveals its solution, and plays 69.Ke3.
- Control order is Lichess, previous arrow, Reset, next arrow. Previous/next/reset, keyboard navigation, focus restoration, solution reveal, and browser history work.
- Generated Lichess URL carries the correct FEN/PGN.
- In-page expansion reaches 688 × 688 at desktop, Escape restores the board, and focus returns to Expand.
- At 390 px the audited Final Test 14.29 view has no horizontal overflow, internal position scroller, clipping, or overlapping controls; notation is 16/24 px and readable.
- Console audit found zero errors or warnings.

### Explicitly excluded product areas, unchanged

These findings are usability/quality-of-life observations, **not source-fidelity defects**, and no implementation changes were made in them:

- **P1.1:** nested long-commentary scrolling.
- **P1.2:** mobile board/card sizing; the audited board is about 166 px wide.
- **P1.7:** screen-reader descriptions of position and playback state.
- **P1.8:** overall typography and visual direction.
- **P1.9:** whole-book payload/loading/rendering performance.

No changes were made to ChapterViewer, board/card layout, accessibility output, or loading strategy. The only style change is seven lines for the restored front-matter subtitle. These areas can be improved later if desired, but were explicitly out of scope and are not blockers under this audit’s release rules.

## Automated gates and exact results

Automated checks preserve the completed visual comparison; they did not substitute for it.

| Command / check | Exact result |
|---|---|
| python3 scripts/build_chapter_payload.py | Exit 0. Runtime rebuilt as app/public/app_x/chapter-runtime.118bd353955237b8.json; manifest, filename, embedded content hash, independently recomputed runtime hash, and book source hash all agree. Runtime has 17 parts, 100 endings, 337 positions. |
| npm test (first post-rebuild run) | Exit 1 at the Chapter 12 immutable-source hash pin: expected the pre-repair hash `387bf0ea...`, received the intentional repaired hash `b881e83c...`. The pin was updated; no content assertion failed. |
| npm test (final run) | Exit 0. Routing, source audit/validation, ledger, all regional fidelity suites, parser, structural/source-text/presentation suites passed. **7,093 generated Lichess links** passed. |
| npm run test:content | Exit 0: content audit passed. |
| npm run test:audit-san -- --all | Exit 0: every chapter has strictSanFailures=0 and misses=0. |
| npm run test:audit-san:advisory -- --all | Exit 0: every chapter has misses=0. |
| npm run lint | Exit 0: oxlint clean. |
| npm run build | Exit 0: TypeScript and Vite production build passed; 35 modules, JS 330.35 kB / 102.27 kB gzip, CSS 17.71 kB / 4.06 kB gzip. |
| Browser desktop/mobile pass | All routes/interactions above passed; zero console errors/warnings. |
| git diff --check | Exit 0 after the final report edit. |

Strict/advisory move-token totals:

| Part | Positions | Move tokens | Strict failures | Advisory misses |
|---|---:|---:|---:|---:|
| Introduction | 13 | 1 | 0 | 0 |
| Chapter 1 | 25 | 373 | 0 | 0 |
| Chapter 2 | 26 | 296 | 0 | 0 |
| Chapter 3 | 10 | 159 | 0 | 0 |
| Chapter 4 | 13 | 188 | 0 | 0 |
| Chapter 5 | 24 | 357 | 0 | 0 |
| Chapter 6 | 10 | 192 | 0 | 0 |
| Chapter 7 | 6 | 132 | 0 | 0 |
| Chapter 8 | 11 | 236 | 0 | 0 |
| Chapter 9 | 20 | 467 | 0 | 0 |
| Chapter 10 | 27 | 940 | 0 | 0 |
| Chapter 11 | 23 | 648 | 0 | 0 |
| Chapter 12 | 43 | 799 | 0 | 0 |
| Chapter 13 | 30 | 892 | 0 | 0 |
| Chapter 14 | 36 | 1,088 | 0 | 0 |
| Chapter 15 | 20 | 0 | 0 | 0 |
| Bibliography | 0 | 0 | 0 | 0 |

## Files changed

- .gitignore
- docs/lottaendgames-audit-2026-07-14.md
- app/package.json
- app/public/app_x/chapter-runtime.6b4f915be64620f5.json — removed
- app/public/app_x/chapter-runtime.118bd353955237b8.json — generated replacement
- app/scripts/audit_chapter_san.ts
- app/src/app_x/BookFrontMatter.tsx
- app/src/app_x/TableBlock.tsx
- app/src/app_x/bookSourceAudit.test.ts
- app/src/app_x/bookSourceValidation.test.ts
- app/src/app_x/bookSourceValidation.ts
- app/src/app_x/chapter13SourceFidelity.test.ts
- app/src/app_x/chapterPayloadManifest.ts
- app/src/app_x/chapterRuntimeBuild.ts
- app/src/app_x/chapterTypes.ts
- app/src/app_x/chapters10to12SourceFidelity.test.ts
- app/src/app_x/chapters14to15BibliographySourceFidelity.test.ts
- app/src/app_x/chapters5to9SourceFidelity.test.ts
- app/src/app_x/contentAudit.test.ts
- app/src/app_x/fidelityLedger.test.ts
- app/src/app_x/introChapters1to4SourceFidelity.test.ts
- app/src/app_x/moveParser.test.ts
- app/src/app_x/moveParser.ts
- app/src/app_x/pdf/book.json
- app/src/app_x/pdf/diagram_extraction_report.json
- app/src/app_x/pdf/pdf_structure_audit.json
- app/src/app_x/pdf/source_fidelity_ledger.json
- app/src/app_x/sourceTextAudit.test.ts
- app/src/app_x/styles.css
- app/src/app_x/viewerPresentation.test.tsx
- app/src/routing.test.ts
- app/src/routing.ts
- docs/superpowers/specs/2026-07-15-position-12-29-and-digital-note-repair-design.md
- scripts/rebuild_fidelity_ledger.mjs

No additional release/audit commit was created and nothing was pushed. The only history mutation was the user-requested amendment of the existing accidental local commit to remove its tmp paths. That amended, local-only HEAD already contains part of the audit work; the post-amend correction work described here remains uncommitted.

## Git cleanup requested during the audit

The accidental local, unpushed commit containing temporary PNGs was amended. The reachable branch now contains **zero tmp paths**, origin/main was not changed, tmp/ is ignored, and the local temporary images remain untracked/ignored. The amended-away objects still exist only in the local reflog until ordinary Git expiry/garbage collection; they cannot be pushed from the current branch.

## Release verdict

**Ready to show the author**

There are zero unexplained source differences, zero unresolved or blocked units, zero unresolved critical defects, and every required gate passes. Material drift did exist, but it has been repaired and protected by page-level evidence and regression coverage.
