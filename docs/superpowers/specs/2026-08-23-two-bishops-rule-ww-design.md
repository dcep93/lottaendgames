# Two Bishops Rule WW Design

## Goal

Render and evaluate the existing outer-wall bishop tie-break as its own priority immediately before Rule W.

## Behavior

- Rule O continues to prefer the smallest valid bishop-wall area.
- Rule WW then prefers a move made by the bishop controlling the current outer wall.
- Rule WW applies only when the starting position has a valid bishop wall.
- Rule W remains the next priority.

Rendered text: **rule ww** — Prefer moving the bishop of the outer wall.

This selects `Bg5+` in `8/8/7B/8/5K1k/8/4B3/8 w - - 0 1` and still selects `Bh6` after `Bg5+ Kh3`.

## Verification

Add ordering and help-text coverage, retain rotation/reflection coverage, run the focused Two Bishops suite, build, diagram check, development verifier, and replay the four-ply loop in the browser from `cursor=0`.
