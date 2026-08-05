# Two Bishops Restrict Area: Two Diagonals Design

## Goal

Revise the visible Phase 1 priority to:

> **restrict area** — Phase 1: Use the bishops to control 2 diagonals adjacent to Black's king, but not checking the king. If not possible, bishop control a square diagonally adjacent to Black's king, preferring squares closer to the center of the board.

## Interpretation

"Control 2 diagonals adjacent" means that the resulting bishops attack at least two distinct on-board squares diagonally adjacent to Black's king. A square controlled by both bishops counts once. Controlling three or four diagonal neighbors does not add another tie-break.

## Mechanics

The rule remains Phase 1-only and scores the position after White's move. A king move may preserve a qualifying bishop formation.

The comparison has two lexicographic stages:

1. Count the distinct diagonally adjacent squares to Black's king attacked by at least one White bishop. Accept every non-checking result controlling at least two such squares.
2. Use the fallback only when no surviving candidate satisfies stage one. Among non-checking results controlling at least one diagonal neighbor, prefer the candidate whose best controlled target is closest to the center, using the existing Manhattan distance to the central four squares. A candidate controlling none receives the sentinel worst distance.

The non-checking requirement applies to both stages. Relative attack geometry follows translations, rotations, and reflections. Absolute center preference follows rotations and reflections and intentionally recomputes after translation.

## Scope

Replace the former eight-neighbor three-square score with the diagonal-neighbor two-square score. Keep the rule in its current slot before `king closer`. Do not change phase classification, universal safety priorities, Phase 2 rules, Black policy, `king closer`, or `check`. No diagram is required.

## Verification

- Assert the exact visible wording and order.
- Cover the two-diagonal threshold, the tie above the threshold, distinct-square counting, no-check enforcement, and fallback center preference.
- Cover a king move preserving the bishop formation, Phase 2 inactivity, D4 symmetry, and translated center recomputation.
- Run focused and full Two Bishops tests, presentation tests, TypeScript, lint, diagram freshness, and diff hygiene.
- Find a strict exact-repetition Phase 1 loop, treating entry into Phase 2 as termination, and open it on the isolated port 5174 server.
