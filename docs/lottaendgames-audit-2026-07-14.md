# Lotta Endgames author-presentation audit

**Audit date:** 2026-07-14

**Correction pass opened:** 2026-07-15

**Source:** *100 Endgames You Must Know* (2008 PDF, 249 pages)

**Product:** Lotta Endgames web reader

**Verdict:** **The PDF-first source reconciliation is complete from the Introduction through the Bibliography. The five user-exempted P1 areas remain unchanged and still prevent an unconditional claim that the product is presentation-perfect.**

> **Correction notice:** The original audit overstated the completeness of its
> source-fidelity review. The corrective audit has now completed the missing
> page-by-page, diagram-by-diagram reconciliation for the full 249-page PDF.
> The defects it exposed are repaired and protected by a 576-unit resolved
> source ledger. This closes the content audit; it does not waive the five P1
> product areas the user explicitly instructed this pass to leave untouched.

The app now has a strong technical and content foundation: all 100 numbered endings are represented, the Introduction through Bibliography is present, all app chapters load, move playback works, solution reveals work, the PDF-visible chapter hierarchy is restored, and all automated source/SAN/link/build checks pass. The remaining risks are the five intentionally untouched product areas: nested long-form scrolling, small mobile boards, screen-reader chess output, visual-language polish, and whole-book payload/rendering performance.

All P0 source and front-matter items are closed. Whether to proceed with the author demo is now a product decision: source fidelity is ready, but the five explicitly deferred P1 issues remain material for a product described as a superior representation of the book.

## What was audited

- Reviewed the 249-page PDF in full source order, using extracted text for navigation and the rendered page image as authority for every prose block, move score, board, marker, route, caption, and hierarchy decision.
- Opened the Introduction, Chapters 1–15, Bibliography, and the visible Mate route in the running app.
- Checked representative long chapters, tests, deep links, inline move playback, keyboard move navigation, Lichess links, solution reveal/hide behavior, desktop layout, and a 390 × 844 mobile viewport.
- Inspected the canonical source, rendering code, styles, routing, accessibility semantics, extraction ledger, and test coverage.
- Ran the complete available verification suite:
  - `npm test`
  - `npm run test:content`
  - `npm run test:audit-san`
  - `npm run test:audit-san:advisory -- --all`
  - `npm run build`
  - `npm run lint`

All commands passed. The runtime contains 100 endings and 337 positions/diagrams/problems. The most recent link audit checked 6,826 generated Lichess links. Browser console inspection found no warnings or errors during the representative interaction pass.

Passing tests alone do **not** establish PDF fidelity. Here they preserve a completed human PDF comparison: 239 page-copy units and 336 board/problem/diagram units are recorded as matched; Final Test 14.29 is recorded as an accepted deviation. Release-specific regression tests protect the exact defects found.

## Chapter 13 correction release — resolved

The Chapter 13 source on PDF pages 205-229 (print pages 204-228) has now been
reconciled page by page. The app reports the complete **30-board** sequence,
13.1 through 13.30. The following previously omitted defects are repaired:

