# Two Bishops Rule P Phase 2 Waiting Move Design

## Goal

Add Rule P immediately before Rule WW: in Phase 2, when the kings are in opposition and only Black's king is on an edge, White plays a bishop waiting move.

## Behavior

Rule P applies when White and Black are separated by one square on a shared rank or file, Black is on an edge, and White is not. A qualifying move is a non-checking bishop wait for which at least one legal Black reply reaches the defined Phase 2 pattern. Earlier safety rules remain authoritative; Rule WW breaks ties only if multiple Phase-2-entry waits qualify. In `8/8/8/8/8/5K1k/4B3/4B3 w - - 2 2`, only `Bd1` qualifies because `Bd1 Kh2` reaches the canonical Phase 2 start.

## Verification

Test the rule text and priority order, a qualifying position, rotations and reflections, and rejection when White is also on the edge or the move checks. Run focused tests, build, lint, and whitespace validation, then verify and load a loop at `cursor=0`.
