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

The existing compact DTM certificate remains the exhaustive proof, while the
diagram census runs the production policy graph over a fixed, deterministic
prefix of the loop checker's symmetry-reduced roots. The prefix size is recorded
in the generated artifact.

The census uses the production adapter's canonical key, which fully reduces all
eight rotations and reflections. A root contributes one observation to its
canonical position. Every continuing optimal-White/legal-Black branch contributes
one observation to its canonical child.

The search expands each structural position once and caches its branches. When a
branch reaches a position that is already active or memoized, recursion stops,
but the census still reads that position's cached expansion and increments each
of its children. This preserves finite loop-checker behavior without erasing the
frequency signal at a repeated parent.

For every observed position, the generator asks the registered production rule
set for `currentWhiteHint`. A position is relevant to a diagram only when that
active visible rule has the corresponding id. The selected representative is
the highest-count position; equal counts are resolved by ascending canonical
position key.

## Generated artifact

An opt-in script will:

1. enumerate a fixed prefix of the production loop checker's canonical roots;
2. traverse and cache the production policy graph, accumulating canonical
   encounter counts with the repeated-parent rule above;
3. consider candidates from greatest count to least, using the canonical key
   for deterministic ordering;
4. classify candidates by their active visible production rule;
5. select the winner for `bishop wall` and `corner finish`; and
6. write a small TypeScript artifact containing the canonical FEN, rule id,
   observation count, and generation metadata.

The normal test command will not regenerate the artifact. Generation is
deliberately explicit because policy traversal is broader than a unit test. A
check mode will fail when recomputed output differs, for use when the policy
intentionally changes. Traversal remains single-threaded, caches every expensive
position expansion, reports progress, and uses a recorded root limit to avoid
resource spikes.

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

- the frequency collector on a small synthetic graph, including repeated-parent
  child increments and deterministic tie-breaking;
- each generated FEN is legal and canonical;
- each generated FEN's active hint matches its diagram rule;
- rendered piece placement exactly matches the generated FEN;
- both boards are 8×8 and unhighlighted; and
- generation output is stable.

The full artifact generation will report progress and run single-threaded to
avoid the memory and CPU spikes previously seen during exhaustive searches.
