# Two Bishops Rule W Starting-Geometry Gate Design

## Goal

Prevent Rule W from applying when the kings begin too far apart, even if a White king move could create Rule W geometry.

## Applicability

Rule W may apply only when the starting king squares satisfy one of the relationships named in its rendered text:

- a knight's move apart; or
- exactly two files and two ranks apart.

If neither relationship exists before White moves, Rule W is inactive for the entire candidate group.

## Candidate scoring

When the starting gate passes, retain the current behavior:

- derive each candidate's flank pair from the resulting White king square and the unchanged Black king square;
- prefer a completed post-move pair;
- otherwise allow scoped priority-flank partial credit derived from starting knight-step geometry;
- allow king moves as well as bishop moves.

## Supplied regression

In `8/4B1k1/4B3/8/5K2/8/8/8 w - - 14 8`, White's king on `f4` and Black's king on `g7` begin one file and three ranks apart. Rule W must be inactive, so `Kg5` cannot lose at Rule W.

## Presentation

Keep Rule W's priority order, rendered text, and diagram unchanged.

## Testing

- Assert Rule W is inactive for the supplied distant-kings FEN.
- Assert the move explanation for `Kg5` is not Rule W.
- Preserve completed-pair and priority-partial behavior when the starting gate passes.
- Preserve post-move king scoring, both phases, and D4 invariance.
- Run focused Two Bishops and presentation tests, diagram consistency, lint, build, and whitespace validation.

## Scope

No Rule WW, flank geometry, scoring order, phase detection, help-copy, or diagram changes are included.
