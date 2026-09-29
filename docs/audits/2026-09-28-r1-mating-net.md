# r1 — Execute the mating net

Declared line from `8/8/8/8/8/2K5/B1N5/3k4 w - - 6 4`:

`1. Nd4 Kc1 2. Ne2+ Kd1 3. Kd3 Ke1 4. Ke3 Kd1 5. Bb3+ Ke1 6. Bc2 Kf1 7. Nf4 Ke1 8. Ng2+ Kf1 9. Kf3 Kg1 10. Kg3 Kf1 11. Bd3+ Kg1 12. Be2 Kh1 13. Nf4 Kg1 14. Nh3+ Kh1 15. Bf3#`.

r1 ranks full post-White destination FENs, independent of incoming source or moving piece. All D4 symmetries apply, counters are ignored, and later destinations take priority. It runs before r2 and after mate/pieces-safe/no-stalemate. Other Black replies do not implicitly receive new declarations.

The shared line is in `app/src/mate/rules/bishopKnightMatingNetLine.ts`. The guide GIF is generated from it using the app’s own react-chessboard SVG pieces, with 30 frames (initial position plus every ply), last-move highlights, move captions, and a longer checkmate hold. Regenerate with `app/node_modules/.bin/tsx scripts/generate_bishop_knight_mating_net_gif.mts`; append `--check` for reproducibility verification. The generator uses installed sharp/React and Python Pillow.

Validation: 14 targeted r1/r2 tests pass, including all 15 White moves under all eight symmetries, alternative-source/alternative-piece destination arrivals, full-position negatives, priority ordering, and final checkmate. Type checking, whitespace checks, and GIF regeneration check pass. The frame contact sheet was visually inspected; the new rule and GIF were verified in the browser guide.

Focused graph from the declared start: 513 canonical White states; 839 board-and-turn probes, all tablebase wins. There are 90 D4/phase-deduplicated four-ply loops (79 fully satisfied r4, 11 others). Four new cycles and one removed compared with the previous 87. This is a reachable-state search, not a full-board audit, and does not claim an exhaustive count of longer cycles. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-from-endpoint-2026-09-28/`.

Additional destination: `8/8/8/8/4B3/6KN/8/7k b - - 23 12` (Kg3, Be4, Nh3, Black Kh1), a checkmate. Exact full-destination matching under D4; later than the original declarations, independent of source or moving piece. Original animation line unchanged. All 15 targeted tests pass, including arrival via Be4# and Kg3# and the original 15-move sequence. Focused graph and all 90 four-ply loops are unchanged; 839 board-and-turn probes remain wins. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-be4-mate-from-endpoint-2026-09-28/`.

Full second loaded branch added from `8/8/8/8/3N4/4K3/B7/4k3 w - - 0 1`:

`1. Ne2 Kf1 2. Bd5 Ke1 3. Bb3 Kf1 4. Nf4 Ke1 5. Ng2+ Kf1 6. Kf3 Kg1 7. Kg3 Kh1 8. Bc4 Kg1 9. Bd3 Kh1 10. Nf4 Kg1 11. Nh3+ Kh1 12. Be4#`.

Every post-White destination is included, independent of source or moving piece, with D4. Branch ranks align by remaining plies in their declared lines: the shorter second line starts six plies later than the original. This prevents a newly appended early step from taking priority over an advanced original-line destination. Equal progress can tie at r1; later rules break such ties. Tests confirm every White move in both full lines is uniquely selected, including the newer Bd3 choice. The original GIF is unchanged. All 16 targeted tests, type checks and whitespace checks pass.

