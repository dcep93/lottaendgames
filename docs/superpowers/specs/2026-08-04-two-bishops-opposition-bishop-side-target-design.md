# Two Bishops Opposition Bishop-Side Target

## Goal

Restore bishop-side target selection only when the resulting kings are in opposition, using the bishops' physical sides of White's king rather than weighted distance.

## Selection

Calculate after each candidate White move in Phase 2.

1. If the kings are in the existing two-square same-rank/file opposition relation, project both bishops onto Black's edge axis.
2. Count each bishop once on the physical side of White's king where it stands; a bishop aligned with White's king on that axis counts for neither side.
3. If one side has more bishops, select the opposite corner and score its strength by that unweighted majority count.
4. A tied count does not choose a corner and falls through to the king-race selector.
5. When the kings are not in opposition, use the king-race selector unchanged.

Between candidate bishop moves, prefer the higher majority-backed target score before comparing forced corner progress. A king move that creates opposition uses the selected corner but receives no bishop-majority bonus. A king-race fallback has target score zero. This is current-position-only and D4 symmetric. Bishop color and absolute board location do not matter.

## Presentation and Tests

Update the target-corner note to state the opposition-specific physical-side count before the king-race fallback. Add D4 tests proving same-side bishops select the opposite corner, split physical sides fall through, and non-opposition positions remain king-race-driven.

## Scope

No visible rule is added. Phase classification, sequester progress, two-away fallback, degenerates, universal priorities, and Black's policy are unchanged.
