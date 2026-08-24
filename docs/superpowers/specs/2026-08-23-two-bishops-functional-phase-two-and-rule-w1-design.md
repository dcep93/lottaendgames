# Two Bishops Functional Phase 2 and Rule W1

## Goal

Define Phase 2 from the board's bishop-wall geometry, allow safe White-king screening of either wall diagonal, and add:

> **rule w1** — Phase 2: Prefer king proximity to the square a knight's move from Black's corner.

Rule W1 appears immediately before `king closer`.

## Functional Bishop Wall

A bishop wall consists of two adjacent controlled diagonals with Black's king inside the corner area bounded by the nearer diagonal. A wall remains valid when White's king screens either diagonal only when Black cannot legally cross at the screened wall square.

This makes `Kf3` Rule-O-compatible in `8/8/8/8/8/7k/3B1K2/3B4 w - - 4 3`: White's king screens `d1–h5` at `f3`, but Black cannot use the screened crossing square, so the same h1 wall remains effective.

## Phase 2

A position is Phase 2 when at least one functional bishop wall:

- restricts Black inside its corner area; and
- has a nearer diagonal at least four diagonal steps from that corner.

The Phase 2 label and all Phase-2-gated heuristics use this predicate. The explicit `mate in 8 ish` move lookup remains an independent, stricter endgame pattern and does not define the phase.

## Rule W1

Rule W1 scores the resulting White-king square by its minimum squared Euclidean distance to either legal knight-move square from the tightest qualifying wall corner. For the h1 corner, these squares are f2 and g3. Looser complementary corner interpretations do not contribute targets.

Rule O precedes Rule W1, so wall preservation and area minimization remain authoritative. Rule W1 resolves qualifying ties before the general `king closer` heuristic.

## Verification

- Verify `Kf3` preserves the h1 wall and receives the same Rule O area as other moves preserving it.
- Verify Phase 2 requires a functional wall at the four-diagonal threshold and works under every rotation and reflection.
- Verify three-diagonal walls remain Phase 1.
- Verify Rule W1 is ordered immediately before `king closer`, renders the requested text, evaluates after White's move, and respects every symmetry.
- Run focused tests, build, lint, and diff checks.
- Generate, reason through, and load a fresh exact loop at `cursor=0`.