Focused search from Kc3/Ba2/Nc2/Black Kd1: 538 canonical White states, 885 winning probes, 91 four-ply loops (79 fully r4, 12 other). Two new and one removed relative to the prior 90. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-be4-branch-from-endpoint-2026-09-28/`.

## Loaded Bb3 branch

Start: `8/8/8/8/8/1B2K3/4N3/5k2 w - - 0 1`.

Declared line: `Nf4 Kg1 Kf3 Kf1 Ng2 Kg1 Kg3 Kf1 Bc4+ Kg1 Bd3 Kh1 Nf4 Kg1 Nh3+ Kh1`. All eight White post-move destinations are now included in r1, across D4, independent of the incoming source or moving piece. The already-declared `Be4#` completes the line for ranking by remaining plies; no new general mating heuristic or source-move exception was added.

All 17 targeted r1/r2 tests pass, including unique production-policy selection of the original 15 White moves, previous 12-move branch, and new eight-move branch plus mate across all eight symmetries. TypeScript and diff checks pass. The original rule-guide GIF remains unchanged.

Focused traversal from the former r2 endpoint: 545 canonical White states, 896 board/turn probes all certified White wins, 91 D4/phase-deduplicated four-ply loops (79 r4-complete throughout, 12 others). Compared with the previous focused graph, 2 cycles disappeared and 2 appeared. This is not a full-board audit. All ten links are replay-verified against current choices. Two newly counted loops cannot satisfy the requested strict corner-distance display orientation, so the links use other verified loops.

Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-bb3-branch-from-endpoint-2026-09-28`.

## Loaded reply to ...Kh2

From the former r2 endpoint, the user loaded:

`Nd4 Kc1 Ne2+ Kd1 Kd3 Ke1 Ke3 Kf1 Bd5 Ke1 Bb3 Kf1 Nf4 Kg1 Kf3 Kh2 Bc4 Kg1 Kg3 Kh1 Bd3 Kg1 Nh3+ Kh1 Be4#`.

r1 now recognizes all White destinations, including the new Bc4 and Kg3 continuations. Destination matching remains full-position, counter-independent and D4 symmetric. Previously established destination ranks remain unchanged; a new destination at equal remaining length ranks just below the earlier declaration. This prevents the shorter branch from promoting backward moves in older lines and preserves their requested Bd3 preference over an alternate Nf4 arrival.

Validation: all 18 targeted tests pass, including unique production-policy selection of all 13 loaded White moves across eight symmetries and all earlier lines. TypeScript and diff checks pass. No commit, push, full-board audit or GIF change.

Focused graph: 552 canonical White states, 903 board/turn positions certified White wins, 91 four-ply loops (79 fully satisfied r4, 12 others); 1 previous loop removed and 1 introduced. Ten current-policy/legal/closure/share-codec verified links saved in `/Users/danielcepeda/repos/_codex_output/bn-r1-kh2-branch-from-endpoint-2026-09-28/focus-report.json`.

## Kd3 after Nd4 ...Ke1

Declared full destination: `8/8/8/8/3N4/3K4/B7/4k3 b - - 9 5`. This now selects Kd3 from the loaded Kc3/Ba2/Nd4/Black Ke1 position and matches alternate sources/moving pieces, all D4, ignoring counters. Rank 1 places it between the initial Nd4 and Ne2 steps. All 19 targeted r1/r2 tests pass; TypeScript and diff checks pass.

The focused graph from the former r2 terminal now has 550 canonical White states and 888 board/turn positions, all tablebase wins. There are 92 D4/phase-deduplicated four-ply loops (79 fully satisfied r4, 13 others), with one old loop removed and two introduced. This is not a full-board audit. Example selection follows the newer requirement: first non-r1 decisions with full paths from the r2 terminal, or loops involving r1. Six first coverage gaps and six r1-involving four-ply loops are available; display six gaps and four loops. Results: `_codex_output/bn-r1-kd3-from-endpoint-2026-09-28` (sibling output directory).

## Loaded Kf2 / Be6 / Bd5 mate branch

Verified browser line from the r2 endpoint: `Nd4 Ke1 Kd3 Kf2 Ne2 Kf3 Be6 Kg2 Ke3 Kh2 Kf3 Kh1 Nf4 Kg1 Bc4 Kh1 Kg3 Kg1 Nh3+ Kh1 Bd5#`.

