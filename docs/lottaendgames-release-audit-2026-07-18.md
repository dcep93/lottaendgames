# Lotta Endgames independent release audit

Audit closed: 2026-07-18. Candidate baseline: `d695f5b` on `main`; no commit or push was performed.

The earlier **goal blocked** status was administrative: the audit had repeatedly reached the Codex usage-credit limit and could not continue. It was not a product or fidelity verdict. After credits resumed, the pending audit, repair, browser verification, and release gates were completed.

## 1. Authoritative PDF

- Path: `/Users/danielcepeda/repos/lottaendgames/app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf`
- Edition: 2008 edition
- Pages: 249
- File size: 14,360,268 bytes
- Page geometry/version: A4, PDF 1.5
- SHA-256: `7610f6c98410ab22a6dd41f97a1f4e0b6dfeeb18ff8eeb4eac55b80a22bf293a`

## 2. Independently derived inventory

The first-to-last rendered-page inventory closes **586 units** across all **249 PDF pages**: **239 page-copy units**, **337 board/problem/diagram units**, **9 front-matter units**, and **1 blank unit**. The independently derived 239/337 totals agree with the project expectation; they were not used to pre-fill the inventory.

| Book part | PDF range | Total | Copy/table | Boards/problems/diagrams | Front/blank |
| --- | --- | --- | --- | --- | --- |
| Front matter | PDF 1–9, 27 | 10 | 0 | 0 | 10 |
| Introduction | PDF 10–26 | 30 | 17 | 13 | 0 |
| Chapter 1 — Basic Endings | PDF 28–45 | 43 | 18 | 25 | 0 |
| Chapter 2 — Test | PDF 46–51 | 32 | 6 | 26 | 0 |
| Chapter 3 — Knight vs. Pawn | PDF 52–59 | 18 | 8 | 10 | 0 |
| Chapter 4 — Queen vs. Pawn | PDF 60–68 | 22 | 9 | 13 | 0 |
| Chapter 5 — Rook vs. Pawn | PDF 69–83 | 39 | 15 | 24 | 0 |
| Chapter 6 — Rook vs. 2 Pawns | PDF 84–89 | 16 | 6 | 10 | 0 |
| Chapter 7 — Bishop vs. Pawn | PDF 90–96 | 13 | 7 | 6 | 0 |
| Chapter 8 — Bishop vs. Knight | PDF 97–104 | 19 | 8 | 11 | 0 |
| Chapter 9 — Opposite-coloured Bishops | PDF 105–123 | 39 | 19 | 20 | 0 |
| Chapter 10 — Rook and Pawn vs. Rook | PDF 124–153 | 57 | 30 | 27 | 0 |
| Chapter 11 — Rook + two Pawns vs. Rook | PDF 154–169 | 39 | 16 | 23 | 0 |
| Chapter 12 — Pawn Endings | PDF 170–204 | 78 | 35 | 43 | 0 |
| Chapter 13 — Other Material Relations | PDF 205–229 | 55 | 25 | 30 | 0 |
| Chapter 14 — Final Test | PDF 230–240 | 47 | 11 | 36 | 0 |
| Chapter 15 — Fortresses | PDF 241–247 | 27 | 7 | 20 | 0 |
| Bibliography | PDF 248–249 | 2 | 2 | 0 | 0 |

Unit types:
| Unit type | Count |
| --- | --- |
| bibliography-page-copy | 2 |
| blank-page | 1 |
| chapter-page-copy | 220 |
| diagram | 12 |
| front-matter-page | 9 |
| introduction-page-copy | 16 |
| position | 263 |
| problem | 62 |
| statistics-table-page | 1 |

Final unit classifications: 360 matched; 183 app-defect units; 27 book-error units; 16 accepted-presentation-deviation units; 0 blocked. Every unit has exactly one disposition.

## 3. Batch-by-batch coverage

Each batch has source-first rendered-page records, comparison/repair records, replay results where applicable, and post-fix reconciliation under `tmp/pdfs/lotta-release-audit/`. All batches are closed.

| Batch | Units | Matched | App-defect | Book-error | Accepted | Blocked | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Batch 01 — PDF pages 1–27 | 40 | 22 | 9 | 0 | 9 | 0 | closed |
| Batch 02a — PDF pages 28–45 | 43 | 29 | 10 | 3 | 1 | 0 | closed |
| Batch 02b — PDF pages 46–51 | 32 | 21 | 5 | 0 | 6 | 0 | closed |
| Batch 02c — PDF pages 52–68 | 40 | 22 | 16 | 2 | 0 | 0 | closed |
| Batch 03 — PDF pages 69–83 | 39 | 19 | 20 | 0 | 0 | 0 | closed |
| Batch 04 — PDF pages 84–96 | 29 | 14 | 11 | 4 | 0 | 0 | closed |
| Batch 05 — PDF pages 97–123 | 58 | 27 | 26 | 5 | 0 | 0 | closed |
| Batch 06 — PDF pages 124–153 | 57 | 45 | 10 | 2 | 0 | 0 | closed |
| Batch 07 — PDF pages 154–169 | 39 | 25 | 10 | 4 | 0 | 0 | closed |
| Batch 08 — PDF pages 170–204 | 78 | 51 | 24 | 3 | 0 | 0 | closed |
| Batch 09 — PDF pages 205–229 | 55 | 25 | 28 | 2 | 0 | 0 | closed |
| Batch 10 — PDF pages 230–240 | 47 | 32 | 13 | 2 | 0 | 0 | closed |
| Batch 11 — PDF pages 241–249 | 29 | 28 | 1 | 0 | 0 | 0 | closed |

