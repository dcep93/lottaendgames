# Two Bishops Rules A–C Design

## Goal

Replace the Phase 1 `rule pp`, `rule p`, `rule q`, `rule r`, and `rule s`
priorities with three new priorities while preserving `king closer`:

1. **rule a** — When the kings are a knight's move apart, use a bishop to
   control the flank square. The flank square is the square adjacent to Black's
   king and also a knight's move from White's king.
2. **rule b** — Keep bishops behind White's king, from Black's king's
   perspective.
3. **rule c** — Place bishops on adjacent diagonals.

The visible technique order is `rule a`, `rule b`, `rule c`, then
`king closer`. The existing mate, bishop-safety, and stalemate safeguards stay
ahead of these rules.

## Rule A Geometry

Rule A reuses the existing Rule S flank-square geometry. It applies only when
the starting kings are a knight's move apart. A flank square is an on-board
square that is adjacent to Black's king and a knight's move from White's king.
A candidate succeeds when a bishop controls at least one flank square after
White's move.

Retain the existing flank-square diagram, relabeled from Rule S to Rule A.

## Rule B Geometry

Score the position after White's candidate move. For each bishop, compare its
squared Euclidean distance from Black's king with White's king's squared
Euclidean distance from Black's king. A bishop is behind White's king when its
distance is strictly greater.

Rule B maximizes the number of bishops behind White's king. It applies to every
Phase 1 position with both kings present.

## Rule C Geometry

Score the two bishops after White's candidate move. A square has two diagonal
line indices: `file + rank` and `file - rank`. The bishops occupy adjacent
parallel diagonals when the absolute difference between either pair of
same-direction indices is exactly one.

Rule C is binary: prefer candidates whose bishops occupy adjacent parallel
diagonals. The definition is invariant under translation, reflection, and
rotation.

## Removal Scope

Remove PP–S score fields, helpers used only by those rules, ordered-rule
entries, rendered help, focused tests, and obsolete diagram keys. Do not alter
historical design documents or unrelated Phase 2 and degenerate behavior.

## Verification

Tests must establish that:

- the visible rule order is the three universal safeguards, A, B, C, and king
  closer;
- PP–S are absent from rendered help and evaluator output;
- Rule A retains its flank-square behavior under rotations and reflections;
- Rule B uses squared Euclidean distance and prefers the greater count of
  bishops behind White's king;
- Rule C recognizes adjacent parallel diagonals under translations, rotations,
  and reflections;
- all three new rules are inactive in Phase 2;
- existing king-closer behavior remains unchanged;
- the focused Two Bishops and presentation suites, lint, and production build
  pass;
- a strict current-policy loop remains entirely in Phase 1, with entry to Phase
  2 treated as termination.