Added every White destination to r1, preserving existing destination ranks and using the same newer-branch tie priority. All 11 White moves are uniquely preferred under all eight D4 transformations, counters ignored. Final FEN `8/8/8/3B4/8/6KN/8/7k b - - 27 14` is checkmate. All 20 targeted r1/r2 tests pass, including all prior lines; TypeScript and diff checks pass.

Focused search only: 563 canonical White states, 912 board/turn probes (all wins), 94 four-ply loops, 3 removed and 5 introduced compared with prior graph. Seven first r1 coverage gaps and eight r1-involving four-ply loops. The delivered ten examples are seven gaps (full terminal-origin replay ending before the decision) and three loops with a light-square bishop and Black near rank 1. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-kf2-branch-from-endpoint-2026-09-28`. No commit/push or full audit.

## Loaded partial Kf1 / Bf5 continuation

Read the browser line from the r2 endpoint through the current cursor: `Nd4 Ke1 Kd3 Kf1 Ke3 Kg2 Ne2 Kh2 Be6 Kg2 Bf5 Kh1 Kf3 Kh2`. Add every White destination, not source-move exceptions, across D4 and with counters ignored. Preserve existing ranks; use observed ply order for the new partial-line destinations without claiming a distance to an undeclared mate.

All seven loaded White moves are uniquely selected in all eight orientations. All 21 targeted r1/r2 tests, TypeScript, and diff checks pass; earlier full mating lines remain selected. Current endpoint: `8/8/8/5B2/8/5K2/4N2k/8 w - - 20 11`.

Focused graph from the former r2 terminal: 582 canonical White states, 939 board/turn probes all White wins, 98 four-ply loops (79 fully satisfied r4, 19 others), 2 old loops removed, 6 introduced. Nine first r1 coverage gaps and twelve r1-involving loops. Deliver nine full-path gaps and one loop. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-kf1-partial-from-endpoint-2026-09-28`. No full-board audit, commit or push.

## Loaded 4.Ke3 after ...Kf1

Browser line: `Nd4 Ke1 Kd3 Kf2 Ne2 Kf1 Ke3 Ke1`. Added full post-White destination `8/8/8/8/8/4K3/B3N3/5k2 b - - 13 7`, with Black still on f1 (not the later e1 square). Rank 7. All eight D4 equivalents uniquely select Ke3; counters ignored. Complete loaded replay also verified. All 22 targeted r1/r2 tests and TypeScript/diff checks pass.

Focused graph: 574 canonical White states, 927 board/turn probes all White wins, 97 four-ply loops; one removed, none introduced. Eight first coverage gaps and eleven r1-involving loops. Deliver eight terminal-origin gap links and two loops. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-ke3-f1-from-endpoint-2026-09-28`. No full-board audit or commit/push.

## Loaded Kg1 / Ne2+ / Kf3 branch

Browser line: `Nd4 Ke1 Kd3 Kf1 Ke3 Kg1 Ne2+ Kh2 Be6 Kh1 Kf3 Kh2 Nf4 Kg1 Bc4 Kh1 Kg3 Kg1 Nh3+ Kh1 Bd5#`. Added the missing White destinations (notably Ne2+, Kf3, Nf4) through the same full-destination, D4, counter-independent mechanism. Preserve all existing destination ranks. All 11 loaded White moves uniquely selected across D4; earlier lines preserved. All 23 targeted r1/r2 tests, TypeScript and diff checks pass.

