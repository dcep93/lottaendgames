# Rook Board-Based Rule Cleanup

## Goal

Make the Rook evaluator and training guide use only human-readable facts from
the current board. The generated KRK mate-rank table remains available for
verification, but it must not select moves or appear as a teaching priority.

Every displayed priority must identify one distinct evaluator decision.

## Rejected Approaches

Hiding `finish guarantee` while retaining its lookup would make the guide
disagree with move selection. Renaming the lookup as a board concept would
disguise the same mismatch. Both violate the requirement that the reason column
explain the algorithm.

## White Priorities

Keep the three universal priorities first:

1. `mate`
2. `pieces safe`
3. `no stalemate`

Replace the bundled Rook priorities with these board-based stages:

1. `push with check` — Check when every reply pushes Black farther from White's
   king.
2. `establish box` — Put the rook between the kings without enlarging an
   existing phase 2 box.
3. `shrink box` — When Black reaches an edge, make the box smaller.
4. `waiting move` — When the kings are a knight's move apart, make a safe,
   quiet rook move that keeps the box and does not finish beside White's king.
5. `king between pieces` — For a waiting move, prefer White's king between the
   rook and Black's king.
6. `king closer` — Move White's king closer to Black's king.
7. `rook farther` — Among otherwise tied moves, keep the rook farther from
   Black's king.

Splitting the current compound comparisons must initially preserve their
lexicographic behavior. `finish guarantee` and `proofProgressPenalty` are
removed from production selection entirely.

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
