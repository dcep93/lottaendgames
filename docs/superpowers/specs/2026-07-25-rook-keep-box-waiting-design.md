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
   move the rook to the board edge on White's side.
6. `cover escape squares` — Cover the squares beside Black's king so the rook
   can mate.
7. `shrink the box` — Move the rook wall closer to leave Black less room.
8. `king proximity` — Bring White's king towards Black's.
9. `rook box size` — Use the rook to make a box around Black's king.

## Geometry

`keep the box` activates only when a box already exists. A candidate survives
when the resulting position still has a box no larger than the current one.
When no box exists, every move ties at this rule.

`waiting move` activates only when a box exists and the kings are a knight's
move apart. A qualifying move must:

- move the rook without capture or check;
- leave the rook safe;
- preserve or shrink the existing box;
- retain a strongest current rook wall;
- finish on a board edge; and
- finish on the same side of Black's king as White's king along the rook's
  movement axis.

If no legal move qualifies, the rule leaves all candidates tied. No square,
orientation, box-size literal, move counter, or history check is allowed.

In the target position, the second rank is the current wall. Both horizontal
edge moves keep that wall, but only `Rh2` finishes on White's side of Black.
`Kb3` keeps the box but loses at `waiting move`.

## Verification

- Pin `Rh2` as the sole best move and `waiting move` as its reason.
- Test the keep-box and waiting scores directly.
- Transform the fixture through all eight board symmetries.
- Require every returned reason to match a displayed rule.
- Run the focused Rook tests, complete Mate suite, lint, and production build.
- Run one symmetry-reduced exhaustive Rook verifier process with no parallel
  workers. Require no cycle, material loss, stalemate, rule gap, or fifty-move
  draw. If it fails, inspect the shortest witness and refine only visible,
  position-based geometry.