Focused graph: 553 canonical White states, 898 board/turn probes all White wins, 96 four-ply loops (79 r4-complete, 17 others); four old loops removed, three introduced. Five first r1 coverage gaps, ten r1-involving loops. Deliver five full-path gaps and five loops. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r1-kg1-branch-from-endpoint-2026-09-28`. No full-board audit or commit/push.

## Corrected bishop-first path

Loaded correction: `Nd4 Ke1 Kd3 Kf2 Ne2 Kg2 Be6 Kf3 Bf5 Kf2 Be4 Ke1 Ke3 Kd1 Bd3 Ke1`.

Before correction, the full destination of an earlier Ne2 declaration caused premature Ke3 after Ne2 ...Kg2. The new Be6 destination now outranks it at this source; Ke3 is explicitly tested as rejected there. New partial-line destinations occupy progress ranks 6.5–10.5 in observed order, below later established bishop placements. This preserves earlier explicitly declared lines while selecting all eight corrected White moves across D4. Full position matching still ignores counters and source/moving piece. No broad rule inference added.

All 24 targeted r1/r2 tests, TypeScript and diff checks pass. Focused graph: 586 canonical White states, 948 board/turn probes all White wins, 100 four-ply loops; four new, none removed. Eight first coverage gaps and fourteen loops involving r1; deliver eight full-path gaps and two loops. Results: `/Users/danielcepeda/repos/_codex_output/bn-r1-corrected-bishop-from-endpoint-2026-09-28`. No full-board audit, commit or push.

## Declared 5.Ke3 after Be6 ...Kh1

Added full post-White destination `8/8/4B3/8/8/4K3/4N3/7k b - - 15 8` across D4, ignoring counters. Its rank 11 preserves the later Kf3 continuation and all earlier declared lines. The loaded route from the r2 endpoint through Nd4 Ke1 Kd3 Kf2 Ne2 Kg2 Be6 Kh1 Ke3 now follows the production policy throughout.

Validation: all 25 targeted r1/r2 tests, TypeScript, and diff whitespace checks pass. The new regression checks the unique Ke3 choice across all eight D4 transformations and replays the loaded route.

Focused exhaustive reachability from the former r2 endpoint (not a full board-space audit): 585 canonical White states, 945 winning board/turn probes, 97 four-ply loops (79 r4-complete, 18 others). Compared with the preceding focused run, three four-ply loops disappear and none are introduced. There are six first r1 coverage gaps and eleven r1-involving four-ply loops available for presentation. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-ke3-h1-from-endpoint-2026-09-28`.

## Loaded 5.Ke3 after Be6 ...Kf1

Added exact full destination `8/8/4B3/8/8/4K3/4N3/5k2 b - - 15 8`, across D4, ignoring counters. Rank 7.5 retains earlier declared Bd5 choices from Ba2. Replayed all 14 White moves in the supplied log across all eight symmetries: all are preferred and covered by r1. The new Ke3 choice is unique. Bd3 was already covered by r1; r20 can be the displayed last tiebreaker.

All 26 targeted r1/r2 tests, TypeScript and whitespace checks pass. Focused reachability from the r2 endpoint: 567 White states, 920 winning board/turn probes, 96 four-ply loops, 1 introduced and 2 removed. Four first r1 coverage gaps and ten r1-involving loops. Present four gaps and six loops. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-ke3-f1-bishop-from-endpoint-2026-09-28`. No full audit, commit or push.

## Loaded 2.Kg3 after Nf4 ...Kh1

Added full destination `8/8/4B3/8/5N2/6K1/8/7k b - - 3 2`, rank 19.5, across D4 with counters ignored. The supplied route Nf4 Kh1 Kg3 Kg1 Bc4 Kh1 Bd3 Kg1 Nh3+ Kh1 Be4# is selected throughout across all eight symmetries, with unique Kg3 preference. All 27 targeted r1/r2 tests, TypeScript and diff checks pass; previous lines preserved.

Focused r2-endpoint graph: 568 canonical White states, 922 winning board/turn probes, 95 four-ply loops (16 not fully r4-satisfied). 1 loops removed, 0 introduced. Four first r1 gaps, nine r1-involving loops. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-kg3-be6-from-endpoint-2026-09-28`. No full board audit, commit or push.

## Declared Be6 / Ng2 / Bc4+ / Kg3 finish

