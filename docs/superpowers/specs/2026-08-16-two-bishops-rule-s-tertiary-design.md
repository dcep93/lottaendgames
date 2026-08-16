# Two Bishops Rule S: Tertiary Squeeze

## Rule

Replace Rule S with:

> **rule s** — Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal or otherwise take opposition if a bishop can control the secondary squeeze diagonal in one move.

Rule S remains Phase 1 only and immediately before Rule T.

## Knight-step squeeze geometry

For a knight-step king displacement, combine the signed two-square direction with the signed one-square direction to form the diagonal normal. Black's projection is three greater than White's projection along that normal.

- Primary squeeze diagonal: White projection plus one.
- Secondary squeeze diagonal: White projection plus two.
- Tertiary squeeze diagonal: White projection plus three, passing through Black's king.

In `8/4B3/8/8/6K1/3B4/5k2/8 w - - 20 11`, the primary diagonal is `b8–h2`, the secondary diagonal is `a8–h1`, and the tertiary diagonal is `a7–g1`.

## Selection

Rule S first requires a bishop to have a clear current attack to at least one square on the primary diagonal.

Use a categorical branch:

1. If a primary-controlling bishop has a legal move onto the tertiary diagonal that checks Black's king, prefer the qualifying tertiary checks.
2. Otherwise, if a bishop has a legal one-move destination on the secondary diagonal, prefer legal White king moves that create direct opposition.
3. Otherwise, tie all moves at Rule S.

In the supplied position, `Be7` controls `d6` on the primary diagonal and can play `Bc5+` on the tertiary diagonal, making `Bc5+` uniquely correct.

## Diagram

Add a Rule S note board using the supplied position. Mark the primary diagonal with the primary style, the secondary diagonal with the secondary style, and the tertiary diagonal with the key style. Draw the arrow from e7 to c5 and name all three diagonals in the caption.

## Rule V completion

Retain the pending change that evaluates both paired primary/secondary orientations only for Rule V. Rule S no longer uses prospective opposition squeeze pairs.

## Verification

Test the supplied tertiary check, fallback opposition, categorical precedence, Rule V's two pairs, all D4 transforms, Phase 2 inactivity, exact rule order and copy, generated diagrams, presentation, prepared-batch equivalence, lint, build, and diff validity. Find and open a strict Phase 1 loop, terminating branches that enter Phase 2.

## Scope

Do not change Rule T, Rule V text, Rule W, king closer, Black's reply policy, or phase detection.
