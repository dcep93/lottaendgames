# Exhaustive unsupported-position audit after the r5 loop prescriptions

Policy commit: `d21e05b11809f54c837b912a4eda4c161e98d0f9`. Audit fingerprint: `edb5dccff70bfcac1d6ab40c7c8c0803b6aeefbfcfbe701d59e6d327bdcca68c`.

No move-selection rules were changed for this audit. Every supported post-White placement is terminal; paths are never continued through support.

## Direct cycle membership

| Population | Positions | Percentage of unsupported positions |
| --- | ---: | ---: |
| Unsupported placements | 13,461,172 | 100.000000% |
| Directly on an unsupported cycle | 56 | 0.000416% |
| Not directly on a cycle | 13,461,116 | 99.999584% |
| Fresh starts that can return to a cycle containing themselves | 16 | 0.000119% |
| Can eventually reach an unsupported cycle | 11,936 | 0.088670% |
| Cannot reach an unsupported cycle | 13,449,236 | 99.911330% |

The direct-cycle percentage is the requested measure. It excludes lead-ins. The fresh-start count additionally requires that a position with no prior history can reach a cycle containing itself. Eventual reach is broader and includes lead-ins. These are not interchangeable.

Previous full audit: 240 direct placements; current: 56. Retained: 8; removed: 232; newly cyclic: 48.

## Piece-position archetypes

| Placement archetype | Direct positions | Share of direct positions | Previous count | Replay |
| --- | ---: | ---: | ---: | --- |
| Central bishop, king-defended; knight on precage | 56 | 100.00% | 72 | [Loop 1](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/8/4B3/3NK3/8/8_w_-_-_0_1&moves=Kf4,Kd6,Ke3,Ke7&cursor=0) |

Groups partition individual post-White positions, not loop families. A loop can pass through several archetypes; its linked example shows the archetype at one or more White moves. Every link contains a full replay with cursor zero so Redo can play it.

### Group definitions

Central means d4, e4, d5, or e5. First split central bishops by king protection, and protected central bishops by whether the knight occupies a precage square. For non-central bishops, check knight protection first, then king protection. For an undefended non-central bishop, check whether the king protects the knight; otherwise split by whether the king is central. "Separated" means neither minor is adjacent to White's king and the bishop is not knight-defended.

Precage means diagonally adjacent to a central bishop, off both long diagonals, and strictly behind the bishop relative to Black's king (negative direction dot product). No played move or selecting rule is used for these labels.

### Additional overlapping placement features

| Feature | Direct positions | Share |
| --- | ---: | ---: |
| White king on edge | 0 | 0.00% |
| Central White king | 8 | 14.29% |
| Central bishop | 56 | 100.00% |
| Black adjacent to bishop | 0 | 0.00% |
| Black adjacent to knight | 0 | 0.00% |
| Knight-defended non-central bishop attacked by Black without king defense | 0 | 0.00% |

## All remaining minimal loops

Each link starts with a light-squared bishop closer to h1 than a8. Every move remains best for three repetitions, and every post-White position is unsupported. These are five distinct four-ply cycles containing seven distinct positions modulo board symmetry (56 physical placements).

| Loop | Reachable unsupported starts | Share of looping starts | Replay |
| --- | ---: | ---: | --- |
| 3 | 11,416 | 95.64% | [Ke3 Ke6 Kf4 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/4BK2/3N4/8/8_w_-_-_0_1&moves=Ke3,Ke6,Kf4,Kd6&cursor=0) |
| 4 | 472 | 3.95% | [Ke3 Ke6 Kf4 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/4BK2/3N4/8/8_w_-_-_0_1&moves=Ke3,Ke6,Kf4,Kf6&cursor=0) |
| 2 | 24 | 0.20% | [Kf4 Kd6 Ke3 Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/8/4B3/3NK3/8/8_w_-_-_0_1&moves=Kf4,Kd6,Ke3,Kd7&cursor=0) |
| 5 | 16 | 0.13% | [Ke5 Kf7 Kf5 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/5K2/4B3/3N4/8/8_w_-_-_0_1&moves=Ke5,Kf7,Kf5,Kg7&cursor=0) |
| 1 | 8 | 0.07% | [Kf4 Kd6 Ke3 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/8/4B3/3NK3/8/8_w_-_-_0_1&moves=Kf4,Kd6,Ke3,Ke7&cursor=0) |

All five cycles alternate an r5 king prescription with an r10 king move. The dominant loop is `Ke3 Ke6 Kf4 Kd6`: r10 returns White from f4 to e3, and r5 sends it back to f4. It accounts for 11,416 of the 11,936 looping starts (95.64%). No White king is on the edge in these cyclic positions, and Black is adjacent to neither minor.

All 19 previous representative cycles were broken, but that did not establish zero globally: eight previously cyclic physical placements now participate in new cycles, and 48 additional placements became cyclic. The exhaustive graph also retains incoming history that the fresh-start reroute probe did not cover.

Direct membership fell 76.67% (240 to 56); eventual loop reach fell 32.85% (17,776 to 11,936). Starts having only loop outcomes increased from 8,136 to 9,600, so the remaining loops are fewer but still attract many starting positions.

## Cycle verification and scope

Five closed cyclic components, each with a four-ply minimal loop; all five are fresh-load verified. Their post-White positions cover all 56 directly cyclic placements. The complete graph has 1,456,735 history states and 1,441,340 transitions.

All tied best White moves and tied best Black replies are included. Graph nodes retain the previous White-turn board because Black's return preference is history-dependent. Every post-White board on an internal cyclic-component edge is counted once, deduplicated across histories and components, then weighted back from D4 representatives to physical placements. Every included board was independently checked against the saved unsupported root classification.

This is exhaustive over 13,660,584 distinct KBNvK post-White placements with distinct piece squares and nonadjacent kings, both bishop colors and all eight board symmetries; it is not a retrograde reachability proof. The unsupported denominator is 13,461,172. Branches stop at support, mate, stalemate, or minor capture. Black follows the app’s best-reply policy, not arbitrary legal defense. Repetition claims and move clocks are excluded. Not reaching a loop does not by itself mean forced mate.

The scaffold compares optimized evaluation with unmodified production evaluation, validates 1,000 random positions under all eight symmetries, independently checks SCC reachability by sink removal, and replays each fresh-load witness three times through production move selection. The placement example postprocessor also checks that each representative returns to its starting board for the first time at the end of the supplied loop.

## Reproduction

```sh
cd app
npm run audit:unsupported -- --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r5-loop-prescriptions --workers 8 --compare /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r92-all-attacked/result.json
```

Complete immutable graph, bundles, checks, and manifest: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r5-loop-prescriptions`.
Placement extraction: `/Users/danielcepeda/repos/_codex_output/placement-audit.py`; replay matching: `placement-examples.mts` in the same scratch directory. The checked-in companion JSON preserves the counts, geometry, representatives, and changes from the previous baseline.
