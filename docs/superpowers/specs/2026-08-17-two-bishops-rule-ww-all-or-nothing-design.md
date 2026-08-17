# Two Bishops Rule WW All-or-Nothing Design

## Goal

Make Rule WW reward only a complete bishop cage. Controlling one of the two cage diagonals must receive no partial credit.

## Behavior

- Keep Rule WW in its current priority position and retain its rendered text.
- Keep the existing king-relative cage geometry and applicability condition: the kings must be a knight's move apart.
- Score the bishops after White's move.
- Assign penalty `0` when the resulting bishops collectively control both cage diagonals.
- Assign penalty `1` when they control zero or one cage diagonal.
- Do not restrict the winning move by piece type; any legal White move may win if its resulting position completes the cage.

## Example

From `8/4B3/8/8/2K5/4k3/B7/8 w - - 2 2`, `Bb4` controls neither derived cage diagonal. Moves such as `Bb1` and `Bd6` control only one. All three therefore tie at Rule WW rather than receiving different partial-credit scores. Later priorities decide among them.

## Testing

- Assert equal Rule WW penalties for zero and one controlled cage diagonal.
- Assert a lower penalty for a completed two-diagonal cage.
- Cover the supplied FEN.
- Preserve rotation and reflection invariance.
- Run the focused Two Bishops and presentation suites, diagram consistency check, lint, build, and whitespace validation.

## Scope

No rule ordering, help text, diagram, cage geometry, or other Two Bishops priority changes are included.
