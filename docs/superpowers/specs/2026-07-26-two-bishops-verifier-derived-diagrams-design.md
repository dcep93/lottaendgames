# Verifier-derived Two Bishops diagrams

## Goal

Replace the hand-picked Two Bishops training diagrams with positions selected
algorithmically from the same symmetry-reduced position graph used to check the
production mating policy.

The chosen position for each diagram must:

- be a legal White-to-move KBB-v-K position;
- make the diagram's visible rule the active reason for the recommended move;
- represent its full rotation/reflection equivalence class;
- have the greatest observed frequency for that rule, with deterministic
  tie-breaking; and
- be stored as generated data so rendering is instant and reproducible.

## Counting model

The existing Two Bishops checker proves every winning White-to-move position by
scanning a compact DTM certificate. The certificate has already reduced Black's
square to a fundamental region, but positions on symmetry axes still appear in
more than one reflected form. Diagram generation will count those certificate
observations and then fully canonicalize each position across all eight board
rotations and reflections.

Each certificate entry contributes one observation to its fully canonical
position. This measures what the exhaustive checker actually sees and makes the
remaining symmetry duplicates useful as frequency rather than silently treating
the partially reduced table as fully reduced.

For every observed position, the generator asks the registered production rule
set for `currentWhiteHint`. A position is relevant to a diagram only when that
active visible rule has the corresponding id. The selected representative is
the highest-count position; equal counts are resolved by ascending canonical
position key.

## Generated artifact

An opt-in script will:

1. decode and enumerate the certified winning positions in the bundled KBB-v-K
   proof table;
2. fully canonicalize each position and accumulate certificate observation
   counts;
3. consider candidates from greatest count to least, using the canonical key
   for deterministic ordering;
4. classify candidates by their active visible production rule;
5. select the winner for `bishop wall` and `corner finish`; and
6. write a small TypeScript artifact containing the canonical FEN, rule id,
   observation count, and generation metadata.

The normal test command will not regenerate the artifact. Generation is
deliberately explicit because the complete certificate scan is broader than a
unit test. A check mode will fail when recomputed output differs, for use when
the policy intentionally changes.

## Rendering

The modal will import the generated FENs and derive board pieces from them.
Both diagrams remain full 8×8 boards with no highlighted squares.

The diagrams show positions where their named rule is actually deciding the
move. This supersedes the prior hand-picked `Bc3#` corner diagram: a mate-in-one
position is classified as `mate`, so it cannot honestly be a position where
`corner finish` is the active rule.

Captions stay conceptual rather than embedding a manually maintained move. The
current rule text and the live board position remain the source of truth.

## Verification

Tests will cover:

- the frequency collector on a small synthetic position set, including
  symmetry-key aggregation and deterministic tie-breaking;
- proof-table enumeration metadata;
- each generated FEN is legal and canonical;
- each generated FEN's active hint matches its diagram rule;
- rendered piece placement exactly matches the generated FEN;
- both boards are 8×8 and unhighlighted; and
- generation output is stable.

The full artifact generation will report progress and run single-threaded to
avoid the memory and CPU spikes previously seen during exhaustive searches.
