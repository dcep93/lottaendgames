# Two Bishops Rule P Phase 2 Waiting Move Design

## Goal

Add Rule P immediately before Rule WW: in Phase 2, when the kings are in opposition and only Black's king is on an edge, White plays a bishop waiting move.

## Behavior

Rule P applies from the current position when White and Black are separated by one square on a shared rank or file, Black is on an edge, White is not, and the position matches Phase 2. A qualifying move moves a bishop and does not give check. Earlier safety rules remain authoritative; Rule WW breaks ties among qualifying waits.

## Verification

Test the rule text and priority order, a qualifying position, rotations and reflections, and rejection when White is also on the edge or the move checks. Run focused tests, build, lint, and whitespace validation, then verify and load a loop at `cursor=0`.