| Location | Repair | Release evidence |
|---|---|---|
| Positions 13.1-13.3 | Restored all three instructional diagrams in their printed order with the exact pieces, captions, book orientation, and barrier/cage star markers. | Exact 13.1-13.30 sequence test, FEN/provenance parity, browser comparison. |
| Position 13.4, Step 8 | Corrected the corrupted `See Position 13.22. 13.3.` text to `See Position 13.3.` | Exact source-string regression test. |
| Analysis diagram 13.5 | Restored the printed V/W knight route over c7-d5-e7-f5-g7 and the `(Knight's route)` subtitle. | Route schema validation, SVG rendering test, browser comparison. |
| Positions 13.8-13.11 | Restored the four standalone printed headings and attached them to the correct following diagrams: Philidor, shifted Lolli, knight's-file Lolli, and rook's-file. | Heading order assertion and browser text check. |
| Positions 13.12 and 13.16 | Restored structured game metadata: `Budnikov - Novik` / `Moscow 1991` and `García González - Balashov` / `Leningrad 1977`. | Exact caption assertions and browser text check. |
| Position 13.19 | Corrected `g5- and f7-squares` to the printed `g8- and f7-squares`. | Exact source-string regression test. |
| Position 13.20 | Corrected the provenance FEN and restored the printed star markers on a2, b3, c4, and e6. Removed the false marker placement previously encoded as b1, b2, c3, and e4. | Exact marker assertion, ledger parity, browser comparison. |
| Ending 99 | Restored `Müller & Lamprecht`. | Exact source-string regression test. |
| Ending 100 | Replaced both illegal `Kb5` transcriptions with the printed `Kb8`. | Full main-line replay through `chess.js` from Position 13.29. |
| Provenance | Added matched page-copy records for all 25 PDF pages and matched board records for all 30 Chapter 13 visuals. | `source_fidelity_ledger.json` plus automated schema/section-reference tests. |

Chapter 13 now reports `positions=30 moveTokens=859`, with zero strict SAN
failures and zero advisory misses. Its source-fidelity tests also assert the
printed board sequence, FENs, markers, route, headings, captions, corrected
strings, and the complete Ending 100 main line.

## Introduction and Chapters 1–4 correction release — resolved

PDF pages 10–26 and 28–68 were reconciled in source order, including every
prose block, heading, panel, table, diagram, problem prompt, solution, and move
line. The release ledger contains 58 matched page-copy records and 87 matched
board/problem records. This pass found and repaired four defects that the
original audit and automated move checks had missed:

| Location | Defect | Repair and evidence |
|---|---|---|
| Introduction, “The king's multiple routes” | The printed direct, upper, and lower routes from a4 to h4 were absent; only the numbers and kings were rendered. | Added the three printed paths (`a4-h4`, `a4-d7-e7-h4`, and `a4-d1-e1-h4`) as source data and SVG overlays. The viewer test and targeted DOM check confirm three rendered polylines. |
| Position 1.16, PDF p. 39 / print p. 38 | The pawn, white king, and both starred squares were encoded in the wrong locations. The app showed a4, c2, b2, and b1 instead of the printed a5, d2, c2, and c1. | Corrected the FEN to `8/8/8/p7/8/1k6/3K4/8`, corrected the markers, and replayed the complete printed line through 5.Kc1. The app now promotes the line correctly. |
| Basic Test 2.20, PDF p. 49 / print p. 48 | The app encoded a different position: the black rook, black king, white pawn, and white king were all misplaced. | Corrected the FEN to the printed `1r6/8/8/8/1P1k4/K7/8/7R`; the printed `1.Rh5!` now replays legally from the displayed board. |
| Chapter 3, Analysis diagram 3.6 explanation | The PDF says the essential part of the barrier “are” the four named squares; the app silently normalized it to “is.” | Restored the printed wording exactly and protected both the required phrase and absence of the normalized phrase. |
| Chapter 4, Analysis diagram 4.11 provenance | The live app correctly placed the queen on e2, but the legacy extraction report recorded e3 while still claiming a clean promotion. | Corrected the provenance FEN to match the printed diagram and app. |

The batch now reports Introduction `13 boards / 1 move`, Chapter 1 `25 / 366`,
Chapter 2 `26 / 296`, Chapter 3 `10 / 141`, and Chapter 4 `13 / 180`, with zero
strict SAN failures and zero advisory misses. Targeted browser verification
confirmed the repaired route/FEN/marker output and a clean console.

## Chapters 5–9 correction release — resolved

PDF pages 69–123 (print pages 68–122) were reconciled in source order. The
release ledger contains 55 matched page-copy records and 71 matched board
records. This pass found and repaired the following defects:

| Location | Defect | Repair and evidence |
|---|---|---|
| Position 5.10; Positions 6.7, 8.6, 9.8, 9.13, and 9.14 | Printed “Analysis diagram” labels were represented as ordinary captions, and four omitted the printed number. | Restored the complete printed label as the board's display label and removed the false caption hierarchy. Exact-label tests protect all six diagrams. |
| Positions 6.6, 7.5, 8.5, and 9.12 | Two-line game/event captions were flattened into invented comma-separated lines. | Restored the printed player line and event line as structured subtitle/caption pairs. |
| Chapter 7 opening | The app silently normalized the printed “reasonably frequency” to “reasonable frequency.” | Restored the source wording exactly and added a regression assertion against normalization. |
| Position 8.7 | The PDF prints the same `Position 8.7` label on both distinct diagrams, while the app exposed its internal disambiguating IDs `8.7a` and `8.7b`. | Kept unique internal IDs for routing and playback, but restored `Position 8.7` on both visible labels. |
| Knight blockades series, PDF p. 103 / print p. 102 | The first two diagrams had shifted kings, knight, and pawn placements. | Corrected both FENs directly from the printed diagrams and protected the exact positions in the release gate. |
| Chapter 9, after Position 9.5 | The app normalized the printed phrase “the right positional for the defending bishop” to “the right position.” | Restored the printed wording exactly and protected both presence and absence forms. |
| Internal Position 9.10, PDF p. 113 / print p. 112 | The PDF visibly prints the truncated label `Position 9.1`; the app exposed the normalized internal number. | Preserved the safe internal ID but restored the exact printed display label. |
| Position 9.18, PDF p. 120 / print p. 119 | The white king was on g2 instead of the printed f2, contradicting the following `2.Kg3`. | Corrected the FEN and replayed the complete printed main line through `9...Ke6`. |
| Internal Position 9.20, PDF p. 121 / print p. 120 | The white king was on c3 instead of the printed c4, and the PDF visibly prints the truncated label `Position 9.2`. | Corrected the FEN, restored the printed display label, and replayed the opening line through `8.Bd5`. |

The release gate asserts the complete board sequences: Chapter 5 has 24
boards, Chapter 6 has 10, Chapter 7 has 6, Chapter 8 has 11, and Chapter 9 has
20.

## Chapters 10–12 correction release — resolved

PDF pages 124–204 (print pages 123–203) were reconciled in source order. The
release ledger contains 81 matched page-copy records and 93 matched board
records: 27 in Chapter 10, 23 in Chapter 11, and 43 in Chapter 12. This pass
found a systemic transcription failure that the earlier SAN audit could not
detect: the PDF's chess font had caused rook glyphs to be read as kings and
capture signs or move ellipses to disappear.

| Location | Defect | Repair and evidence |
|---|---|---|
| Chapter 10 rook endings | Numerous rook moves were encoded as king moves, including `1.Ra1?`, `2.Rf7`, `1...Rc8`, `1...Rg8`, and the Vancura sequence ending `11...Rf6`. Position 10.11 also had a white rook where the printed board has Black's rook. | Corrected the printed move scores and Position 10.11 FEN; exact-string assertions reject the former OCR forms and legal replay starts from the repaired board. |
| Positions 10.22–10.24 and 10.26 | Printed defensive/mined/drawing/cut-off zones were incomplete or absent, including all 15 stars in Position 10.24. | Restored the printed marker overlays and protected the exact Position 10.24 square set. |
| Chapter 11, Positions 11.1–11.11 | Rook checks, waiting moves, captures, and a complete `17...Kh7!` move were corrupt or missing. Position 11.4 had the wrong rook colour and side to move. | Repaired the scores against PDF pages 154–167, restored the missing move, corrected the FEN, and replayed the Position 11.4 main line. |
| Printed Position 11.12 duplication | The book prints `Position 11.12` on two different diagrams. The app had only one reliable provenance row and did not preserve the visible duplication. | Kept unique internal IDs `11.12` and `11.13`, restored `Position 11.12` as the second board's display label, and added provenance for both diagrams plus Position 11.14. |
| Chapter 12 instructional diagrams | The printed multiple-route diagram after Position 12.12 and several arrows/lines/markers were absent. | Added the 18 printed route-count labels, the emphasized correct route, the Position 12.8 and 12.18 arrows, and the Position 12.33 floating-square outline as structured source data. |
| Chapter 12 move scores | Captures were repeatedly stripped (`Kxb8`, `Kxe6`, `Kxf4`, `Kxa5`, and others), and several Black moves lost their ellipses. | Restored every identified capture and side-to-move marker directly from PDF pages 170–204; exact-source assertions and legal replays protect the repaired sequences. |
| Captions and labels | Analysis diagrams were rendered as ordinary captions, and game/study metadata was flattened or omitted. | Restored printed display labels and structured metadata for Kolesnikov–Bocharov, Gligoric–Smyslov, Duras, Réti, and Ljubojevic–Browne. |

