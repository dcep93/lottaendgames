# Rook Keep-Box Waiting Move

## Goal

Restore the simple Rook technique in which White preserves an existing box
before choosing a waiting move. In
`8/8/8/8/8/2K5/2R5/1k6 w - - 36 19`, the sole recommended move must be
`Rh2`, not `Kb3`.

The policy remains position-only, symmetric, human-readable, and safe against
repetition and the fifty-move rule.

## Considered approaches

### Separate `keep the box` and `waiting move` rules

This is the selected approach. Each board decision receives its own visible
reason. It restores the earlier teaching sequence and keeps the move log aligned
with the evaluator.

### Fold waiting geometry into `rook box size`

This would shorten the list but make `Rh2` appear to be about box size even
though every legal rook move along the second rank preserves the same box.

### Add an exact mate-progress guard

This could rule out cycles mechanically, but it would reintroduce a
non-geometric teaching rule. It is unnecessary unless exhaustive verification
proves that the visible board rules are incomplete.

## Ordered White policy

Keep the universal priorities first:

1. `mate`
2. `pieces safe`
3. `no stalemate`

Then use these Rook priorities:

4. `keep the box` — Keep Black inside its current box.
5. `waiting move` — When the kings are a knight's move apart, keep the box and
   move the rook to the board edge on White's side. If White's king blocks that
   edge, use the other edge.
6. `cover escape squares` — Cover the squares beside Black's king so the rook
   can mate.
7. `shrink the box` — Move the rook wall closer to leave Black less room.
8. `rook box size` — Use the rook to make a box around Black's king.
9. `king proximity` — Bring White's king towards Black's.

## Geometry

`keep the box` activates only when a box already exists. A candidate survives
when it leaves the rook wall in place or moves the rook to a box no larger than
the current one. The position-only box classifier treats a rook wall as active
when it lies strictly between the kings or shares White's king's coordinate on
that axis. Thus a White king may step onto the rook's rank or file without the
next turn forgetting the wall. When no box exists, every move ties at this
rule.

`waiting move` activates only when a box exists and the kings are a knight's
move apart. A qualifying move must:

- move the rook without capture or check;
- leave the rook safe;
- preserve or shrink the existing box;
- retain a strongest current rook wall;
- finish on a board edge; and
- preferably finish on the same side of Black's king as White's king along the
  rook's movement axis.

If the rook starts beside White's king and no preferred-side edge move is
legal, an otherwise qualifying move to the opposite edge is the fallback.
Preferred-side moves outrank fallback moves, and fallback moves outrank
non-waiting moves.

If no legal move qualifies, the rule leaves all candidates tied. No square,
orientation, box-size literal, move counter, or history check is allowed.

In the target position, the second rank is the current wall. Both horizontal
edge moves keep that wall, but only `Rh2` finishes on White's side of Black.
`Kb3` keeps the box but loses at `waiting move`.

`shrink the box` must compare the actual rook-box geometry. A rook move shrinks
the box only when the resulting box is smaller than the current box. Moving
sideways along the same wall does not shrink the box, even if it moves the rook
closer to Black.

This distinction prevents the waiting move from being immediately undone. In
the reduced regression cycle, `Rb5` moved along the same fifth-rank wall and
left Black's box at size 3. It must tie at `shrink the box`, allowing `king
proximity` to advance White's king instead.

`king proximity` may move White's king onto the rook wall when that safe move
brings it closer to Black.

Describe Phase 2 as:

> Phase 2 means the rook has boxed Black onto one side.

This remains accurate whether the wall is strictly between the kings or White's
king has stepped onto it.

`rook box size` is the establish-box rule. It applies before `king proximity`
when no box exists, then ties all candidates once a box exists. A rook wall on
the board edge is not a box because it removes no squares from Black's available
area.

## Verification

- Pin `Rh2` as the sole best move and `waiting move` as its reason.
- Pin the opposite-edge fallback where White's adjacent king blocks the
  preferred route.
- Test the keep-box and waiting scores directly.
- Prove a safe White king move onto the rook wall keeps the box and may satisfy
  `king proximity`.
- Prove the inclusive wall remains the strongest box on the following turn, so
  a waiting move cannot abandon it.
- Prove a boxless position establishes a rook box before advancing White's
  king, and that an edge wall is not misclassified as a box.
- Prove a lateral rook move along the same wall does not satisfy `shrink the
  box`.
- Transform the fixture through all eight board symmetries.
- Require every returned reason to match a displayed rule.
- Run the focused Rook tests, complete Mate suite, lint, and production build.
- Run one symmetry-reduced exhaustive Rook verifier process with no parallel
  workers. Require no cycle, material loss, stalemate, rule gap, or fifty-move
  draw. If it fails, inspect the shortest witness and refine only visible,
  position-based geometry.
