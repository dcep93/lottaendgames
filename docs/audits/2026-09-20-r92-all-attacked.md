# Exhaustive unsupported-position audit after r9.5, r9.1, and r9.2

Policy commit: `05bd979955ea8669c6959c2834a6806724d0e326`. Audit fingerprint: `3a7ba048047872d91b6ed466bd79b7ea88498a429dae54730b93a15474223524`.

No move-selection rules were changed for this audit.

## Direct cycle membership

| Population | Positions | Percentage of unsupported positions |
| --- | ---: | ---: |
| Unsupported placements | 13,461,172 | 100.000000% |
| Directly on an unsupported cycle | 240 | 0.001783% |
| Not directly on a cycle | 13,460,932 | 99.998217% |
| Fresh starts that can return to a cycle containing themselves | 40 | 0.000297% |
| Can eventually reach an unsupported cycle | 17,776 | 0.132054% |
| Cannot reach an unsupported cycle | 13,443,396 | 99.867946% |

The direct-cycle percentage is the requested measure. It excludes lead-ins. The fresh-start count additionally requires that a position with no prior history can reach a cycle containing itself. Eventual reach is broader and includes lead-ins. These are not interchangeable.

Previous full audit: 488 direct placements; current: 240. Retained: 200; removed: 288; newly cyclic: 40.

## Piece-position archetypes

| Placement archetype | Direct positions | Share of direct positions | Previous count | Replay |
| --- | ---: | ---: | ---: | --- |
| Central bishop, king-defended; knight on precage | 72 | 30.00% | 72 | [Loop 8](http://localhost:5173/mate/bishop-knight#fen=8/5k2/8/8/4B3/3NK3/8/8_w_-_-_0_1&moves=Kd4,Ke6,Ke3,Kf7&cursor=0) |
| Undefended non-central bishop; king protects knight | 56 | 23.33% | 56 | [Loop 2](http://localhost:5173/mate/bishop-knight#fen=5N2/4K1k1/8/8/8/8/8/7B_w_-_-_0_1&moves=Ba8,Kg8,Bh1,Kg7&cursor=0) |
| Central king separated from both minors | 32 | 13.33% | 128 | [Loop 13](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2k1/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg3,Bf1,Kg4&cursor=0) |
| Central bishop without king protection | 24 | 10.00% | 24 | [Loop 1](http://localhost:5173/mate/bishop-knight#fen=5K2/7k/8/3B4/2N5/8/8/8_w_-_-_0_1&moves=Ke7,Kg6,Kf8,Kh7&cursor=0) |
| Non-central bishop defended only by king | 24 | 10.00% | 56 | [Loop 7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/4NB2/5K2/8/8/8_w_-_-_0_1&moves=Ke4,Kf6,Kf4,Kg7&cursor=0) |
| Central bishop, king-defended; knight off precage | 16 | 6.67% | 24 | [Loop 5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/3NB3/3K4/8/8_w_-_-_0_1&moves=Bh1,Kf4,Be4,Ke5&cursor=0) |
| Non-central bishop defended by knight | 16 | 6.67% | 96 | [Loop 6](http://localhost:5173/mate/bishop-knight#fen=8/5Bk1/3NK3/8/8/8/8/8_w_-_-_0_1&moves=Ke7,Kh6,Ke6,Kg7&cursor=0) |

Groups partition individual post-White positions, not loop families. A loop can pass through several archetypes; its linked example shows the archetype at one or more White moves. Every link contains a full replay with cursor zero so Redo can play it.

### Group definitions

Central means d4, e4, d5, or e5. First split central bishops by king protection, and protected central bishops by whether the knight occupies a precage square. For non-central bishops, check knight protection first, then king protection. For an undefended non-central bishop, check whether the king protects the knight; otherwise split by whether the king is central. "Separated" means neither minor is adjacent to White's king and the bishop is not knight-defended.

Precage means diagonally adjacent to a central bishop, off both long diagonals, and strictly behind the bishop relative to Black's king (negative direction dot product). No played move or selecting rule is used for these labels.

### Additional overlapping placement features

| Feature | Direct positions | Share |
| --- | ---: | ---: |
| White king on edge | 8 | 3.33% |
| Central White king | 136 | 56.67% |
| Central bishop | 112 | 46.67% |
| Black adjacent to bishop | 24 | 10.00% |
| Black adjacent to knight | 72 | 30.00% |
| Knight-defended non-central bishop attacked by Black without king defense | 0 | 0.00% |

## Cycle verification and scope

19 cyclic components, all represented by four-ply minimal loops. All 19 representatives are fresh-load verified. Their post-White positions cover every one of the 240 directly cyclic placements after restoring symmetry weights; this is not merely a sample of the cyclic population.

All tied best White moves and tied best Black replies are included. Graph nodes retain the previous White-turn board because Black's return preference is history-dependent. Every post-White board on an internal cyclic-component edge is counted once, deduplicated across histories and components, then weighted back from D4 representatives to physical placements. Every included board was independently checked against the saved unsupported root classification.

This is exhaustive over 13,660,584 distinct KBNvK post-White placements with distinct piece squares and nonadjacent kings, both bishop colors and all eight board symmetries; it is not a retrograde reachability proof. The unsupported denominator is 13,461,172. Branches stop at support, mate, stalemate, or minor capture. Repetition claims and move clocks are excluded. Not reaching a loop does not by itself mean forced mate.

The scaffold compares optimized evaluation with unmodified production evaluation, validates 1,000 random positions under all eight symmetries, independently checks SCC reachability by sink removal, and replays each fresh-load witness three times through production move selection. The placement example postprocessor also checks that each representative returns to its starting board for the first time at the end of the supplied loop.

## Reproduction

```sh
cd app
npm run audit:unsupported -- --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r92-all-attacked --workers 8 --compare /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r25/result.json
```

Complete immutable graph, bundles, checks, and manifest: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r92-all-attacked`.
Placement extraction: `/Users/danielcepeda/repos/_codex_output/placement-audit.py`; replay matching: `placement-examples.mts` in the same scratch directory. The checked-in companion JSON preserves the counts, geometry, representatives, and changes from the previous baseline.
