# Exhaustive Mate Verifier

Run from `app/`:

```sh
npm run verify:mate -- --mate all
npm run verify:mate -- --mate rook
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