## 4. App defects found and repaired

The audit recorded **19 app-defect findings affecting 183 units**. Every affected unit, exact field comparison, FEN/legality record, disposition, and post-fix evidence remains individually enumerated in the canonical ledger. The table below includes every finding; none is omitted.

| Finding | Severity | PDF pages | App locations | Evidence | Repair | Regression | Final |
| --- | --- | --- | --- | --- | --- | --- | --- |
| b01-f-solutions-chapter2 | medium | 6 | /book/about | Fresh PDF page 6 shows a subordinate “Solutions” row with printed destination 49 after Chapter 2; the pre-fix About contents omitted that row. | Added a subordinate Solutions link after Chapter 2 targeting /book/chapter2#p2.01-solution. | app/src/app_x/viewerPresentation.test.tsx<br>app/src/routing.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b01-f-solutions-chapter14 | medium | 9 | /book/about | Fresh PDF page 9 shows a subordinate “Solutions” row with printed destination 235 after Chapter 14; the pre-fix About contents omitted that row. | Added a subordinate Solutions link after Chapter 14 targeting /book/chapter14#p14.01-solution. | app/src/app_x/viewerPresentation.test.tsx<br>app/src/routing.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b01-f-instructional-diagram-anchors | medium | 21, 22, 23, 24 | /book/intro#pintro-rook-mobility<br>/book/intro#pintro-bishop-mobility<br>/book/intro#pintro-queen-mobility<br>/book/intro#pintro-knight-mobility<br>/book/intro#pintro-knight-routes<br>/book/intro#pintro-king-routes<br>/book/intro#pintro-knight-domination | All seven fresh source diagrams are distinct labeled objects, while pre-fix #p… diagram links were retained by routing but had no matching figure id in the DOM. | Applied bookPositionAnchorId(number) to every InstructionalDiagram figure. | app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b01-f-knight-route-origins | medium | 22 | /book/intro#pintro-knight-routes | Fresh 400 dpi inspection distinguishes roman distances from a1 and italic distances from g2; pre-fix metadata misattributed f8/g7/h6 and rendered every numeral with one style. | Corrected all 16 marker meanings and applied label-italic to the nine g2-origin values while preserving roman a1 values. | app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b01-f-domination-dividers | medium | 24 | /book/intro#pintro-knight-domination | Fresh 400 dpi inspection shows thick d/e and 4/5 dividers separating four independent domination examples; the pre-fix board presented one undivided composite. | Added quadrantDividers metadata and centered SVG vertical/horizontal divider overlays. | app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b02a-f-repaired-app-fidelity | high | 29, 34, 36, 39, 42, 44, 45 | /book/chapter1<br>/book/chapter1#p1.2<br>/book/chapter1#p1.9<br>/book/chapter1#p1.11<br>/book/chapter1#p1.12<br>/book/chapter1#p1.16<br>/book/chapter1#p1.19<br>/book/chapter1#p1.24 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. wrong continuation parents, a hypothetical-parent collision, inset boundary geometry, asterisk/star semantics, evaluation-token boundaries, and one lexical rewrite | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b02a-f-analysis-1.20-unplayable | high | 43 | /book/chapter1<br>/book/chapter1#p1.20 | PDF 43 / print 42 prints a complete losing Analysis 1.20 line before returning to Position 1.19; the first repair's lone return segment left its 25 preceding moves visible but unplayable. | Added an explicit section-70 playback segment rooted at Position 1.20 so all 25 printed moves remain clickable and source-parented, while the later 4...Re2+ segment returns to Position 1.19. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/moveParser.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b02b-f-repaired-app-fidelity | high | 46, 47, 48, 49 | /book/chapter2#p2.03<br>/book/chapter2#p2.07<br>/book/chapter2#p2.08<br>/book/chapter2#p2.16<br>/book/chapter2#p2.24 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. two wrong solution transcriptions and three wrong starting FENs that broke exact printed playback | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter2SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b02c-f-repaired-app-fidelity | high | 52, 53, 54, 57, 58, 62, 63, 65, 67 | /book/chapter3<br>/book/chapter4<br>/book/chapter3#p3.2<br>/book/chapter3#p3.3<br>/book/chapter3#p3.6<br>/book/chapter3#p3.8<br>/book/chapter4#p4.4<br>/book/chapter4#p4.5<br>/book/chapter4#p4.8<br>/book/chapter4#p4.9<br>/book/chapter4#p4.11<br>/book/chapter4#p4.12 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. six copy/punctuation mismatches, six FEN defects, duplicate analysis labels, a missing boundary, and disconnected source branches | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b03-f-repaired-app-fidelity | high | 70, 71, 73, 74, 76, 77, 79, 80, 81, 82 | /book/chapter5<br>/book/chapter5#p5.2<br>/book/chapter5#pcutting-off-series-1<br>/book/chapter5#pcutting-off-series-2<br>/book/chapter5#pcutting-off-series-3<br>/book/chapter5#p5.5<br>/book/chapter5#pkings-opposed-at-rear-1<br>/book/chapter5#pkings-opposed-at-rear-2<br>/book/chapter5#pkings-opposed-at-rear-3<br>/book/chapter5#p5.8<br>/book/chapter5#p5.9<br>/book/chapter5#p5.13<br>/book/chapter5#p5.14<br>/book/chapter5#plateral-push-1<br>/book/chapter5#plateral-push-2<br>/book/chapter5#plateral-push-3 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. five page-copy units had seven literal changes; 15 boards had star, label, turn, accessibility, or exact source-parent defects | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter5SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b04-f-repaired-app-fidelity | high | 84, 85, 86, 87, 88, 89, 93, 95 | /book/chapter6<br>/book/chapter6#p6.1<br>/book/chapter6#p6.2<br>/book/chapter6#prook-vs-2-pawns-series-1<br>/book/chapter6#prook-vs-2-pawns-series-2<br>/book/chapter6#prook-vs-2-pawns-series-3<br>/book/chapter6#p6.4<br>/book/chapter6#p6.5<br>/book/chapter6#p6.7<br>/book/chapter7#p7.4<br>/book/chapter7#p7.6 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. one punctuation mismatch and ten board units with placement, clock, label, or source-parent/navigation defects | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapters6to7SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b05-f-repaired-app-fidelity | high | 97, 98, 99, 100, 101, 102, 103, 108, 109, 111, 112, 113, 115, 116, 117, 119, 120 | /book/chapter8<br>/book/chapter9<br>/book/chapter8#p8.1<br>/book/chapter8#p8.2<br>/book/chapter8#p8.3<br>/book/chapter8#p8.4<br>/book/chapter8#p8.5<br>/book/chapter8#p8.6<br>/book/chapter8#p8.7<br>/book/chapter8#pknight-blockades-series-1<br>/book/chapter8#pknight-blockades-series-2<br>/book/chapter8#pknight-blockades-series-3<br>/book/chapter9#p9.4<br>/book/chapter9#p9.6<br>/book/chapter9#p9.8<br>/book/chapter9#p9.9<br>/book/chapter9#p9.12<br>/book/chapter9#p9.13<br>/book/chapter9#p9.14<br>/book/chapter9#p9.15<br>/book/chapter9#p9.17 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. seven page-copy units and 19 boards had exact-result, word/piece-letter, FEN clock/turn, label, prose-token, or continuous-navigation defects | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapters8to9SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b06-f-repaired-app-fidelity | high | 125, 127, 130, 132, 135, 141, 147, 149, 151, 153 | /book/chapter10#p10.1<br>/book/chapter10#p10.3<br>/book/chapter10#p10.6<br>/book/chapter10#p10.8<br>/book/chapter10#p10.11<br>/book/chapter10#p10.16<br>/book/chapter10#p10.23<br>/book/chapter10#p10.24<br>/book/chapter10#p10.26<br>/book/chapter10#p10.27 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. two diagram-state defects, one missing analysis label, two app-only rook/king transcription errors, prose-only tokens, and repeated/alternate-root source-parent defects | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter10SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b07-f-repaired-app-fidelity | high | 154, 155, 158, 159, 161, 162, 163, 164, 166 | /book/chapter11#p11.1<br>/book/chapter11#p11.2<br>/book/chapter11#p11.4<br>/book/chapter11#p11.5<br>/book/chapter11#p11.series.4.2<br>/book/chapter11#p11.6<br>/book/chapter11#p11.7<br>/book/chapter11#p11.8<br>/book/chapter11#p11.9<br>/book/chapter11#p11.10 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. ten board units had fragmented legal source paths, wrong parents, missing playable printed moves, or a rook/king transcription defect | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter11SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b08-f-repaired-app-fidelity | high | 170, 173, 174, 176, 177, 179, 181, 183, 185, 186, 187, 189, 191, 192, 193, 196, 197, 198, 201, 203 | /book/chapter12#p12.1<br>/book/chapter12#p12.4<br>/book/chapter12#p12.5<br>/book/chapter12#p12.6<br>/book/chapter12#p12.8<br>/book/chapter12#p12.9<br>/book/chapter12#p12.11<br>/book/chapter12#p12.13<br>/book/chapter12#p12.14<br>/book/chapter12#p12.16<br>/book/chapter12#p12.18<br>/book/chapter12#p12.19<br>/book/chapter12#p12.22<br>/book/chapter12#p12.24<br>/book/chapter12#p12.25<br>/book/chapter12#p12.26<br>/book/chapter12#p12.27<br>/book/chapter12#p12.28<br>/book/chapter12#p12.31<br>/book/chapter12#p12.32<br>/book/chapter12#p12.33<br>/book/chapter12#p12.38<br>/book/chapter12#p12.41 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. turn, marker, route-arrow, star-glyph/accessibility, exact branch association, canonical sharing, prose-token suppression, and bidirectional navigation defects | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter12SourceFidelity.test.tsx<br>app/src/app_x/chapter12SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b09-f-repaired-app-fidelity | high | 206, 210, 211, 213, 215, 216, 217, 218, 219, 220, 221, 223, 225, 226, 228, 229 | /book/chapter13<br>/book/chapter13#p13.4<br>/book/chapter13#p13.7<br>/book/chapter13#p13.9<br>/book/chapter13#p13.10<br>/book/chapter13#p13.12<br>/book/chapter13#p13.16<br>/book/chapter13#p13.19<br>/book/chapter13#p13.22<br>/book/chapter13#p13.25<br>/book/chapter13#p13.29<br>/book/chapter13#p13.8<br>/book/chapter13#p13.13<br>/book/chapter13#p13.14<br>/book/chapter13#p13.15<br>/book/chapter13#p13.17<br>/book/chapter13#p13.18<br>/book/chapter13#p13.20<br>/book/chapter13#p13.23<br>/book/chapter13#p13.26<br>/book/chapter13#p13.27<br>/book/chapter13#p13.30 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. four move transcriptions, 13 checkpoint clocks, canonical continuation joins, alternate roots, false prose transitions, and exact Next/Previous path closure | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter13SourceFidelity.test.tsx<br>app/src/app_x/chapter13SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b10-f-repaired-app-fidelity | high | 231, 233, 234, 235 | /book/chapter14#p14.09<br>/book/chapter14#p14.11<br>/book/chapter14#p14.12<br>/book/chapter14#p14.19<br>/book/chapter14#p14.21<br>/book/chapter14#p14.22<br>/book/chapter14#p14.25<br>/book/chapter14#p14.26<br>/book/chapter14#p14.28<br>/book/chapter14#p14.32<br>/book/chapter14#p14.33<br>/book/chapter14#p14.34 | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. four diagram FENs, one move transcription, and eight problem trees with disconnected exact source hierarchy | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter14SourceFidelity.test.tsx<br>app/src/app_x/chapter14SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| b11-f-repaired-app-fidelity | high | 247 | /book/chapter15#ptroitsky-line | The pre-repair comparison and adversarial repair report identify the linked units and preserve before/after measurements. the Troitsky schematic used asterisks rather than source-star glyphs/accessibility and duplicated the visible title before repair | Repaired the linked curated-source, presentation, and playback defects and froze them in the dedicated batch regression. | app/src/app_x/chapter15BibliographySourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts | Repaired; PDF/app reinspection and final gates pass |
| cross-f-invalid-lichess-links | medium | 21, 22, 23, 24, 180, 206, 232, 247 | /book/intro instructional diagrams<br>/book/chapter12#p12.12-route-counts<br>/book/chapter13#p13.1<br>/book/chapter13#p13.2<br>/book/chapter13#p13.3<br>/book/chapter14#p14.13<br>/book/chapter15#ptroitsky-line | The app exposed Lichess editor links for all 12 non-playable instructional schematics and for Problem 14.13's intentionally incomplete hidden board state. | Removed Lichess controls from every InstructionalDiagram and made editor-link generation fail closed when chess.js rejects the supplied FEN; the legal revealed 14.13 solution still links. | app/src/app_x/lichess.test.ts<br>app/src/app_x/viewerPresentation.test.tsx | Repaired; focused, full-suite, desktop/mobile browser, console, and overflow checks pass |

