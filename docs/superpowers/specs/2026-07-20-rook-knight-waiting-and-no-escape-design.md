# Rook knight-waiting rule and escape removal

## Goal

Simplify the rendered and executable Rook policy:

- remove `rook escape` entirely;
- define `waiting move` only for kings a knight's move apart;
- choose `Rc2` from `8/8/3k4/1K6/8/8/8/2R5 w - - 6 4`;
- choose `Rc8` from `8/8/8/1K6/3k4/8/8/2R5 w - - 6 4`; and
- choose `Kb6` from `8/1K6/3k4/8/8/8/8/2R5 w - - 10 6`.

The latest waiting definition supersedes earlier direct-opposition and other
internal waiting shapes. Human-facing rules and executable priorities must stay
identical.

## Rook escape

Delete the visible rule, score field, applicability calculation, help text, and
tests that expect `rook escape`. `pieces safe` remains earlier and continues to
reject any move that leaves the Rook capturable. No replacement escape rule or
hidden edge preference is added.

## Waiting move

Use this exact displayed explanation:

> If the kings are a knight's move apart, move the rook so that it is on the
> same side of Black's king as White's king, unless that would place the rook
> adjacent to White's king.

The rule activates only when a box exists and the kings are a knight's move
apart. A candidate waiting move must:

- be a quiet, nonchecking Rook move;
- leave the Rook safe;
- preserve or shrink the strongest box boundary;
- finish on the same side of Black as White's King along the Rook's movement
  coordinate; and
- not finish adjacent to White's King.

If White and Black share the relevant coordinate, there is no same side and no
candidate qualifies. If every otherwise qualifying Rook move would finish
adjacent to White's King, no waiting move qualifies. In either case all moves
tie at `waiting move` and later visible rules decide.

The waiting rule itself is boolean; it contains no distance subpriority. The
later displayed `rook farther` rule selects the farthest surviving Rook square.
That produces `Rc2` and `Rc8`. In the third supplied position both same-side
Rook squares are adjacent to White's King, so `king closer` selects `Kb6`.

## Verification

- Pin the exact ordered rule list without `rook escape` and the new waiting
  copy.
- Add the three supplied FENs as sole-choice fixtures and test their first
  differentiating reasons.
- Test rotations and reflections of each geometry.
- Update previous fixtures only where the new literal rule intentionally
  supersedes an older waiting shape or escape preference.
- Exhaustively enumerate symmetry and identity Rook graphs, then run the exact
  50-move verifier and return one shortest bounded witness if either fails.
