# Two Bishops Uncluttered Bishops Design

## Goal

Add this priority immediately before `central pieces`:

> **uncluttered bishops** — If Black's king is in the corner, prefer bishops off of squares a knight's move from the corner.

## Behavior

The relevant corner is the exact corner occupied by Black's king before White moves. Score both bishops after each candidate White move and minimize how many occupy squares a knight's move from that same corner. The rule is inactive unless Black occupies a corner. Ties continue to `central pieces`.

## Verification

Add focused ordering and scoring tests, run TypeScript compilation, then find and load a verified local loop at `cursor=0`.
