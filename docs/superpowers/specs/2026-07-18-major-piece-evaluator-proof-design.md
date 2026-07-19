# Major-Piece Evaluator Alignment and Proof

## Goal

Make the Queen and Rook evaluators readable, internally coherent, and
mathematically terminating. The rendered priority guide must accurately describe
the evaluator's meaningful decisions. Queen and Rook play must have no structural
loops under any tied optimal White move and any legal Black response. Rook play
from the exhaustive starting set must also checkmate before the fifty-move rule.

Remove every Rook policy branch that tests for a box of literal size 2. A numeric
box size may appear in a test fixture because that position happens to have that
size; it may not activate production behavior unless the same condition is stated
in the rendered English. The Queen's stable two-square corner cage is allowed
because the rendered rule will state it explicitly.

## Selected Approach

Use two layers:

1. A clean geometric evaluator supplies the human training priorities.
2. A generated exact three-piece mate-progress rank restricts White to moves that
   provably advance mate. Human priorities break ties only inside that safe set.

Position-specific patches are forbidden. A heuristic-only rewrite is insufficient
because the current Rook witness is acyclic yet reaches the fifty-move draw.

## Rook Box Geometry

Replace the rank-first single-axis helper with an immutable Rook box description
containing every valid cut:

```ts
type RookCut = {
  axis: 'rank' | 'file'
  size: number
  closest: boolean
}

type RookBox = {
  cuts: readonly RookCut[]
  strongestCuts: readonly RookCut[]
  size: number | null
}
```

A cut exists when the Rook's rank or file lies strictly between the two kings on
that axis. Its size is the number of rows or files available to Black between the
cut and the board edge. The box size is the minimum size among all active cuts;
all cuts with that size are strongest. This removes accidental rank-before-file
precedence while preserving the intended one-dimensional teaching model.

Box preservation compares the strongest size before and after a move:

- no resulting cut or a larger strongest size loses the box;
- an equal strongest size preserves it;
- a smaller strongest size shrinks it;
- when sizes tie, retaining at least one prior strongest axis wins unless a
  rendered waiting rule deliberately calls for the alternative axis.

This classifies the important positions without a size exception:

- At `8/8/8/8/8/7k/4R3/3K4 w - - 6 4`, the initial file cut is stronger than
  the rank cut. `Ke1` loses that stronger file cut and enlarges the box; `Ra2`
  retains a strongest cut and remains preferred.
- At `8/8/8/6k1/8/8/5R2/3K4 w - - 4 3`, `Ke2` retains the strongest file cut
  while improving king proximity and is the sole preferred move.
- At `8/8/6k1/8/8/8/5R2/4K3 w - - 6 4`, `Ke2` again retains the strongest file
  cut and is the sole preferred move.

Black's Rook resistance scoring uses the nearest strongest cut when more than one
cut exists. It must not inherit a rank-first choice.

## Rook Priorities and Rendered English

Expose distinct priorities in their real evaluator order. Do not deduplicate two
different calculations under one visible rule.

After the three universal priorities, render and evaluate:

1. **make mating progress** — Keep every legal Black response inside a strictly
   lower certified forced-mate rank.
2. **rook waiting move** — When the king geometry requires a tempo, make a quiet
   Rook move that preserves the strongest box. The unusual 2-by-1, 3-by-1, and
   3-by-2 king geometries may remain internal edge detection; box size may not.
3. **establish and preserve box** — Establish the smallest available box, then
   preserve or shrink its strongest cut. On an equal box, retain a strongest cut
   direction unless the waiting rule requires the alternative.
4. **forcing check** — Prefer a check only when every legal Black reply walks
   farther from White's king.
5. **White king closer** — After the strongest box is safe, reduce actual king-move
   distance to Black; use row-plus-file distance only as a tie-break.
6. **keep Black far from Rook** — When earlier priorities tie, maximize the Rook's
   row-plus-file distance from Black.

The waiting-move score may use narrowly detected king shapes, but every accepted
waiting move must be quiet, keep the Rook safe, and preserve or shrink the
strongest box. Remove all `boxSize === 2` gates, the compact establishment clamp,
and the size-specific king-line waiver. Box preservation itself decides whether
a king move may enter a Rook line; there is no separate size-dependent exception.

