# Two Bishops Rule W Completed-Pair Design

## Goal

Prevent Rule W from rewarding a partial flank pair when White's king screens one bishop from contributing to the second flank diagonal.

## Behavior

- Keep Rule W's priority position, rendered text, diagram, phases, and post-move king-relative geometry.
- Evaluate every legal White candidate from its resulting king and bishop squares.
- A candidate completes Rule W only when the two bishops collectively occupy both diagonals in one valid flank pair.
- Rule W applies to the candidate group only when at least one candidate completes a pair.
- A completed pair receives penalty `0`; every incomplete candidate receives penalty `1`, including candidates with no valid Rule W king geometry and candidates controlling only one flank diagonal.
- Rule W stops before later priorities when a completed pair survives, as it does today.

## Supplied regression

From `8/5k2/8/5K2/6BB/8/8/8 w - - 0 1`, `Kg5` produces knight-step king geometry. The bishop on `g4` occupies one flank diagonal, but the bishop on `h4` remains on White's king's diagonal behind the king on `g5`; the resulting position does not complete the flank pair. No candidate completes both diagonals, so Rule W does not apply and cannot make `Kg5` correct.

## Compatibility

Keep the existing urgent-flank score data for compatibility, but compare completed-pair status first. Because Rule W activates only when a completed pair exists, no incomplete urgent setup can defeat the completion.

## Testing

- Assert that the supplied `Kg5` result controls only one diagonal and does not activate Rule W.
- Assert that a completed pair still activates Rule W, scores `0`, and wins.
- Assert that no-geometry and one-diagonal candidates tie as incomplete.
- Preserve king-move support, both-phase behavior, and D4 invariance for completed pairs.
- Run focused Two Bishops and presentation tests, diagram consistency, lint, build, and whitespace validation.

## Scope

No changes to Rule WW, flank geometry, help copy, diagrams, phase detection, or later priorities are included.
