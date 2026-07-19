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

Use three cooperating layers:

1. A clean geometric evaluator supplies the human training priorities.
2. A generated exact three-piece distance-to-mate table supports the Rook's
   explicitly rendered **exact mate progress** stage. It is not a blanket
   fastest-mate policy, because that would reject sound teaching detours.
3. Verifier-only whole-policy ranks certify the final selected Queen and Rook
   policies, including every tied White move and every legal Black response.
   These ranks are proof output, not runtime move-selection data.

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
  the rank cut. Both `Ke1` and `Ra2` lose that stronger file cut and enlarge the
  box. `Rf2` retains the file cut and shrinks it from three files to two, so it
  is the sole preferred move.
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

1. **exact mate progress** — Use exact King-and-Rook mate distance whenever no
   Rook box exists, whenever the kings are at most two king moves apart, or when
   the kings are three king moves apart and the Rook is within three king moves
   of White's King. Keep only moves that reduce the exact distance, then prefer
   the shortest remaining finish. Two rendered, geometry-based farther-tempo
   alignments remain outside this stage.
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

Preserve previously approved Rook choices wherever they remain compatible with
symmetry and the exhaustive proof, including `Rb1`, `Rb7`, `Kf6`, `Rc1`, `Kd6`,
`Ra6`, `Rf2`, and both `Ke2` regressions. If an approved move is symmetry-
equivalent to an edge in a proven loop, the newer exhaustive no-loop requirement
supersedes it. This is why the earlier `Ra5` expectation becomes `Kg5`: its
rotated/reflected counterpart was an edge of the same cycle. Never hide such a
conflict behind a FEN override.

## Queen Geometry, Distances, and English

Keep the existing Queen strategy but make each rendered statement exact:

1. **stable two-square corner cage** — Build or preserve a corner-plus-adjacent
   edge cage from which every legal Black reply remains in those two squares.
2. **White king toward cage support** — With that stable cage, move White's king
   toward a mating-support square a knight's move from both the Queen and corner.
   Compare king-move distance first and row-plus-file distance second.
3. **white pieces off edge** — Minimize White King and Queen edge occupancy.
4. **Queen a knight move from Black** — Keep or place the Queen a knight's move
   from Black's king.
5. **Queen box size** — Minimize the board-edge rectangle bounded by the Queen's
   rank/file on Black's side.
6. **White king closer** — Minimize resulting king-move distance without entering
   the Queen's rank/file channel between Queen and Black; use resulting
   row-plus-file distance as a tie-break.
7. **shorter Queen move** — Among otherwise tied Queen moves, prefer fewer squares
   traversed. King moves do not participate in this tiebreak.

Remove the unused Queen middle-distance score. Replace numeric packing such as
`8 * kingDistance + manhattanDistance` with explicit ordered fields. Rename the
Black resistance text from “previous full position” to “previous board position,”
because counters are intentionally excluded.

Queen's displayed phase must use the same documented rank/file-channel geometry
as its King-line rule. No user-facing description may call a projection a literal
collinear segment.

## Exact Mate Data and Whole-Policy Rank

Add a deterministic generator under `scripts/mate-verifier/` for every legal KQK
and KRK state. Its first layer performs exact retrograde minimax over side to
move:

- checkmate has distance-to-mate rank 0;
- a White state is winning when at least one legal White move leads to a winning
  Black state;
- a Black state is winning for White only when every legal Black reply remains
  winning;
- capture, stalemate, unsupported material, and other draws are not winning.

The distance-to-mate table is both a legality foundation and the source for the
Rook's visible exact-progress comparisons. It is deliberately scoped. Blanket
fastest-mate descent conflicts with approved teaching moves such as `Rb1`, `Kf6`,
`Rc1`, `Kd6`, and `Ra6`, all of which make sound geometric detours while
temporarily increasing fastest-mate distance.

The Rook exact-progress scope is position-independent and rendered in full:

- every boxless position;
- kings at most two king moves apart;
- kings three king moves apart with the Rook within three king moves of White's
  King;
- except for two precisely rendered, symmetric farther-tempo alignments that
  preserve an active box.

The Queen remains purely geometric. Its final policy, and the Rook's combined
exact/geometric policy, are certified after selection. A complete graph
diagnostic collects every selected White edge and every legal Black edge and
reports every cyclic strongly connected component rather than stopping at the
first witness. Once that graph is acyclic, a separate longest-path derivation
assigns exact whole-policy ranks. For every selected after-White Black state the
rank covers the maximum of every legal reply; for every White state it covers
the maximum of every tied selected move. A finite rank proves no structural
loop. A Rook maximum below 100 plies proves no fresh-clock fifty-move draw.

Only the distance-to-mate artifact ships at runtime. It is compact, immutable,
symmetry-canonical, synchronous, pure, and reproducible: the check command
regenerates it in memory, validates every recurrence, and byte-compares the
complete artifact. Whole-policy ranks and SCCs are recomputed by verifier scripts
and do not become a second source of runtime move truth.

## Error Handling and Boundaries

- Geometry helpers return empty cuts rather than inventing an axis.
- Scoring never relies on sentinels to compare an applicable rule; rule
  applicability is explicit.
- The distance lookup validates material, turn, and legal square occupancy.
- Immediate mate, piece safety, and stalemate remain ahead of progress.
- Black response policy remains pedagogical, but proofs quantify every legal
  Black response, not only the rendered resistance choice.
- Existing replay URLs and full FEN counters remain supported.

## Verification

Add focused unit tests for:

- dual-axis cut enumeration, strongest-cut selection, symmetry, preservation,
  shrink, enlargement, and loss;
- the bad `Ke1` and `Ra2`, the correct `Rf2`, both correct `Ke2` moves, and every
  prior approved Rook regression;
- absence of production Rook box-size literals;
- exact Queen cage, distance, channel, box-area, and move-length semantics;
- rendered Queen/Rook priority IDs, order, labels, and full help text;
- generated exact-distance lookup integrity and every scoped Rook move's strict
  exact-distance descent;
- complete SCC collection across every selected White move and legal Black
  response;
- verifier-only whole-policy rank derivation.

Run both symmetry-reduced and identity-key exhaustive verification. The identity
result is the certificate. For Queen and Rook separately, verify every enumerated
root, every tied White move, and every legal Black response. Required final
results:

- no Queen structural cycle;
- no Rook structural cycle;
- no Queen or Rook rule gap or terminal failure;
- Rook maximum forced line below 100 plies from a fresh clock;
- generated artifact check, full Mate tests, lint, and production build all pass.