The release-specific gate now checks complete board order, source-page ledger
coverage, FENs, visible duplicate labels, captions, markers, routes, corrected
and forbidden OCR strings, and representative legal move replays.

## Chapters 14–15 and Bibliography correction release — resolved

PDF pages 230–249 (print pages 229–248) were reconciled in source order. The
release ledger contains 20 matched page-copy records and 56 matched board
records: all 36 Final Test problems, all 19 Appendix fortress positions, and
the Troitsky-line instructional diagram. The pass found several serious board
and move transcriptions that could survive a superficial text audit because
they looked plausible but made the printed solution illegal.

| Location | Defect | Repair and evidence |
|---|---|---|
| Problems 14.05 and 14.17 | The complete printed piece clusters were shifted one rank, so the displayed positions did not match the diagrams. | Re-read both diagrams at high resolution, corrected the FENs, and replayed the printed openings legally. |
| Problem 14.19 | The white and black kings were assigned the opposite colours, making the printed `3.Kf5` impossible. | Corrected the king colours and replayed the line through `5.Rf7+`. |
| Problems 14.20 and 14.23 | The black king in 14.20 and the bishop/rook in 14.23 were on the wrong squares. | Corrected the three placements from the diagrams; both printed solutions now replay legally. |
| Problem 14.25 | The bishop and white king/pawns were mistranscribed, and the solution contained king moves where the PDF prints bishop moves. | Corrected the FEN and restored `77.Bxf5+?`, `78...Bf6!=`, and `79.Bc2 Bd8`. |
| Problem 14.30 | The bishop, kings, and pawns were materially misplaced; `89...Bb3?` and `Kxc5` had been transcribed as king moves to unrelated squares. | Corrected the diagram and both move forms, then replayed the line legally. |
| Problems 14.15, 14.18, and 14.23 | Rook moves/evaluations were mistranscribed or dropped: `Ra2/Ra5`, `Rb8++-`, the “important position 10” reference, and `57.Bc1`. | Restored the exact printed score and protected the corrected/forbidden strings. |
| Problems 14.08, 14.24, and 14.32 | Accented player names were normalized or corrupted. | Restored `Moreno-Viñal`, `Domínguez-Bruzón`, and `Andrés-De la Villa`. |
| Problem 14.29 | The PDF says Black to move although its solution begins with White's 69th move. | Kept the approved legal White-to-move correction, disclosed it before the Introduction, and restored the printed `Z` annotation after `69...Kc3!`. |
| Chapter 15 | The Troitsky line and fortress sequence required full visual verification; the visible Appendix hierarchy had also dropped the printed `1.`. | Verified all 20 diagrams, restored the exact a4/b6/c5/d4/e4/f5/g6/h4 boundary markers, and restored `1. Fortresses`. |
| Full chapter hierarchy | The reader omitted the printed chapter number from every chapter title. | Restored the exact `1.` through `15.` title prefixes while keeping selector labels unchanged. |
| Bibliography | Proper names, titles, publisher lines, and paragraph order needed a final source pass. | Matched all nine headings and all copy across PDF pages 248–249. |