From `8/8/8/8/2B2N2/5K2/7k/8 w - - 0 1`, the entire supplied Be6 Kg1 Ng2 Kf1 Bc4+ Kg1 Kg3 Kh1 Nf4 Kg1 Nh3+ Kh1 Bd5# line now follows r1. Added full destinations for Ng2, Bc4+, and Kg3 at ranks 17.5, 21.5 and 21, across D4 and ignoring counters. The earlier direct Bc4 arrival with Kf3/Nf4/Black Kg1 is reranked to 17, so the latest explicit Ng2 wins. Two prior branches reach that same source; their regression finishes now follow the newly declared route and still reach mate. Other prior route tests retained.

All 28 targeted r1/r2 tests pass, including all eight symmetries of this complete line and unique choices for the three requested moves. TypeScript and diff checks pass. Focused r2-endpoint graph: 571 White states, 927 winning board/turn probes, 94 four-ply loops; 1 removed, 0 introduced. Four first r1 gaps, eight r1-involving loops. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-ng2-be6-from-endpoint-2026-09-28`. No full audit, commit or push.

## Declared 2.Kf3 with Bc2/Nf4 after ...Kg1

Added full destination `8/8/8/8/5N2/5K2/2B5/6k1 b - - 3 2`, rank 15, across D4 with counters ignored. Both White choices in the supplied Nf4 Kg1 Kf3 replay are unique and r1-covered across all eight symmetries. All 29 targeted r1/r2 tests, TypeScript and diff checks pass.

Focused r2-endpoint graph: 589 White states, 953 winning board/turn probes, 95 four-ply loops; 1 removed, 2 introduced. Five first r1 gaps and nine r1-involving loops. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-kf3-bc2-from-endpoint-2026-09-28`. No full audit, commit or push.

## Corrected loaded early Ne2 order

Read the live board and move log through CUA: start at the r2 endpoint, Nd4 Ke1 Kd3 Kf1 Ne2. Added full destination `8/8/8/8/8/3K4/B3N3/5k2 b - - 11 6`, rank 4.5, D4 and counter-independent. It supersedes the previous early Ke3 choice. Two historical route tests assert corrected Ne2 at that source, then replay their old legal continuations to retain downstream destination coverage; they no longer claim that the entire historical line is selected. The new regression verifies every move in the corrected loaded line across D4.

All 30 targeted tests, TypeScript and diff checks pass. Focused graph: 602 White states, 973 winning board/turn probes, 96 four-ply loops; 0 removed, 1 introduced. Five first r1 gaps and ten r1-involving loops. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-ne2-order-from-endpoint-2026-09-28`. No full audit, commit or push.

## Loaded Bd5 / Ke3 / Bd3 continuation

Read the browser starting FEN `8/8/8/8/8/3K4/B3Nk2/8 w - - 12 7` and complete 24-ply line: Bd5 Ke1 Ke3 Kd1 Bb3+ Ke1 Bc2 Kf1 Nf4 Ke1 Ng2+ Kf1 Kf3 Kg1 Kg3 Kh1 Bd3 Kg1 Be2 Kh1 Nf4 Kg1 Nh3+ Kh1. Added the three missing full post-White destinations for Bd5, Ke3 and Bd3, ranks 5/9/20.5, across D4 and ignoring counters. All twelve White choices now uniquely match r1 across eight symmetries.

All 31 targeted r1/r2 tests, TypeScript and diff checks pass. Focused r2-endpoint graph: 556 White states, 903 winning board/turn probes, 93 four-ply loops; 3 removed, 0 introduced. Three first r1 gaps and seven r1-involving loops. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-bd5-ke3-from-endpoint-2026-09-28`. No full audit, commit or push.

## Loaded 7.Ke3 after Be4 ...Kf1

Read the entire live 33-ply mating line from the r2 endpoint through Bf3#. Only 7.Ke3 lacked r1 coverage. Added full destination `8/8/8/8/4B3/4K3/4N3/5k2 b - - 19 10`, rank 7.75, across D4 with counters ignored. All seventeen White choices are unique r1 destinations in all eight symmetries. All 32 targeted tests, TypeScript and diff checks pass.

