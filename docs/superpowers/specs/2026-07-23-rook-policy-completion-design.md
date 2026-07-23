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

### 1. Complete the geometric policy and prove the whole policy

Keep the concise teaching rules, add the already-designed **king supports rook**
priority, and use exhaustive SCC and longest-path verification to find and fix
every remaining counterexample. This preserves the trainer's purpose: a human
can reproduce every recommendation from the modal.

This is the selected approach.

### 2. Filter every move through exact distance to mate

The bundled KRK table could force strict distance-to-mate descent. This would be
easy to prove but would silently override human strategy with an engine-like
number. Earlier work deliberately removed `shortest mate`; restoring it would
make the reason column incomplete or mysterious.

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

4. `push with check` — Check when every reply pushes Black farther from White's
   king.
5. `establish box` — Use the Rook to make a phase 2 box.
6. `waiting move` — When the kings are a knight's move apart, make a safe,
   quiet Rook move that keeps the box; prefer White's king between the other
   pieces and avoid finishing beside White's king.
7. `king supports rook` — When White's king is more than two king moves from
   the Rook, move it closer to the Rook.
8. `king closer` — Move White's king closer to Black's king.
9. `rook farther` — Keep the Rook farther from Black's king.

`establish box` remains a non-expansion gate. If phase 2 already exists,
preserving and shrinking its strongest box tie; leaving phase 2 or enlarging the
box loses. This follows the latest approved rule and supersedes older fixtures
that expected shrinkage to beat every preserving king move.

`king supports rook` is active only when the starting Chebyshev distance from
White's king to the Rook exceeds two. A king move that reduces that distance
wins, a Rook move is neutral, and a king move that fails to reduce it loses.
This changes the four-ply loop start from `Ke2` to `Kc2` without using history,
a FEN exception, or a hidden mate-distance score.

## Counterexample loop

After implementing the visible policy, run the symmetry-reduced exhaustive
graph diagnostic in one process. For every reported cyclic component or
fifty-move witness:

1. reduce it to its minimal repeating or draw-causing segment;
2. inspect all legal White candidates and every legal Black response;
3. identify the first visible rule that should distinguish the useful move;
4. generalize the geometry without square, orientation, or literal box-size
   exceptions;
5. add a focused fixture and all-symmetry assertion;
6. rerun the diagnostic.

If no existing rule can explain a necessary distinction in plain language, add
one concise rule and expose it in the modal. Do not add an invisible tiebreak.

## Verification

The final certificate must use the production selector and quantify over every
tied White recommendation and every legal Black reply.

- The symmetry-reduced exhaustive verifier must report no cycle, rule gap,
  material loss, stalemate, or fifty-move draw.
- The identity-keyed verifier is the final cross-check if it is practical in a
  single bounded process.
- The maximum proven line from every fresh-clock Standard root must be below
  100 plies.
- Curated Training Wheels clocks must remain below 100 along their respective
  worst cases.
- Focused Rook fixtures, the complete Mate suite, lint, build, generated-table
  reproducibility, and `git diff --check` must pass.

Resource safety is part of the procedure: no verifier sharding, no parallel
workers, regular progress output, and only one exhaustive process at a time.
