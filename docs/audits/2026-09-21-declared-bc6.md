# Declared support after second-move Bc6

Policy commit: `ae0cbfe`. Seven-stage audited source fingerprint: `16bb3053e8f75145a6d57b8d5e6baeb6232d6f40ebd6098939f52173754cdfa1`. The seven-stage audit bundled the change before committing, so its manifest records the preceding HEAD.

White Kd5, Bc6 and Nd3 against Black Ka5 is now a declared supported five-diagonal position, including reflections and ignoring move counters. This is the position immediately after 2. Bc6 in the loaded line, before Black's Kb6 reply. It meets the strict right-of-Black and bishop-adjacency requirements. Earlier placement restrictions remain for other positions. Bc6 is now a best move. All 194 relevant tests and the application build pass; policy deployment succeeded.

## Seven-diagonal stage

A fresh exhaustive census classified all 13,660,584 legal placements and traced all best-policy ties from all 134,144 supported seven-diagonal post-White starts. Paths continue through smaller diagonals and loss of support. Black follows the application policy with return history. Mate, capture, stalemate and cycles terminate paths; arbitrary legal defense and draw claims are excluded.

| Metric | Before | After |
| --- | ---: | ---: |
| Starts directly on a loop | 8 | 0 |
| Starts that can reach a loop | 560 | 0 |
| Starts that can reach mate | 130,944 | 131,376 |
| Starts that can reach capture or stalemate | 2,784 | 2,784 |
| All downstream cyclic placements | 16 | 0 |
| Cyclic components | 1 | 0 |

Counts include reflections; outcomes overlap. The graph contains 22,004 history states and 22,532 transitions. The loop gate passes. This does not imply forced mate: capture/stalemate branches remain. With no seven-stage loops left, the five-diagonal stage is the next audit cohort in the user's requested order.

Seven-stage artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-bc6-declared-stage7`.

## Five-diagonal stage

The next fresh exhaustive census selected all 13,576 supported five-diagonal post-White starts. It used the same continuation semantics and policy commit. Audit fingerprint: `40233674c020be1db2795fa74a3a9f23a568e3fddf78eab2257ffb9a82aa8d44`.

- Directly on loops: 0.
- Can reach loops: 0.
- Can reach mate: 12,608 (92.8698%).
- Can reach capture/stalemate: 968 (7.1302%).
- Graph: 2,340 history states, 2,413 transitions, zero cyclic components.

The five-stage loop gate passes. There is no five-stage loop witness to load. Five-stage artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-bc6-declared-stage5`.

## Three-diagonal stage

The final fresh exhaustive census selected all 6,756 supported three-diagonal post-White starts, again following paths through support changes. Audit fingerprint: `6a330ff73a35cf16ea006e5f3d1879639d80d928606af8012a1d4b43659baa2a`.

- Directly on loops: 32 (0.4737%).
- Can reach loops: 192 (2.8419%).
- Can reach mate: 5,772 (85.4352%).
- Can reach capture/stalemate: 792 (11.7229%).
- Graph: 1,564 history states, 1,602 transitions, two cyclic components.

Two remaining minimal representatives were aligned with light bishops closer to a8 than h1, and verified for three repetitions from fresh loads, including share decoding:

1. [Kc6, Ba6, Na5 vs Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B1K5/N7/8/8/8/8_w_-_-_0_1&moves=Kb5,Kb8,Kc6,Ka7&cursor=0): Kb5 Kb8 Kc6 Ka7. Reachable from 120 three-diagonal starts. Loaded on localhost with Redo available.
2. [Kd7, Ba6, Nb5 vs Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/3K4/B7/1N6/8/8/8/8_w_-_-_0_1&moves=Bc8,Ka8,Ba6,Kb8&cursor=0): Bc8 Ka8 Ba6 Kb8. Reachable from 72 three-diagonal starts.

The seven- and five-stage loop gates pass; the three-stage gate fails. All stages still contain capture/stalemate branches, so eliminating the remaining loops alone would not establish guaranteed mate.

Three-stage artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-bc6-declared-stage3`.