Focused graph: 548 White states, 890 winning board/turn probes, 91 four-ply loops; 2 removed, 0 introduced. Only two first r1 gaps and five r1-involving loops qualify for the requested examples; show all seven without padding. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-ke3-be4-from-endpoint-2026-09-28`. No full audit, commit or push.

## Loaded 9.Bd3 after Kf3 ...Kh2

Read the live 23-ply Be4# line from the r2 endpoint. Added full destination `8/8/8/8/5N2/3B1K2/7k/8 b - - 23 12`, rank 18.5, across D4 with counters ignored. All twelve White choices uniquely match r1 across all eight symmetries and end in checkmate. All 33 targeted tests, TypeScript and diff checks pass.

Focused graph: 542 White states, 878 winning board/turn probes, 90 four-ply loops; 1 removed, 0 introduced. One first r1 gap and four r1-involving loops qualify; show all five. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-bd3-kh2-from-endpoint-2026-09-28`. No full audit, commit or push.

## Loaded 9.Kg3 and 10.Bd3 after Kf3 ...Kh1

Read the live 25-ply Bf3# route from the r2 endpoint. Added full Kg3/Bc2/Nf4/Black Kh1 destination at rank 19 and Bd3/Kg3/Nf4/Black Kg1 destination at rank 21.5. The latter remains below the established Be2 stage so older continuations do not step backward. All thirteen White moves uniquely match r1 across D4; counters ignored. All 34 targeted tests, TypeScript and diff checks pass.

Focused graph: 92 canonical White states, 154 winning board/turn probes, 3 four-ply loops; 87 removed, 0 introduced. No first r1 coverage gaps remain. Three r1-involving four-ply loops remain and all are shown. This is a complete graph from the specified r2 endpoint, not a full board-space audit or a claim that all continuations mate. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-kg3-bc2-from-endpoint-2026-09-28`. No commit or push.

## Loaded Bf5 / Kf3 / Nf4 / Bd3 finish

Read starting FEN `8/8/4B3/8/8/4K3/4N1k1/8 w - - 0 1` and full line Bf5 Kh2 Kf3 Kh1 Nf4 Kh2 Bd3 Kh1 Kg3 Kg1 Nh3+ Kh1 Be4#. Added full Kf3 and Nf4 destinations (ranks 16/18), and promoted the Bd3 destination to20, all D4 and counter-independent. This destination priority also supersedes Be6 from Bc4 with otherwise identical pieces; recorded that consequence to the user. Historical route regression checks the replacement first choice and preserves all downstream checks. The seven loaded White moves uniquely match r1 in all eight symmetries and reach checkmate.

All 35 targeted tests, TypeScript and diff checks pass. Focused graph: 95 White states, 159 winning board/turn probes, 2 four-ply loops; 1 removed, 0 introduced. No first r1 gaps, two r1-involving four-ply loops. Output: `/Users/danielcepeda/repos/_codex_output/bn-r1-bf5-finish-from-endpoint-2026-09-28`. No full audit, commit or push.

## Concrete reachability witnesses for the last two loops

The isolated example links were reflected orientations, obscuring their relation to the original r2 terminal. Rebuilt a physical (non-D4-deduplicated) BFS of all current preferred White moves and legal Black replies: 103 physical White states. Verified every White move is both selected and r1-covered, all Black replies legal, and one full cycle closes exactly.

- Root path Nd4 Ke1 Kd3 Kf2 Ne2 Kf3; loop Be6 Kf2 Ba2 Kf3.
- Root path Nd4 Ke1 Kd3 Kf2 Ne2 Kf3 Be6 Kf2; loop Ba2 Kg2 Be6 Kf2.

Saved `verified-loop-paths.json` in the latest focused-output directory. Opened the second complete path in the browser and verified root FEN plus all six rows were present and selected by r1. Future r1 loop links should include root paths in their original orientation. No policy change.