## 5. Confirmed printed-book errors

There are **28 governed book-error findings**: 27 certain corrections and one uncertain anomaly. The public “Note on this digital edition” begins with the approved 2008-edition disclaimer, uses print-page references only, is ordered by earliest print page, and contains 28 deep links.

| Finding | Severity / certainty | Pages | Printed value | Reader/app value | Public deep link | Treatment | Regression |
| --- | --- | --- | --- | --- | --- | --- | --- |
| b02a-f-book-b01 | medium / certain | PDF 33 / print 32 | Most mistakes made in King + Pawn vs. Pawn endings occur in this position. | Most mistakes made in King + Pawn vs. King endings occur in this position. | [/book/chapter1#p1.7](http://localhost:5173/book/chapter1#p1.7) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b02a-f-book-b02 | medium / certain | PDF 35 / print 34 | Now the pawn cannot be stopped. | Now the pawn can be stopped. | [/book/chapter1#p1.10](http://localhost:5173/book/chapter1#p1.10) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b02a-f-book-b04 | medium / certain | PDF 39 / print 38 | the stronger side’s king.. | the stronger side’s king. | [/book/chapter1#p1.16](http://localhost:5173/book/chapter1#p1.16) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b02c-f-book-b01 | medium / certain | PDF 64 / print 63 | White cannot win tempi to bring his king nearer anymore. | Black cannot win tempi to bring his king nearer anymore. | [/book/chapter4#p4.6](http://localhost:5173/book/chapter4#p4.6) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/bookSourceValidation.test.ts |
| b02c-f-book-b02 | medium / certain | PDF 67 / print 66 | Only move, but not enough to draw. | Only move, but enough to draw. | [/book/chapter4#p4.11](http://localhost:5173/book/chapter4#p4.11) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/bookSourceValidation.test.ts |
| b04-f-book-b01 | medium / certain | PDF 90 / print 89 | arise with reasonably frequency | arise with reasonable frequency | [/book/chapter7](http://localhost:5173/book/chapter7) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters6to7SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b04-f-book-b02 | medium / certain | PDF 92 / print 91 | Third Case.The | Third Case. The | [/book/chapter7#p7.3](http://localhost:5173/book/chapter7#p7.3) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters6to7SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b04-f-book-b03 | medium / certain | PDF 93 / print 92 | It think it is better | I think it is better | [/book/chapter7#p7.4](http://localhost:5173/book/chapter7#p7.4) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters6to7SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b04-f-book-b04 | medium / certain | PDF 95 / print 94 | White cannot offer the bishop exchange without obstructing his pawn | White can offer the bishop exchange without obstructing his pawn | [/book/chapter7#p7.5](http://localhost:5173/book/chapter7#p7.5) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters6to7SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b05-f-book-b01 | medium / certain | PDF 98 / print 97 | White dominates all 4 squares on the stopping diagonal. | Black dominates all 4 squares on the stopping diagonal. | [/book/chapter8#p8.1](http://localhost:5173/book/chapter8#p8.1) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters8to9SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b05-f-book-b02 | medium / certain | PDF 104 / print 103 | Position 8.7 (second occurrence) | Position 8.8 | [/book/chapter8#p8.8](http://localhost:5173/book/chapter8#p8.8) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters8to9SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b05-f-book-b03 | medium / certain | PDF 108 / print 107 | the right positional for the defending bishop | the right position for the defending bishop | [/book/chapter9#p9.5](http://localhost:5173/book/chapter9#p9.5) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters8to9SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b05-f-book-b04 | medium / certain | PDF 113 / print 112 | Position 9.1 | Position 9.10 | [/book/chapter9#p9.10](http://localhost:5173/book/chapter9#p9.10) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters8to9SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b05-f-book-b05 | medium / certain | PDF 121 / print 120 | Position 9.2 | Position 9.20 | [/book/chapter9#p9.20](http://localhost:5173/book/chapter9#p9.20) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapters8to9SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b06-f-book-b01 | medium / certain | PDF 124 / print 123 | Section 6 | Section 5 | [/book/chapter10#e65](http://localhost:5173/book/chapter10#e65) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter10SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b06-f-book-b02 | medium / certain | PDF 145 / print 144 | as in Position 10.19 | as in Position 10.20 | [/book/chapter10#p10.20](http://localhost:5173/book/chapter10#p10.20) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter10SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b07-f-book-b01 | medium / certain | PDF 160 / print 159 | Draw | White wins | [/book/chapter11#p11.series.6.1](http://localhost:5173/book/chapter11#p11.series.6.1) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter11SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b07-f-book-b02 | medium / certain | PDF 160 / print 159 | White wins | Draw | [/book/chapter11#p11.series.6.2](http://localhost:5173/book/chapter11#p11.series.6.2) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter11SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b07-f-book-b03 | medium / certain | PDF 168 / print 167 | Position 11.12 (second occurrence) | Position 11.13 | [/book/chapter11#p11.13](http://localhost:5173/book/chapter11#p11.13) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter11SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b07-f-book-uncertain-rc8 | high / uncertain | PDF 155 / print 154 | 2...Rg1?! 3.Kc6 Rc8! | Preserved verbatim in reader/source evidence because no certain emendation is authorized: 2...Rg1?! 3.Kc6 Rc8! | [/book/chapter11#p11.1](http://localhost:5173/book/chapter11#p11.1) | Exact print preserved; unsupported move kept non-playable; uncertainty disclosed in the public Note. | app/src/app_x/chapter11SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b08-f-book-b01 | medium / certain | PDF 177 / print 176 | reach c7 on that moment | reach c7 at that moment | [/book/chapter12#p12.9](http://localhost:5173/book/chapter12#p12.9) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter12SourceFidelity.test.tsx<br>app/src/app_x/chapter12SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |
| b08-f-book-b02 | high / certain | PDF 186 / print 185 | Immediate counterattack by 4...Kb5 draws easily | Immediate counterattack by 3...Kb5 draws easily | [/book/chapter12#p12.19](http://localhost:5173/book/chapter12#p12.19) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter12SourceFidelity.test.tsx<br>app/src/app_x/chapter12SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |
| b08-f-book-b03 | medium / certain | PDF 202 / print 201 | When it comes the right moment | When the right moment comes | [/book/chapter12#p12.39](http://localhost:5173/book/chapter12#p12.39) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter12SourceFidelity.test.tsx<br>app/src/app_x/chapter12SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |
| b09-f-book-b01 | medium / certain | PDF 206 / print 205 | that, is | that is | [/book/chapter13#p13.1](http://localhost:5173/book/chapter13#p13.1) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter13SourceFidelity.test.tsx<br>app/src/app_x/chapter13SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |
| b09-f-book-b02 | medium / certain | PDF 208 / print 207 | Remember this procedure by the moment. | Remember this procedure for the moment. | [/book/chapter13#p13.4](http://localhost:5173/book/chapter13#p13.4) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter13SourceFidelity.test.tsx<br>app/src/app_x/chapter13SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |
| b09-f-book-b03 | medium / certain | PDF 217 / print 216 | get his king out of the edge | get his king off the edge | [/book/chapter13#p13.14](http://localhost:5173/book/chapter13#p13.14) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter13SourceFidelity.test.tsx<br>app/src/app_x/chapter13SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |
| b10-f-book-b01 | high / certain | PDF 234 / print 233; solution PDF 239 / print 238 | Black to move. Can he draw? | White to move. Can he draw? | [/book/chapter14#p14.29](http://localhost:5173/book/chapter14#p14.29) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter14SourceFidelity.test.tsx<br>app/src/app_x/chapter14SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |
| b10-f-book-b02 | medium / certain | PDF 237 / print 236 | the black king is driven off his blockade position | the white king is driven off his blockade position | [/book/chapter14#p14.17](http://localhost:5173/book/chapter14#p14.17) | Certain correction used in reader/playback and neutrally disclosed in the public Note. | app/src/app_x/chapter14SourceFidelity.test.tsx<br>app/src/app_x/chapter14SourcePaths.json<br>app/src/app_x/bookSourceValidation.test.ts |

Contested decisions are closed as follows:

- Analysis 4.11 remains corrected: exact replay reaches `8/8/8/8/8/1K6/4Q3/kq6 w - - 2 7`, a tablebase draw, so “not enough” is objectively false.
- Position 12.19 is a certain move-number error: after `3.d3+`, `3...Kb5` is legal and draws. The reader and connected playback branch use `3...Kb5`; the public Note identifies printed `4...Kb5`.
- Appendix F13 is not classified as an error. The defensible printed genitive “one of the pawns’ advance” is restored exactly and has no public erratum.

## 6. Accepted presentation deviations

The audit freshly re-proved all 10 accepted-deviation findings (16 affected units).

| Finding | PDF pages | App location | Fresh justification | Disposition | Regression |
| --- | --- | --- | --- | --- | --- |
| b01-f-accepted-identity | 1, 4 | /book/about | The photographed cover and separate title-page layout are not facsimiled; their title, subtitle, author, edition, and source identity are consolidated in the labeled About identity header. | Governed the consolidated identity header as an intentional digital-edition presentation. | app/src/app_x/viewerPresentation.test.tsx<br>app/src/app_x/sourceTextAudit.test.ts |
| b01-f-accepted-back-cover | 2 | /book/about | The app preserves the publisher description, benefits, bio, ISBN, and normalized price line but does not reproduce the back-cover artwork, barcode, or price-box layout. | Governed the accessible text-first back-cover rendering as an intentional presentation. | app/src/app_x/viewerPresentation.test.tsx<br>app/src/app_x/sourceTextAudit.test.ts |
| b01-f-accepted-half-title | 3 | /book/about | PDF page 3 is a redundant isolated half-title; the app preserves the title in its identity header without a standalone duplicate screen. | Governed omission of the redundant half-title leaf as an intentional digital presentation. | app/src/app_x/viewerPresentation.test.tsx<br>app/src/app_x/sourceTextAudit.test.ts |
| b01-f-accepted-publication | 5 | /book/about | Publication facts and credits are consolidated into semantic lists; the full all-rights boilerplate and print-page layout are not reproduced. | Governed semantic metadata lists as the accessible digital presentation. | app/src/app_x/viewerPresentation.test.tsx<br>app/src/app_x/sourceTextAudit.test.ts |
| b01-f-accepted-contents-navigation | 6, 7, 8, 9 | /book/about | The four printed contents pages use folios and dot-leader rows; the app preserves all part/ending labels as navigable routes and anchors. | Governed navigable links in place of print pagination while retaining every row’s semantic destination. | app/src/app_x/viewerPresentation.test.tsx<br>app/src/routing.test.ts<br>app/src/app_x/sourceTextAudit.test.ts |
| b01-f-accepted-blank-leaf | 27 | /book/chapter1 | PDF page 27 is wholly blank and has no semantic content; the app does not create an empty standalone route section. | Governed omission of the non-semantic blank leaf as an intentional presentation. | app/src/app_x/sourceTextAudit.test.ts |
| b01-f-accepted-statistics-table | 19 | /book/intro | All 29 rows and five numeric columns match; chess-piece glyph labels are expanded to words and print-only total-row weight/rules are not reproduced. | Governed accessible word labels and responsive table styling while preserving every value and same/opposite-colour distinction. | app/src/app_x/sourceTextAudit.test.ts<br>app/src/app_x/bookSourceValidation.test.ts |
| b01-f-accepted-king-route-lines | 23 | /book/intro#pintro-king-routes | The source marks three a4–h4 routes with arrowed lines; the app preserves their endpoints and control points as plain polylines, with direction supplied by the heading and prose. | Governed plain polylines as an intentional presentation that preserves route semantics. | app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b02a-f-accepted-pdf-stalemate-artifact | 38 | /book/chapter1 | The anomalous period is confined to the supplied PDF artifact rather than the printed book. The reader therefore preserves the normal print wording 'there is a stalemate.' without presenting this as a public book erratum. | Preserved 'there is a stalemate.' in the reader, removed the item from public errata, and retained this internal PDF-artifact record. | app/src/app_x/introChapters1to4SourceFidelity.test.ts<br>app/src/app_x/introDiagramFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |
| b02b-f-accepted-responsive-solutions | 46, 47, 48, 49, 50, 51 | /book/chapter2 | All 26 prompts, diagrams, ordered solutions, credits, prose, results, and ending references are retained; only physical pagination/control presentation changes. | Accepted the responsive per-problem solution presentation while retaining all substantive source content and stable prompt/solution anchors. | app/src/app_x/chapter2SourceFidelity.test.tsx<br>app/src/app_x/bookSourceValidation.test.ts |

Position 1.14 is specifically tracked as a PDF-only artifact: the supplied PDF shows `a.stalemate`, but the book wording is `a stalemate`. The reader preserves the normal wording, the public erratum was removed, and the internal accepted-deviation record remains.

## 7. Unresolved or blocked items

- Blocked units: **0**
- Unclassified units: **0**
- Unresolved objective defects: **0**
- Unexplained PDF/app differences: **0**
- Uncertain corrections fabricated: **0**

The sole uncertain printed anomaly is Position 11.1’s `2...Rg1?! 3.Kc6 Rc8!`; it is closed by preserving print, withholding fabricated playback, and disclosing the uncertainty.

## 8. Objective product findings

- Desktop (1280 px) and mobile (390×844) checks passed on About, Introduction, Chapters 1–15, Bibliography, and Mate: 19 major routes total.
- All 336 governed live DOM anchors across the 16 anchored book routes existed exactly once; no governed anchors were missing or duplicated.
- No route showed horizontal overflow. Browser console audit found zero warnings or errors.
- Note deep links and browser back/forward, chapter selector navigation, Chapter 2 solution reveal/hide, board reset/Previous/Next, keyboard Left/Right, expansion/restore, coordinates, and Lichess links passed.
- All 12 instructional schematics now omit Lichess links and empty control rows, including the syntactically legal king-routes placement. Problem 14.13 omits the link/control row while its intentionally incomplete prompt is hidden and restores the legal Lichess/playback controls when the solution is revealed. Normal legal positions retain their links.
- Position 12.19’s `3...Kb5` branch played from the exact post-`3.d3+` parent. Expanded visual inspection showed the black king on b5; Previous/Next and keyboard traversal returned to the correct parent/child states.
- Strict SAN audit covered 337 positions and 7,252 move tokens with zero strict failures and zero misses. Advisory all-token audit also had zero misses.
- Chapter 12 source replay closed 119/119 complete, forward, and previous paths over 1,102 plies and 862 unique transitions, with zero failures, wrong parents/results, missing transitions, or extra leaves. Two source paths are valid prefixes of longer app paths rather than terminal leaves; both replay completely.
- Generated Lichess-link audit covered 7,577 links.
- Optional polish: none recorded. No subjective redesign suggestion is being used to mask or downgrade an objective defect.

Historical regression challenges were rechecked: 10.19 matched the source h4/h5 placement and `3.Rh5`; 10.24 and 10.26 source parents/transcriptions are repaired; 11.1 preserves the uncertain `Rc8!`; 12.16 uses `Kxb3`; 12.19 uses certain `3...Kb5`; Ending 95 uses printed `38.Rd7+`; Final Test 14.29 uses White to move and cites both print pages; rights boilerplate remains deliberately omitted while required metadata is retained; Mate navigation remains present and tested.

## 9. Files and generated artifacts changed

- Reader/policy/source: `app/src/app_x/BookFrontMatter.tsx`, `app/src/app_x/InstructionalDiagram.tsx`, `app/src/app_x/lichess.ts`, `app/src/app_x/pdf/book.json`, `app/src/app_x/chapter12SourcePaths.json`.
- Generated runtime: added `app/public/app_x/chapter-runtime.0aaad1daefd3eb5b.json`; deleted stale `chapter-runtime.2cd26b918d32cc7e.json`; updated `app/src/app_x/chapterPayloadManifest.ts`.
- Evidence: `app/src/app_x/pdf/source_fidelity_evidence.json`, `app/src/app_x/pdf/source_fidelity_ledger.json`.
- Regression coverage: `bookSourceAudit.test.ts`, `chapter10SourceFidelity.test.tsx`, `chapter11SourceFidelity.test.tsx`, `chapter12SourceFidelity.test.tsx`, `chapter13SourceFidelity.test.tsx`, `chapter14SourceFidelity.test.tsx`, `chapter15BibliographySourceFidelity.test.tsx`, `chapters6to7SourceFidelity.test.tsx`, `chapters8to9SourceFidelity.test.tsx`, `lichess.test.ts`, `moveParser.test.ts`, `sourceTextAudit.test.ts`, and `viewerPresentation.test.tsx` under `app/src/app_x/`.
- Audit design/report: `docs/superpowers/specs/2026-07-18-digital-edition-note-policy-design.md`, `docs/superpowers/specs/2026-07-18-invalid-lichess-link-suppression-design.md`, and this report.
- Runtime semantic content hash: `sha256:0aaad1daefd3eb5b5d8c9640afd010ea978772c3d4b64622e85584f82516525d`; curated-source semantic hash: `sha256:38122a0e5fda619b12c49b1d5a9e2162e1a546eb7cb842654052ec461275df9f`.
- No commit or push was performed.

## 10. Commands and exact results

| Command / check | Exact result |
| --- | --- |
| `python3 scripts/build_chapter_payload.py` | Exit 0; runtime/manifest rebuilt to semantic hash `0aaad1da…`; 17 book parts in payload. |
| `node scripts/rebuild_fidelity_ledger.mjs` | Exit 0; `rebuilt source fidelity ledger: 586 units, 57 findings`. |
| `node scripts/rebuild_fidelity_ledger.mjs --check` | Exit 0; `source fidelity ledger is fresh`. |
| `cd app && npm test` (final run) | Exit 0; 165 Mate tests passed, then routing, source, ledger, all chapter-fidelity, parser, 7,577-link, structural, text, and presentation suites passed. |
| `cd app && npm run test:content` | Exit 0; `content audit passed`. |
| `cd app && npm run test:audit-san` | Exit 0; 337 positions / 7,252 move tokens; 0 strict SAN failures; 0 misses. |
| `cd app && npm run test:audit-san:advisory -- --all` | Exit 0; 337 positions / 7,252 move tokens; 0 misses. |
| `cd app && npm run lint` | Exit 0; oxlint reported no findings. |
| `cd app && npm run build` | Exit 0; TypeScript and Vite build passed; 71 modules; JS 459.36 kB (139.04 kB gzip), CSS 32.43 kB (6.48 kB gzip). |
| `app/node_modules/.bin/tsx tmp/pdfs/lotta-release-audit/compare12.ts` | Exit 0; 119 paths / 1,102 plies; 119 complete, forward, previous; 862 transitions; 0 failures. |
| Focused chapter/source tests | Exit 0; Chapters 6–7, 8–9, 10, 11, 12, 13, 14, 15/Bibliography, source text, viewer presentation, book source audit/validation, parser, and ledger freshness all passed. |
| `python3 -m py_compile` on batch replay/tablebase scripts | Exit 0. |
| `jq empty` on book, evidence, ledger, Chapter 12 paths, and runtime JSON | Exit 0. |
| `shasum -a 256` / `pdfinfo` on authoritative PDF | Exit 0; 249 pages, 14,360,268 bytes, SHA-256 `7610f6c…`. |
| Stale-policy searches | Exit 0; no public `PDF page`, Position 1.14, or F13 erratum; no reader `4...Kc5` rewrite or F13 editorial rewrite; expected `3...Kb5` and printed F13 wording present. |
| Browser route/anchor/interaction audit | 19 routes at desktop and mobile; 336 governed anchors; 0 missing/duplicate anchors, overflow, warnings, or errors; all prior interactions passed. Follow-up 1280×900 and 390×844 checks confirmed zero schematic links/controls, hidden/revealed 14.13 behavior, retained legal-position links, and exact viewport-width layout. |
| `git diff --check` | Exit 0; no whitespace errors. |

Transparent diagnostic corrections:

- An early ledger-check invocation from `app/` used the root-relative script path and failed with module-not-found; it was rerun from the repository root and passed.
- The first full `npm test` run exposed a stale Chapter 12 part hash; the second exposed stale public `PDF page` expectations. Both guards were updated to the approved final source/policy, focused tests passed, and the final full suite exited 0.
- One `rg app/src/app_x` invocation was issued while already inside `app/` and reported a missing path; the corrected `rg src/app_x` search found only the intentional negative `/PDF page/` assertion.
- The in-app browser does not implement `networkidle`; the audit used supported `domcontentloaded` plus explicit DOM readiness. Two initial keyboard targets rerendered or were non-regions; the same Left/Right behavior passed against the stable scoped Reset control.
- The follow-up responsive check first tried unsupported tab-level viewport setters, then used the browser's supported viewport capability. One route-transition evaluation reached its short selector deadline; explicit diagram readiness was awaited and the same mobile checks passed.

## 11. Final diff review

- Reviewed the complete source, policy, fixture, evidence, generated-runtime, and test diff after the final repair.
- The Note has 29 list items: one unlinked disclaimer plus 28 linked book entries, ordered by earliest print page. It contains no PDF-page labels and no Position 1.14 or F13 entry.
- Position 12.19 now uses a connected `Kc1 Kd4 Kc2 Kc4 d3+ Kb5` branch from exact parent FEN `8/p7/P7/8/2k5/3P4/2K5/8 b - - 0 3`.
- F13 exactly preserves `Black can force one of the pawns’ advance to h3 and then win.`
- Instructional diagrams have no Lichess/control row. Editor URL construction validates with chess.js, hidden Problem 14.13 fails closed, its legal revealed solution links, and ordinary legal position links remain unchanged.
- Evidence and generated ledger both say `auditState: complete`, contain 586 units / 57 findings, and contain zero pending or blocked records.
- Only the current hashed runtime exists in `app/public/app_x`; manifest, runtime, source hash, and ledger candidate metadata agree.
- No collateral source rewrite, unsupported correction, duplicate disclosure, stale runtime, whitespace defect, commit, or push remains.

## 12. Verdict

**Ready to show the author**

In the bounded release-audit sense, the candidate has no known unexplained source difference, no known unresolved objective defect, no blocked unit, no fabricated correction or misleading playback, and all required gates pass.
