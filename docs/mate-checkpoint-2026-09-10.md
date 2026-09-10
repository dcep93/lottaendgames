# Mate checkpoint — 10 September 2026

All **312,286 app-eligible two-bishops starting positions**, reduced by board symmetry, reach checkmate. The search followed every tied preferred White move and every legal Black reply. The longest path is **95 plies**; there are no loops, stalemates, material-loss failures, or 50-move failures in this scope.

## Cleanup

- Bishop-and-knight now computes only the five retained priorities. Position-level context is shared across candidates, and surviving king scores are evaluated lazily. Its main rule module shrank from 985 to 441 lines after the requested rule removal; obsolete strategy helpers were also removed.
- Replaced obsolete tests for the four deliberately removed priorities with coverage of the retained policy. Preserved their legal examples in a 208-position corpus, checked against independent chess.js mate, capture and stalemate results. Kept the mating-net source snapshot, all transformed lookup routes, Black resistance, finishing-line checks, and the known four-ply loop.
- Updated 32 stale two-bishops test expectations for the current target occupancy restriction, r8/r10 split, smaller-crossing exception, rule order and beyond-wall preference. Rule-specific geometry remains tested separately from upstream preferences. The universal former-stalemate regression is unchanged.
- Corrected the catalog test to use the current four training starts.
- Hardened audit cache fingerprints: Two Bishops now includes `twoBishopsPieces.ts`; Bishop and Knight includes shared `blackPriorities.ts`. A regression changes each dependency in an isolated fixture and verifies that cached recommendations invalidate while legal-transition fingerprints remain stable.

Production queen, rook, two-bishops and two-knights rules were unchanged. Review of their shared selection, session, terminal-state and generated-data paths found no further change necessary for this checkpoint.

## Verification

- `npm run test:mate`: **516 passed, zero failed**. Includes verifier types, reproducible queen/rook progress data, generated two-knights construction, shared selection/session/replay tests and all five endgames.
- After fingerprint hardening: all **3 cache tests** pass, including the new invalidation regression; verifier typecheck and lint pass again.
- `npm run build` and mate/verifier lint pass.
- Before/after comparison: **1,202 positions**, identical preferred White choices and Black candidates (40 queen, 65 rook, 883 two-bishops, 208 bishop-and-knight, 6 two-knights-vs-pawn).
- Bishop-and-knight benchmark: median **1891 ms → 866 ms**, **54.2% less time**, for White selection across 208 positions. Five alternating-order trials after warmup in one process; no audit workers running. This measures that corpus, not a universal speed guarantee.
- Queen/rook progress data regenerated identically: 46,137 / 50,015 states; maximum winning ranks 20 / 32.
- Two-knights-vs-pawn: 256 bounded resistance paths mate, longest 27 plies, within the committed construction scope.

## Exhaustive two-bishops audit

| Measure | Result |
| --- | ---: |
| Canonical starting positions | 312,286 |
| Expanded White positions | 312,426 |
| Preferred White choices | 312,998 |
| Legal Black replies | 1,314,823 |
| Maximum mate length | 95 plies |
| Loop-leading starts | 0 |
| Other failure-leading starts | 0 |
| 50-move-only failures | 0 |
| Expansion and analysis time | 11.92 minutes, 6 workers |

An independent Python implementation used Kosaraju strongly connected components, ancestor propagation and longest-path ranks. It agreed with every root outcome and the 95-ply maximum. It found zero cyclic components. Another check compared **12,616 transformed selections and rule-filter counts** across 1,577 roots, plus 200 move-counter checks, with zero discrepancies. The complete raw-geometry orbit-pruning test also passed.

The scope is opposite-colored KBBK, White to move, with a fresh halfmove clock and no prior repetition history: all starts admitted by the app’s standard generator plus training seeds, and every reachable White position. Standard eligibility excludes positions where White has no move preserving both bishops against all legal replies. This is not a claim about arbitrary pasted FENs or positions already near the draw limit.

Root keys were reused only after matching the previous complete enumeration’s engine and enumeration/eligibility implementation. **No policy expansions or results were reused.** Every node was freshly expanded. The audit refused source changes during expansion.

The [machine-readable record](mate-checkpoint-2026-09-10.json) preserves the original audit fingerprints, independent checks, benchmark and source hashes. Fingerprint hardening followed the census; the only subsequent runtime/verifier source change is fingerprint coverage in `development-cache.mts`. All application rules and graph-building/analysis code match the audited sources. The old cache will intentionally fail fingerprint validation under the hardened verifier.

## Rule-filter counts

Each canonical expanded White position is counted once. “Positions affected” counts positions where the rule removed at least one remaining candidate; “Moves eliminated” counts those candidates. These are not counts multiplied by how many paths visit a position.

| Rule | Moves eliminated | Positions affected |
| --- | ---: | ---: |
| mate | 9,503 | 455 |
| bishops safe | 904,610 | 229,480 |
| no stalemate | 6,777 | 4,911 |
| rule r1 | 54,248 | 3,047 |
| rule r3 | 984,719 | 166,720 |
| rule r4 | 14,565 | 850 |
| rule r5 | 35,424 | 2,042 |
| rule r5.5 | 5,943 | 362 |
| rule r6 | 624,705 | 33,938 |
| rule r6.2 | 95 | 5 |
| rule r6.4 | 21,697 | 1,353 |
| rule r7 | 1,923,159 | 220,677 |
| rule r8 | 1,742,581 | 218,780 |
| rule r9 | 3,524 | 503 |
| rule r10 | 251,975 | 60,707 |
| rule r19 | 10,946 | 4,013 |
| rule r24 | 8,738 | 964 |
| rule r24.5 | 35,268 | 20,387 |
| rule r25 | 15,722 | 8,244 |
| rule r30 | 91,702 | 27,217 |

[Download the counts as CSV](two-bishops-rule-counts-2026-09-10.csv).

## Unfinished endgames

Bishop-and-knight retains the requested reduced policy and still permits `Ne8 Kf5 Ng7+ Kg6` from `8/6N1/6k1/8/B7/3K4/8/8 w - - 0 1`. Its finishing patterns pass; general termination is not certified. Two-knights-vs-pawn remains limited to its curated starts and verified construction; this checkpoint does not certify unrestricted KNNKP positions.