Chapter 14 now reports `positions=36 moveTokens=938`, with zero strict SAN
failures and zero advisory misses. Targeted browser verification confirmed the
36-board count, solution playback, approved control row, in-page expansion and
Escape restoration, the Appendix's 20-board count and eight Troitsky markers,
and the complete Bibliography hierarchy.

## Previously reported items — current implementation status

### P0.1 — Resolved to the approved digital-edition policy

There is one confirmed, intentional difference between the printed book and the app:

| Location | Printed PDF | App | Chess assessment |
|---|---|---|---|
| Final Test 14.29, printed p. 233 / PDF page 234 | “Black to move. Can he draw?” | “White to move. Can he draw?” | The published solution analyzes White's 69th move, so the reader follows the solution while neutrally disclosing the inconsistency. |

The deliberate deviation is disclosed before the Introduction under “Note on
this digital edition.” The corrected legal value continues to drive the app
and playback. This is the user-approved presentation behavior; any
future edition-specific deviation must be added to the same visible register
and protected by a regression test.

### P0.2 — Resolved

`/` and `/book` now open an About/front-matter page before the Introduction. It
shows the author, edition, ISBN, copyright, publisher link, photo credit, project
purpose, reader features, visible deviation, thanks, contact address, and a
linkable table of contents. The full rights-reservation paragraph is
intentionally hidden; the copyright, publisher link, and photo credit remain.

### P0.3 — Explicit presentation exception

The Mate entry and its “Coming soon” page remain intentionally. The user
explicitly requested that this item not be removed, so it is no longer treated
as an implementation task in this audit.

## High-priority product issues (P1)

### P1.1 — Long commentary is trapped in nested scroll regions

Each position study is capped at approximately one viewport and its content becomes an internal vertical scroller. Long chapters therefore contain many separate scrollable regions inside the page. In the audited routes, several chapters had more than ten internally overflowing studies; Chapter 10 had 21. The longest observed region hid hundreds of pixels of content.

On the 390 × 844 viewport, Position 10.1’s card was about 820 px high while its internal content was roughly 1,599 px tall. Approximately 974 px of the lesson existed below the card’s internal fold. The scrollbar is easy to miss, so a reader can page-scroll past analysis without realizing it.

This is the most serious usability defect in the actual book experience.

**Required fix:** use normal document scrolling for the prose. A good pattern is a sticky board beside the analysis at wide widths and an ordinary board-then-prose flow on mobile. If any content is intentionally collapsed, label it explicitly and provide “Expand analysis” / “Read all”; do not use silent clipping.

Evidence: `app/src/app_x/styles.css:296-328` and `app/src/app_x/styles.css:686-700`.

### P1.2 — Mobile boards are too small for serious calculation

The narrow layout keeps board and metadata side-by-side. In the representative mobile study, the board was about 166 px square. That is inadequate for accurately reading an endgame position, especially for older readers or dense positions. It also leaves a tall, narrow analysis column and contributes to the nested-scroll problem.

**Required fix:** make the board full-width above the copy on narrow screens. Add tap-to-enlarge/fullscreen, a board-size preference, and a clear orientation control. Re-test at 320, 375/390, 768, and desktop widths.

### P1.3 — Resolved to the approved scope

The About page now includes a linkable chapter-and-ending table of contents,
and chapters expose ending ranges plus board counts. Reader-facing copy no
longer reports implementation “section” counts.

### P1.4 — Resolved

Each playable position has a control row above its label in the exact approved
order: `Lichess`, `←`, `Reset`, `→`. Previous/next use arrows only. The rejected
“Start position,” current-move, and “Keys: ← →” status text is absent.

### P1.5 — Resolved to the approved scope

Coordinates are visible and each diagram uses the same default orientation as
the printed book. Orientation is stored as source data rather than inferred at
render time.

### P1.6 — Resolved

