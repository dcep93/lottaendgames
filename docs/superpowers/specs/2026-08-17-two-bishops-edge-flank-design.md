# Two Bishops Edge Flank Design

## Scope

Add `edge flank` immediately after `central king` in the Two Bishops white-move priorities. It applies in both phases whenever Black's king is on an edge.

## Rule

Rendered text:

> **edge flank** — When the black king is on the edge, flank diagonally.

For each board edge occupied by Black's king, the flank targets are two squares inward from that edge and one square in either direction parallel to the edge. A candidate receives full credit when White's resulting king occupies a flank target. At a corner, targets from both incident edges are considered. If no legal move reaches a target, the rule ties all candidates and later priorities decide.

The supplied position has Black's king on h6, so its targets are f5 and f7. `Kf5` receives full credit.

## Diagram

Show White's king on g4 and Black's king on h6, with f5 and f7 highlighted pink and an arrow from g4 to f5. Show no bishops.

## Verification

- Assert `Kf5` is the unique best move in the supplied FEN at this priority.
- Cover translations along every edge.
- Cover rotations and reflections, including corner positions.
- Verify the rule is ordered after `central king` and before `rule s`.
- Verify the diagram contains no bishops and exposes both flank targets.
