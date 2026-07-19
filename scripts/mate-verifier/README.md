# Exhaustive Mate Verifier

Run from `app/`:

```sh
npm run verify:mate -- --mate all
npm run verify:mate -- --mate rook
npm run verify:mate -- --mate rook --identity
```

The verifier explores every move returned as optimal for White and every legal
Black response. It succeeds only when every supported starting position and
every resulting branch ends in checkmate.

The final stdout line for each mate set is JSON. Human-readable progress and
counterexample details go to stderr. A failure includes a starting FEN and SAN
line that can be replayed directly.

Exit status:

- `0`: exact verification completed successfully;
- `1`: a counterexample was found;
- `2`: the run was incomplete.

Diagnostic limits deliberately produce `incomplete`:

```sh
npm run verify:mate -- --mate queen --max-roots 10
npm run verify:mate -- --mate bishop-knight --max-nodes 100000
```

Limits are useful for checking performance and integration, but their results
are never certificates.

## Symmetry reduction

The production evaluators are assumed to be symmetric. Queen, Rook, Two
Bishops, and Bishop + Knight positions therefore share proof states across all
eight rotations and reflections. Two Knights + Pawn shares states only across
identity and file reflection because the pawn's movement direction makes the
other transforms invalid chess symmetries.

Only memoization and root-deduplication keys are transformed. Expansions and
counterexample witnesses retain the original FEN orientation. Castling-bearing
states are rejected because they are outside these endgame sets and cannot use
the same rotation group safely.

A reported cycle may therefore end at a rotated or reflected version of the
position at its cycle boundary. Under the evaluator-symmetry assumption, the
same branch choices can be transformed and repeated until the finite symmetry
itself returns to identity, producing an infinite non-mating line.

## Identity state keys

Pass `--identity` to disable symmetry sharing for explored proof states:

```sh
npm run verify:mate -- --mate queen --identity
npm run verify:mate -- --mate rook --identity
```

In this mode, memoization and active-cycle detection use the normalized,
untransformed structural FEN: board placement, side to move, castling rights,
and en-passant square. Move counters remain excluded, and expansions and
witnesses are unchanged. A rotated or reflected position is therefore a
different explored state and is not by itself reported as a cycle.

Root enumeration remains symmetry-deduplicated in both modes. Identity mode
proves the full reachable graph from one representative of each root orbit,
but selection of those representatives still uses the documented evaluator-
symmetry assumption. The final JSON includes `stateKeyMode` so saved results
identify which memoization mode produced them.

## Major-piece rank data

The exact three-piece Queen and Rook mate-distance data is generated locally;
the browser never queries a tablebase or network service:

```sh
npm run generate:mate-progress
npm run check:mate-progress
```

The check regenerates both canonical tables in memory, validates every minimax
rank recurrence, and byte-compares the complete generated TypeScript artifact.

The Rook evaluator consults this table only for its rendered **exact mate
progress** priority: every boxless position and the documented close-piece
finishing alignments. The Queen table remains an independent exact diagnostic;
Queen's production teaching policy is geometric.

To rank the production teaching policy itself, including every tied White move
and every legal Black reply, run:

```sh
npm run derive:mate-policy -- --mate queen --identity
npm run derive:mate-policy -- --mate rook --identity
```

This second command does not generate runtime data. It succeeds only when the
selected production policy is a finite mating DAG and reports its exact longest
White- and Black-to-move ranks.

## Complete cycle diagnostic

The ordinary verifier stops when it has a counterexample. To collect the whole
selected-policy graph and report every cyclic strongly connected component,
run from `app/`:

```sh
npm run diagnose:mate-cycles -- --mate rook
npm run diagnose:mate-cycles -- --mate rook --identity
```

The default symmetry mode is the complete D4-reduced production graph. It
expands every tied optimal White move and every legal Black response before
running an iterative SCC pass, so one early loop cannot hide later loops. Each
component includes its exact shortest structural cycle. A structural cycle's
individual transitions are playable, but their displayed orientations may
differ at a symmetry boundary; use identity mode when a single directly
playable FEN-and-moves witness is required.
