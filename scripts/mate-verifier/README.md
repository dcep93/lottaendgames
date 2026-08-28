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

## Offline exact-distance data

The exact three-piece Queen and Rook mate-distance data is generated locally;
the browser never queries a tablebase or network service:

```sh
npm run generate:mate-progress
npm run check:mate-progress
```

The check regenerates both canonical tables in memory, validates every minimax
rank recurrence, and byte-compares the complete generated TypeScript artifact.

Queen and Rook production selection does not read these tables. They are
independent diagnostics for checking the human-readable geometric policies;
they cannot reject a move or supply a reason in the app.

To rank the production teaching policy itself, including every tied White move
and every legal Black reply, run:

```sh
npm run derive:mate-policy -- --mate queen --identity
npm run derive:mate-policy -- --mate rook --identity
```

This second command does not generate runtime data. It succeeds only when the
selected production policy is a finite mating DAG and reports its exact longest
White- and Black-to-move ranks.

The bundled KBB-v-K table is also an offline reference. Its certificate test
validates the table itself, not the production Two Bishops policy. The ordinary
`verify:mate -- --mate two-bishops` command traverses the real human-readable
production selector, every tied White recommendation, and every legal Black
reply.

## Complete cycle diagnostic

The ordinary verifier stops when it has a counterexample. To collect the whole
selected-policy graph and report every cyclic strongly connected component,
run from `app/`:

```sh
npm run diagnose:mate-cycles -- --mate rook
npm run diagnose:mate-cycles -- --mate rook --identity
npm run diagnose:mate-cycles -- --mate two-bishops
```

The default symmetry mode is the complete D4-reduced production graph. It
expands every tied optimal White move and every legal Black response before
running an iterative SCC pass, so one early loop cannot hide later loops. Each
component includes its exact shortest structural cycle. A structural cycle's
individual transitions are playable, but their displayed orientations may
differ at a symmetry boundary; use identity mode when a single directly
playable FEN-and-moves witness is required.

The JSON also groups raw components into teaching-level `loopFamilies`.
`bishop-wall-shuffle` witnesses move only bishops for White,
`king-opposition-oscillation` witnesses move only White's king, and
`mixed-plan-oscillation` witnesses use both mechanisms. Raw SCC counts remain
in `stats`; the family inventory does not hide them.

During policy development, `--max-roots N` runs the same SCC analysis on only
the first `N` symmetry-reduced roots. That prefix is deterministic but biased by
placement enumeration order. It is a bounded comparison diagnostic, not a
global loop count or exhaustive certificate; the JSON labels it
`enumeration-prefix`.

During Two Bishops policy development, use the root-local fail-fast gate:

```sh
npm run develop:two-bishops
```

It checks ten fixed-seed D4-canonical development roots plus the small essential
regression smoke set. Each root is searched independently and the command stops
at the first repeated structural position, terminal failure, or rule gap.
Normalized position keys, policy-independent legal transitions,
policy-fingerprinted recommendations, and completed root results persist under
the ignored `tmp/mate-verifier-cache/` directory, so an unchanged rerun resumes
without rescoring.

The complete SCC diagnostic remains available for a frozen candidate:

```sh
npm run diagnose:mate-cycles -- --mate two-bishops --sample-roots 1000
npm run diagnose:mate-cycles -- --mate bishop-knight --sample-roots 1000
npm run diagnose:mate-cycles -- --mate bishop-knight --sample-roots 1000 --witness-limit 20
```

That expensive path expands the complete selected-policy graph before its SCC
pass. Use it only after the fail-fast ladder has passed 10, 100, 1,000, and the
permanent adversarial corpus. Omit both root-limit options to traverse the
complete legal Standard root universe for final validation; the JSON labels
that run `complete-standard-universe`.

For a resumable fail-fast proof of the current Two Bishops policy, including an
exact D4-canonical census of how many candidate moves each ordered rule filters,
run from `app/`:

```sh
npm run verify:two-bishops-exhaustive
```

The command has no root or node limit. It persists only completed node proofs
and reports `certificate.completeStandardUniverse: true` only after the entire
canonical Standard universe has been enumerated successfully.

The Bishop + Knight gate uses the same exhaustive continuation semantics. Its
fixed-seed D4-canonical roots are stratified by king edge distance, phase and
lookup applicability, key-square status, piece geometry, and active visible
rule, after including the permanent known-loop corpus.

`--witness-limit N` keeps all SCC counts and loop-family totals while limiting
the detailed component witnesses printed in the final JSON.

Pass `--update-adversarial-corpus` after a diagnostic to merge one witness from
every discovered raw SCC and every sampled terminal failure into the permanent
corpus. The merge normalizes FEN counters and D4-deduplicates positions.