Lichess is now a dedicated external button in the control row. Clicking a board
expands it in-page to the available viewport rather than navigating away or
entering native browser fullscreen; clicking again or pressing Escape restores
the normal layout without changing the URL.

### P1.7 — Screen-reader access to positions and playback is insufficient

The board is exposed as an image named only “Chess position 10.1” (or equivalent). Its piece placement, side to move, orientation, and current move are not described. Move-driven state changes are not announced. This means the essential chess content is largely opaque to a screen-reader user.

**Required fix:** provide a concise textual position description or accessible piece list, side to move, current move, and a polite live announcement when playback changes. Make scrollable/collapsible analysis operable and discoverable by keyboard. Include an accessible FEN copy action for expert users.

Evidence: `app/src/app_x/ChessBoard.tsx:23-29` and the move-button rendering in `app/src/app_x/ChapterViewer.tsx`.

### P1.8 — Visual language does not yet feel author/publisher-grade

The dark brown/pink theme is distinctive, but the oversized pink Comic Sans/Chalkboard title makes the product feel playful rather than authoritative. On a 1280 px desktop, the masthead wraps awkwardly and the reading column leaves a large unused right side. Position cards often reserve a large two-column area for minimal metadata, producing dead space while the actual prose remains constrained.

The book itself uses restrained serif typography, clear numbered hierarchy, compact captions, and boxed summary material. A digital edition need not imitate print, but it should retain that seriousness and hierarchy.

**Required fix:** keep the warm palette as a brand accent, but use a high-quality book/display serif for title and chapter hierarchy and a highly legible text face for prose. Reduce the masthead after the landing page, tighten the information architecture, and design the board/prose relationship deliberately at wide widths. Preserve the app’s personality in accents, not in the primary reading typeface.

Evidence: `app/src/app_x/styles.css:82-95`.

### P1.9 — The payload and chapter rendering strategy create avoidable performance risk

The browser downloads one 2,367,586-byte runtime JSON containing the entire book and precomputed playback. The selected chapter then eagerly renders every position; the largest chapters contain more than 40 board objects. This produced visibly heavy automation on board-dense routes and will be fragile on slower phones.

**Required fix:** split/cache data by chapter or progressively fetch it, lazy-mount offscreen boards, and keep deep links reliable while content hydrates. Set and verify budgets for first contentful render, chapter switch latency, transferred bytes, and long tasks on a representative mobile device. Do not trade away offline/book-wide search without measuring the alternatives.

### P1.10 — Resolved

The new source-fidelity ledger is the presentation release authority; the
legacy OCR extraction report is retained as extraction history rather than
treated as proof of correctness. The completed releases contain all 239
page-copy records and all 337 board/problem/diagram records from the
Introduction through the Bibliography: 336 matched board units and one accepted
deviation, with zero unresolved units.

## Source-fidelity and editorial issues (P1/P2)

### Printed hierarchy — resolved

The visible chapter titles now preserve the printed `1.` through `15.` prefixes,
and the Appendix preserves `1. Fortresses`. Exact title and heading assertions
prevent the hierarchy from being silently normalized again.

### The app has no visible page correspondence

Running page numbers should not interrupt digital reading, but their complete absence makes source checking unnecessarily hard.

**Recommendation:** attach source-page metadata to sections and expose it unobtrusively (“Print p. 216”), optionally with a “View source page” comparison for internal/editorial builds. This is invaluable during author review and future corrections.

### Corrections lack a governed editorial workflow

The current source rules say to preserve wording while the tests encode exceptions. There is no structured errata field, explanation, approver, or edition scope.

**Recommendation:** store corrections as data, for example: printed value, corrected value, reason, source page, status, and approval. Render a consistent erratum component and generate an errata appendix automatically.

## Quality-of-life improvements (P2)

These are not substitutes for the release blockers, but they would make the app genuinely superior to the PDF:

1. Remember the last chapter/ending/position and offer “Continue reading.”
2. Add bookmarks, personal notes, and a copy-link action for every ending and problem.
3. Add search across title, ending name, prose, player/game caption, and move sequence.
4. Add a distraction-free study mode with a large board, one position at a time, and optional hidden analysis.
5. Add test progress, “reveal all,” reset, and self-assessment without turning the author’s tests into a gamified rewrite.
6. Add configurable board theme, coordinates, orientation, animation, and text size; persist preferences.
7. Add a compact variation tree or move list for branching analysis.
8. Add print-friendly and offline/PWA modes after permissions and source presentation are approved.
9. Add a visible errata/about-edition page and an easy correction-report path.
10. Add per-ending completion markers and a chapter progress summary.

## What is already working well

- The structured content covers the Introduction, Chapters 1–15, and Bibliography, including all 100 numbered endings and both tests.
- The chapter and ending order observed in the app is coherent with the book.
- All audited routes loaded and selected the correct chapter.
- Deep-linked positions resolve and scroll to the intended card.
- Inline move playback and keyboard Left/Right navigation work on representative main lines and variations.
- The SAN audits report zero playback failures and zero actionable unpromoted moves.
- The generated Lichess URLs passed their audit; external links use a new tab and `noreferrer`.
- Problem solution reveal/hide works and exposes `aria-expanded` state.
- No horizontal page overflow was observed at desktop or 390 px mobile width.
- Native chapter selection, semantic headings, visible focus styling, and error states provide a useful accessibility baseline.
- The production build and linter pass, and the representative browser console was clean.

These strengths mean this is a refinement and editorial-governance project, not a rebuild.

## Required pre-demo acceptance gate

The app should not be shown to the author until all of the following are true:

- [x] Every source-to-app difference is enumerated; there are zero unexplained prose, move, prompt, caption, numbering, or diagram differences in the completed PDF-first ledger.
- [x] The approved printed-edition deviation is visibly explained before the Introduction and drives legal playback.
- [x] Jesús de la Villa, the edition/publisher, copyright, and approved book identity are present; the full rights-reservation paragraph is intentionally hidden.
- [x] The Mate entry is retained as an explicit user-approved presentation exception.
- [ ] Long analysis uses normal page scrolling; no lesson can be silently skipped inside an internal scroller.
- [ ] Mobile boards are comfortably readable and can be enlarged.
- [x] All 100 endings are reachable through the approved linkable table of contents.
- [x] Explicit playback controls, coordinates, and book-matched orientation are present; rejected status/key-hint copy is absent.
- [x] Every displayed board/problem has completed source provenance and zero unresolved warning status.
- [ ] Desktop and mobile visual QA has been completed on every chapter, both tests, the Appendix, Bibliography, landing/imprint, and all editorial components.
- [ ] Automated visual comparison covers board piece placement and printed diagram captions for every source position.
- [ ] Accessibility testing includes keyboard-only use, screen-reader position/playback output, zoom/reflow, focus order, and contrast.
- [ ] Performance budgets pass on a real or throttled mid-range phone.
- [ ] A final human chess proofreader has replayed every corrected main line and all test solutions from the displayed starting FENs.
- [ ] The author/publisher has approved the errata presentation and publication identity.

## Recommended execution order

1. Freeze presentation scope and retain Mate as the explicit approved “Coming soon” exception.
2. Agree on attribution, permissions, edition identity, and the exact-vs-errata policy.
3. Complete the source/diagram provenance ledger and resolve all differences.
4. Replace nested scrolling and rebuild responsive board/prose layout.
5. Add ending-level navigation and explicit playback controls.
6. Refine typography, header hierarchy, and desktop space use.
7. Finish accessibility and performance work.
8. Run the complete acceptance gate, then conduct a rehearsal from a clean production build on the exact presentation device.

The core chess reader is credible. The present risk is not that it lacks content; it is that the few visible editorial and product mistakes are exactly the kind that can destroy trust in the whole reconstruction. Closing the blockers above will turn the current solid prototype into something defensible in front of the author.
