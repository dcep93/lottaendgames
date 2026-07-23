# Rook policy completion

## Goal

Finish the Rook checkmate trainer as a position-only teaching system:

- every recommended White move is justified by the visible ordered rules;
- every tied recommended White move mates against every legal Black response;
- no supported Standard or Training Wheels start can repeat or reach a
  fifty-move draw;
- the evaluator and its tests remain invariant under all eight board
  symmetries.

The supported-start guarantee covers app-generated Standard positions and the
curated Training Wheels seeds. An arbitrary imported FEN that already has a
halfmove clock near 100 cannot always be rescued in pawnless KRK.

## Considered approaches

### 1. Require visible forced-mate progress, then apply the geometric policy

Use the generated KRK proof table for one visible binary gate: every surviving
White move must reduce the worst-case number of plies remaining before mate.
Then use the concise geometric rules to choose among all progressing moves.

This is the selected approach. Unlike the removed `shortest mate` rule, it does
not prefer the single shortest move or compare exact distances among progressing
moves. It rejects only moves that allow Black to erase the current progress.
The modal and reason column expose the gate as `no backtracking`, so it is not a
hidden engine tiebreak.

### 2. Complete the geometry without a proof gate

Keep adding geometric priorities until the exhaustive graph becomes acyclic.
The attempted `king supports rook` priority disproved this approach: it
increased the cyclic graph from 25 components and 1,198 states to 46 components
and 1,338 states. Other local box and king-approach changes moved cycles rather
than eliminating them.

### 3. Replace the Rook rules wholesale

A new textbook algorithm could be designed from scratch. That might eventually
be simpler, but it would discard the large approved position corpus and create
unnecessary regressions. The present geometry is close enough to complete.

## Ordered White policy

The universal rules remain first:

1. `mate`
2. `pieces safe`
3. `no stalemate`

The Rook rules then apply in this order:

4. `no backtracking` — Every Black reply must shorten the remaining forced
   mate.
5. `push with check` — Check when every reply pushes Black farther from White's
   king.
6. `establish box` — Use the Rook to make a phase 2 box. When Black is on the
   edge, shrink it.
7. `waiting move` — When the kings are a knight's move apart, make a safe,
   quiet Rook move that keeps the box; prefer White's king between the other
   pieces and avoid finishing beside White's king.
8. `king closer` — Move White's king closer to Black's king.
9. `rook farther` — Keep the Rook farther from Black's king.

`no backtracking` compares only whether a move descends the exact KRK
forced-mate rank. The rank already includes Black's strongest legal response,
so passing the gate means every Black reply leaves a shorter forced mate.
Exact ranks do not break ties after the gate.

`establish box` remains a non-expansion gate. If phase 2 already exists, leaving
phase 2 or enlarging the box loses. Preserving and shrinking it otherwise tie,
except when Black is already on the edge: then the smaller resulting box wins.

## Counterexample loop

Run the symmetry-reduced exhaustive graph diagnostic in one process. For every
reported cyclic component or fifty-move witness:

1. reduce it to its minimal repeating or draw-causing segment;
2. inspect all legal White candidates and every legal Black response;
3. identify the first visible rule that distinguishes the useful move;
4. generalize any necessary geometry without square, orientation, or literal
   box-size exceptions;
5. add a focused fixture and all-symmetry assertion;
6. rerun the diagnostic.

The proof gate is a generated position-only lookup, not history and not a FEN
exception. Do not add an invisible tiebreak.

## Verification

The final certificate must use the production selector and quantify over every
tied White recommendation and every legal Black reply.

- The symmetry-reduced exhaustive verifier must report no cycle, rule gap,
  material loss, stalemate, or fifty-move draw.
- The identity-keyed verifier is the final cross-check if it is practical in a
  single bounded process.
- The maximum proven line from every fresh-clock Standard root must be below
  100 plies. The expected symmetry-reduced certificate is at most 31 plies.
- Curated Training Wheels clocks must remain below 100 along their respective
  worst cases.
- Focused Rook fixtures, the complete Mate suite, lint, build, generated-table
  reproducibility, and `git diff --check` must pass.

Resource safety is part of the procedure: no verifier sharding, no parallel
workers, regular progress output, and only one exhaustive process at a time.
