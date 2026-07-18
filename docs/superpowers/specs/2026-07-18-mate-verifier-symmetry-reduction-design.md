# Mate Verifier Symmetry Reduction

## Goal

Reduce the exhaustive Mate verifier's search and root spaces by treating
chess positions related by an allowed board symmetry as the same proof state.
This is a script-only optimization and does not change the rendered app.

## Assumption

The production Mate evaluators are assumed to be equivariant under the
symmetries allowed for their material set. The verifier's certificate is exact
subject to this explicit assumption; it does not spend runtime revalidating
evaluator symmetry.

## Symmetry Groups

- Queen, Rook, Two Bishops, and Bishop + Knight use all eight square symmetries:
  identity, three rotations, file and rank reflection, and the two diagonal
  reflections.
- Two Knights + Pawn uses only identity and file reflection. Rank-changing
  transforms are not chess symmetries for a directional pawn.

## Canonical State Keys

The production adapter transforms a normalized structural FEN through every
allowed symmetry and uses the lexicographically smallest transformed position
key as its memoization and active-cycle key. Expansion continues from the
original state. This keeps SAN and FEN counterexample witnesses in their
original orientation while sharing proofs among symmetric positions.

The canonical key includes board placement, side to move, castling rights, and
en-passant state. Move counters remain excluded exactly as in the existing
structural cycle search; the separate halfmove-clock proof remains unchanged.

## Root Reduction

Root generators retain a set of canonical symmetry keys and yield only the
first representative of each orbit:

- transformed Train seeds collapse to one representative per full D4 orbit;
- unrestricted Standard placements collapse to one representative per full
  D4 orbit after production validation;
- KNN+pawn manifest roots collapse only across identity/file-reflection orbits.

Root source labels and starting FENs describe the representative that was
actually searched.

## Correctness and Tests

Unit tests cover:

- all eight pawnless transforms receiving one canonical key;
- KNN+pawn file reflections sharing a key while rank reflection does not;
- root enumeration yielding one KNN+pawn representative per allowed orbit;
- exact cycle detection through two differently oriented states;
- original-orientation witness rendering;
- existing exhaustive-verifier and Mate regression suites.

Resource limits continue to return `incomplete`, never `verified`. Symmetry
reduction changes only equivalence and performance, not terminal-failure or
universal-branch semantics.