Preserve the previously approved exact Rook choices wherever they satisfy the
certified progress rule, including `Rb1`, `Ra7`, `Rb7`, `Kf6`, `Kf3`, `Rc1`,
`Kd6`, `Ra6`, `Ra5`, `Ra2`, and both `Ke2` regressions. If an approved move does
not decrease the exact rank, the design must stop and document that mathematical
conflict instead of silently adding a FEN override.

## Queen Geometry, Distances, and English

Keep the existing Queen strategy but make each rendered statement exact:

1. **make mating progress** — same certified-rank gate as Rook.
2. **stable two-square corner cage** — Build or preserve a corner-plus-adjacent
   edge cage from which every legal Black reply remains in those two squares.
3. **White king toward cage support** — With that stable cage, move White's king
   toward a mating-support square a knight's move from both the Queen and corner.
   Compare king-move distance first and row-plus-file distance second.
4. **white pieces off edge** — Minimize White King and Queen edge occupancy.
5. **Queen a knight move from Black** — Keep or place the Queen a knight's move
   from Black's king.
6. **Queen box size** — Minimize the board-edge rectangle bounded by the Queen's
   rank/file on Black's side.
7. **White king closer** — Reduce king-move distance without entering the Queen's
   rank/file channel between Queen and Black; use row-plus-file distance as a
   tie-break.
8. **shorter Queen move** — Among otherwise tied Queen moves, prefer fewer squares
   traversed. King moves do not participate in this tiebreak.

Remove the unused Queen middle-distance score. Replace numeric packing such as
`8 * kingDistance + manhattanDistance` with explicit ordered fields. Rename the
Black resistance text from “previous full position” to “previous board position,”
because counters are intentionally excluded.

Queen's displayed phase must use the same documented rank/file-channel geometry
as its King-line rule. No user-facing description may call a projection a literal
collinear segment.

## Certified Mate-Progress Rank

Add a deterministic generator under `scripts/mate-verifier/` for legal KQK and
KRK states. It performs exact retrograde minimax over side to move:

- checkmate has rank 0;
- a White state is winning when at least one legal White move leads to a winning
  Black state;
- a Black state is winning for White only when every legal Black reply remains
  winning;
- ranks count worst-case plies to checkmate;
- capture, stalemate, unsupported material, and other draws are not winning.

Generate a compact, immutable, symmetry-canonical lookup artifact. Runtime lookup
must be synchronous and pure. Missing or malformed entries fail closed in tests
and verifier builds; production may leave the progress rule neutral only for a
position outside the supported three-piece material contract.

For a nonterminal White move to pass **make mating progress**, the resulting
Black-to-move rank must be strictly lower than the starting White-to-move rank.
Because every legal Black reply is included in a Black rank, all returned tied
White moves descend a finite ranking function. This forbids structural cycles.
The exhaustive root rank and every selected branch must remain below 100 plies,
which forbids the Rook fifty-move draw from a fresh training position.

The generated artifact is reproducible: a check command regenerates it in memory
and byte-compares the result. Hand-editing the artifact is unsupported.

## Error Handling and Boundaries

- Geometry helpers return empty cuts rather than inventing an axis.
- Scoring never relies on sentinels to compare an applicable rule; rule
  applicability is explicit.
- The progress lookup validates material, turn, and legal square occupancy.
- Immediate mate, piece safety, and stalemate remain ahead of progress.
- Black response policy remains pedagogical, but proofs quantify every legal
  Black response, not only the rendered resistance choice.
- Existing replay URLs and full FEN counters remain supported.

## Verification

Add focused unit tests for:

- dual-axis cut enumeration, strongest-cut selection, symmetry, preservation,
  shrink, enlargement, and loss;
- the bad `Ke1`, both correct `Ke2` moves, and every prior approved Rook regression;
- absence of production Rook box-size literals;
- exact Queen cage, distance, channel, box-area, and move-length semantics;
- rendered Queen/Rook priority IDs, order, labels, and full help text;
- generated rank lookup integrity and every returned White move's strict descent.

Run both symmetry-reduced and identity-key exhaustive verification. The identity
result is the certificate. For Queen and Rook separately, verify every enumerated
root, every tied White move, and every legal Black response. Required final
results:

- no Queen structural cycle;
- no Rook structural cycle;
- no Queen or Rook rule gap or terminal failure;
- Rook maximum forced line below 100 plies from a fresh clock;
- generated artifact check, full Mate tests, lint, and production build all pass.

