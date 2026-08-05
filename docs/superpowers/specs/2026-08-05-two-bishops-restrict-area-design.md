# Two Bishops Restrict Area Design

## Goal

Replace the Phase 1 `distant bishops` and `adjacent bishops` priorities with one visible priority in the same position before `king closer`:

> **restrict area** — Phase 1: Use the bishops to control 3 squares adjacent to Black's king, but not checking the king. If not possible, bishop control a square diagonally adjacent to Black's king, preferring squares closer to the center of the board.

## Mechanics

The rule is Phase 1-only and scores the position after White's move. A king move may therefore preserve a qualifying bishop formation.

The comparison has two lexicographic stages:

1. Count the distinct on-board squares in Black's eight-square neighborhood that are attacked by at least one White bishop. Prefer every non-checking result that controls at least three such squares. Controlling more than three does not add another tie-break.
2. Use the fallback only when no surviving candidate satisfies stage one. Among non-checking results, find the diagonally adjacent squares to Black's king controlled by a White bishop. Prefer the candidate whose best such target is closest to the center, using the existing Manhattan distance to the central four squares. A candidate controlling no diagonal neighbor receives the sentinel worst distance.

The phrase "but not checking the king" applies to both stages. The attack geometry is relative and follows translations, rotations, and reflections. The absolute center preference is invariant under rotations and reflections but intentionally recomputes after translation.

## Scope

Remove all score fields, rule definitions, help entries, and focused tests specific to `distant bishops` and `adjacent bishops`. Do not change Phase classification, universal safety priorities, Phase 2 strategy, Black policy, `king closer`, or `check`. No diagram is required.

## Verification

- Assert exact visible wording and order before `king closer`.
- Cover the primary three-square threshold, four-square ties, distinct-square counting, no-check enforcement, fallback activation, diagonal-only fallback targets, center-distance preference, king moves preserving a formation, and Phase 2 inactivity.
- Cover translated geometry with the center preference recomputed, and cover every D4 transform.
- Run focused Two Bishops and presentation tests, TypeScript, lint, diagram freshness, and diff hygiene.
- Find a strict exact-repetition Phase 1 loop, treating entry into Phase 2 as termination, and open it on the isolated port 5174 server.
