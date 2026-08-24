# Two Bishops Rule X Edge Design

## Goal

Update Rule X to read and behave as:

> **rule x** — Phase 2: Force Black's king to stay on the edge, preferring towards the corner, preferring checks.

## Ranking

Rule X applies from a Phase 2 starting position and uses the proximate corner belonging to Black's tightest eligible bishop wall.

Rank candidate White moves lexicographically:

1. Prefer moves for which Black has at least one legal reply and every legal Black reply leaves Black's king on a board edge.
2. Among equally edge-forcing moves, minimize the worst Chebyshev distance of Black's legal replies from the proximate corner.
3. Among remaining ties, prefer checking moves.

An edge-forcing non-check therefore outranks a check that permits any off-edge reply. Mate and stalemate remain governed by the earlier safeguards.

## Verification

- Update the rendered Rule X text.
- Prove that `Be3+` fails Rule X in `8/8/8/8/5B2/8/4K3/3B2k1 w - - 0 1` because Black can reply `Kg2`, leaving the edge.
- Prove the edge requirement outranks both corner progress and check preference.
- Verify rotations and reflections.
- Run focused tests, build, lint, and diff checks.
- Find, independently validate, and load an h1-oriented loop at `cursor=0`.
