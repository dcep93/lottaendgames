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

The existing Two Bishops certificate proves every symmetry-reduced winning
White-to-move position, but it does not retain policy-graph observations.
Diagram generation will add an explicit analytics pass over those certified
positions.

Each canonical certified position receives:

1. one observation for appearing as a verifier root; and
2. one observation for every optimal White move and legal Black reply whose
   continuation canonicalizes to that position.

This is root frequency plus incoming policy-graph edge frequency. It measures
how often the loop checker encounters a structural position without inflating
the count for rotations or reflections. Repeated branches still count because
they are distinct ways for the checked policy to reach the same position.

For every observed position, the generator asks the registered production rule
set for `currentWhiteHint`. A position is relevant to a diagram only when that
active visible rule has the corresponding id. The selected representative is
the highest-count position; equal counts are resolved by ascending canonical
position key.

## Generated artifact

An opt-in script will:

1. decode and enumerate the canonical winning positions in the bundled KBB-v-K
   proof table;
2. expand each position through the production Two Bishops adapter;
3. accumulate canonical observation counts;
4. classify positions by their active visible rule;
5. select the winner for `bishop wall` and `corner finish`; and
6. write a small TypeScript artifact containing the canonical FEN, rule id,
   observation count, and generation metadata.

The normal test and certificate commands will not regenerate the artifact.
Generation is deliberately explicit because a full policy census is expensive.
A lightweight check mode will fail when recomputed output differs, for use when
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

- the frequency collector on a small synthetic graph, including symmetry-key
  aggregation and deterministic tie-breaking;
- proof-table enumeration metadata;
- each generated FEN is legal and canonical;
- each generated FEN's active hint matches its diagram rule;
- rendered piece placement exactly matches the generated FEN;
- both boards are 8×8 and unhighlighted; and
- generation output is stable.

The full artifact generation will report progress and run single-threaded to
avoid the memory and CPU spikes previously seen during exhaustive searches.
