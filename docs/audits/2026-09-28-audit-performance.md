# Audit performance inspection — 2026-09-28

A separate 1,000-position sample from the running full audit found an obvious optimization candidate. No production policy or running audit snapshot was changed.

## Measurements

The sample uses node IDs 1, 1001, …, 999001 from the current census. Three fresh processes per variant ran in interleaved order while the exhaustive audit continued.

| Variant | Runs (seconds) | Median |
| --- | --- | --- |
| Current audit worker | 9.307, 9.785, 9.725 | 9.725 |
| Lightweight Black reply descriptors | 5.723, 5.752, 5.818 | 5.752 |

The prototype reduced elapsed time by 40.9% (1.69× throughput) on this sample. Every returned preferred White move, legal Black reply, and graph edge matched exactly across all runs. This is a sample measurement under concurrent load, not a promised full-audit speedup.

## Bottleneck

A CPU profile of the same sample attributed roughly 50% of sampled inclusive time to `chess.moves` and 35% of self time to attack detection. In chess.js 1.4.0, each verbose `Move` constructor regenerates the legal move list, produces SAN, and computes before/after FENs. The rule scorer asks for verbose Black replies for every White candidate, although it primarily consumes destination squares, capture flags, and reply count.

The isolated prototype replaced that one call with public `chess.moves()` and lightweight descriptors for the lone Black king. It derives destinations from generated SAN and capture types from the current board. It retains legal move generation and SAN generation; it avoids the additional verbose-object work. No private chess.js API is used.

The implementation should be promoted only with a named, KBNvK-specific helper and tests covering king captures, checks, mate, stalemate, and score consumers. This inspection deliberately leaves production and the ongoing audit snapshot unchanged.

Other observations: workers were using approximately one CPU each, no macOS thermal warning was reported, and swap was in use. Neither swap nor position centrality was established as the cause of the changing throughput. Later sampled positions did have more legal White candidates (21.29 versus 16.1), which increases scoring work.

Reproduction files (local, ignored by git): `.audit/profile-current-audit.mjs`, `.audit/benchmark-current-audit.mjs`, `.audit/current-audit.cpuprofile`, `.audit/performance-comparison.json`.

## Implemented follow-up

The lightweight reply helper is now used by production KBNvK scoring, so the next audit's workers inherit it automatically. It uses public chess.js legal SAN generation, extracts destination/capture fields, and falls back to verbose moves for callers outside the lone-Black-king case. Black's king is looked up once per scored position. Other proposed optimizations remain unimplemented.

A new before/after comparison used the current r4.5/r4.6/r4.7 policy and 1,500 positions spread across the previous census. All worker outputs—including preferred White branches, legal Black replies, flags, and graph edges—matched exactly. Three interleaved runs per version measured:

- Before: 4.827, 4.896, 4.894 seconds; median **4.894 seconds**.
- After: 3.235, 3.244, 3.691 seconds; median **3.244 seconds**.
- **33.7% less elapsed time**, about **1.51× throughput**, on this sample.

This later measurement was made without the full audit competing for CPU. It is not directly comparable to the earlier benchmark's absolute times and is not a guarantee of whole-audit speedup. No full audit was launched for this change.

Validation: 25 targeted tests plus the production build passed. Reply equivalence covers D4 symmetries, both minor-piece captures, checks, checkmate, stalemate, replay of lightweight descriptors, unchanged board state, and fallback behavior. Local reproduction: `.audit/benchmark-implemented-perf.mjs` and `.audit/implemented-performance-comparison.json`.
