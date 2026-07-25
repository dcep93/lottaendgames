# Rook Board-Based Rule Cleanup

## Goal

Make the Rook evaluator and training guide use only human-readable facts from
the current board. The generated KRK mate-rank table remains available for
verification, but it must not select moves or appear as a teaching priority.

Every displayed priority must identify one distinct evaluator decision.

A phase 2 box exists only when the rook's rank or file is strictly between the
two kings. White's king cannot stand on the rook wall: it would block the
rook's ray and let Black cross the supposed boundary.

## Rejected Approaches

Hiding `finish guarantee` while retaining its lookup would make the guide
disagree with move selection. Renaming the lookup as a board concept would
disguise the same mismatch. Both violate the requirement that the reason column
explain the algorithm.

## White Priorities

The production evaluator follows a board-only KRK strategy whose termination
has been formally verified. Keep the three universal priorities first:

1. `mate`
2. `pieces safe`
3. `no stalemate`

Then use four visible strategy ideas:

1. `finish` — Checkmate now, or make the final setup when every Black reply
   allows checkmate.
2. `shrink the box` — Use the rook to leave Black as little room as possible.
3. `force opposition` — Bring White's king into opposition. When a waiting move
   is needed, keep the box and make Black move.
4. `box Black in` — Put the rook between the kings. If Black is too close,
   bring the rook beside White's king or move it to a safe edge first.

The learner's repeatable technique is: box Black in, use the king and waiting
moves to force opposition, shrink the box, and repeat until the finish. The
evaluator retains exact geometric tie-breaks inside those four ideas, but no
tie-break becomes a separate concept in the modal.

## Phase 2 Diagram

The diagram uses the same SVG chess pieces as the playable board instead of
Unicode glyphs. Show White's king on b3, Black's king on d3, and the rook on
c1. The kings are in direct opposition with c3 between them, while the rook's
c-file confines Black to the right side.

Preserve the light/dark checker pattern inside the boxed area. Mark the box
with a restrained neutral sepia overlay and border, never the app's pink accent
color. The caption explicitly names both opposition and the rook wall.

`finish guarantee` and `proofProgressPenalty` are removed from production
selection entirely. The verifier may use generated mate ranks diagnostically,
but the app never uses them to select or explain a move.

## Loop-Driven Refinement

Run the production exhaustive Rook verifier in one process. If the board-only
policy loops or permits a fifty-move draw:

1. reduce the failure to its minimal repeating or draw-causing segment;
2. compare every recommended White move and every legal Black response from
   the witness board;
3. identify a static geometric distinction that leads toward mate;
4. add or refine a visible rule using that distinction;
5. add literal and symmetry regressions;
6. rerun the verifier.

Do not use move history, halfmove or fullmove counters, exact mate rank,
orientation-specific squares, literal FEN exceptions, or hidden tie-breaks.

## Verification

The final production policy must:

- rank every legal KRK root under every tied White recommendation and every
  legal Black reply;
- contain no loop, rule gap, material loss, stalemate, or fifty-move draw;
- remain invariant under all eight board symmetries;
- keep every reason ID present in the training guide;
- pass focused Rook tests, the full Mate suite, lint, build, and generated-data
  reproducibility.

Run only one exhaustive verifier process at a time.

The completed symmetry derivation ranks 21,950 White states and 5,476 Black
states with a maximum forced mate of 65 plies.
