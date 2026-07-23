# Teachable Mate Rule Cleanup

## Goal

Make the Queen, Rook, and Two Bishops instructions accurate, memorable, and
visually useful on mobile. Every displayed rule must correspond to real
evaluator behavior. Cosmetic tie-breaks that do not contribute to guaranteed
progress should be removed.

## Queen Rule Audit

The Queen policy has no hidden distance-to-mate guard, so its human geometry
must prevent loops on its own. Each non-universal rule was removed in isolation
and the selected policy was re-ranked across every tied White move and every
legal Black response.

- Removing `white pieces off edge` creates the identity-keyed loop
  `Qb1 Ka4 Qb6 Ka3`.
- Removing the queen-knight-distance rule creates a repeated-check cycle.
- Removing queen box size creates a king-shuffle cycle.
- Removing king approach, cage construction, or cage support also creates a
  cycle.
- Removing `shorter queen move` remains fully ranked across all 17,972
  identity-keyed roots. The maximum White rank is 37 plies.

Therefore, remove only `shorter queen move`. Keep the other geometry, but group
related evaluator stages under memorable human descriptions.

## Displayed White Rules

All rule labels are lowercase. Several ordered evaluator stages may share one
rule ID, label, and explanation. The registry already deduplicates identical
descriptions without changing evaluator order.

### Queen

After `mate`, `pieces safe`, and `no stalemate`:

1. `corner cage` — Trap Black in a corner and the neighboring edge square.
   Then bring White's king to a mating-support square.
   - Retains cage construction before cage-support approach.
2. `tighten the net` — Move White's pieces off the edge. Keep the queen a
   knight's move from Black's king, then shrink the box's shorter side before
   its longer side.
   - Retains edge occupancy, queen-knight distance, and ordered box dimensions.
3. `king closer` — Move White's king closer without stepping between the queen
   and Black's king on the queen's rank or file.

### Rook

After the universal rules and `finish guarantee`:

1. `build the box` — Check only when it pushes Black away from White's king.
   Otherwise, place the rook between the kings to build a phase 2 box; once
   Black reaches an edge, shrink it.
   - Retains checking-push priority before box establishment.
2. `waiting move` — When the kings are a knight's move apart, keep the box by
   moving the rook. Prefer White's king between the rook and Black's king, and
   don't leave the rook beside White's king.
3. `bring the king` — Move White's king closer. If moves are still tied, keep
   the rook farther from Black.
   - Retains king approach before rook-distance comparison.

### Two Bishops

After the universal rules and `finish guarantee`:

1. `waiting move` — When White's king holds Black back, keep the wall with a
   quiet bishop move so Black must give ground. Near a corner, move the bishop
   that controls that corner first.
2. `corner finish` — Drive Black to the edge and keep it there. Put White's
   king a knight's move from the mating corner, then take direct opposition.
   - Retains corner support, phase 2, and direct-opposition comparisons.
3. `bishop wall` — Keep White's king clear of the bishops' lines. Place the
   bishops side by side, then shrink Black's room.
   - Retains screening, bishop adjacency, and reachable-area comparisons.
4. `king closer` — Move White's king closer to Black's king.

For Rook and Two Bishops, `finish guarantee` remains before every teaching
priority. Its new copy is:

> Every recommended move keeps mate forced and rules out repetition or a
> fifty-move draw.

This keeps the proof boundary explicit while the remaining rules explain which
proven-progress move the app teaches.

## Black Resistance Copy

Keep the existing evaluator order. Standardize on lowercase piece names inside
sentences and `toward`, not `towards`. Keep `White` and `Black` capitalized as
side names.

## Diagrams

Replace the Queen box diagram with a cropped two-square corner-cage example:

- Black king on `a1`;
- queen on `d2`;
- White king on `a3`;
- highlighted cage squares `a1` and `b1`;
- an arrow from `a3` to the support square `b3`;
- caption: “Only a1 and b1 remain. Keep the cage while the king walks to b3.”

Crop every diagram to its relevant geometry:

- Queen cage: 4×4;
- Rook phase 2 box: 6×6;
- bishop wall: 6×6;
- bishop corner finish: 5×5.

Cap diagram cards at 14rem and use a 10–14rem responsive grid. Add a semantic
`cage` highlight style and accessible name. Remove the obsolete Queen `box`
diagram data, but retain the `box` highlight used by Rook.

## Verification

- Assert the exact deduplicated displayed rule order and lowercase labels.
- Assert grouped evaluator stages retain their original comparator order.
- Assert Queen no longer exposes or evaluates `shorter queen move`.
- Re-run the complete Queen identity-keyed policy rank and exhaustive
  verification; require no loop, terminal failure, or fifty-move draw.
- Re-run the exhaustive Rook and Two Bishops certificates.
- Update diagram data and rendering tests.
- Perform targeted desktop and 390-pixel mobile checks of only these three
  modals, including overflow and console errors.
- Run all Mate tests, lint, build, and `git diff --check`.
