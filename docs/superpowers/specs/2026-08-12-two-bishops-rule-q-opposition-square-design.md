# Two Bishops Rule Q Opposition-Square Design

## Goal

Update Rule Q so it prevents Black from stepping into king opposition when the kings are a knight's move apart.

## Rendered rule

**rule q** — Phase 1: When the kings are a knight's move apart, use a bishop to prevent Black from stepping into king opposition, unless that square is further from the center than Black's current square.

## Behavior

- Rule Q is available only in Phase 1 when the kings are a knight's move apart.
- Its target is the unique square adjacent to Black's king that is in one-square orthogonal opposition to White's king.
- Rule Q is inactive when the target is further from the board center than Black's current square, using the existing `centerDistance` metric.
- When active, Rule Q prefers a bishop move whose resulting position gives a bishop a clear diagonal line to the target.
- A bishop occupying the target does not count as controlling it.
- Rule Q remains immediately after Rule P and immediately before `king closer`.

## Diagram

Keep the existing Rule Q starting position. Highlight `e2`, and show `Bd7-b5`, which makes the dark-squared bishop control `e2`.

## Verification

- Cover the canonical position and every D4 transform.
- Cover the center-distance exception.
- Cover non-knight-separated kings and Phase 2 neutrality.
- Update rendered-help and diagram assertions.
- Run the full Two Bishops and presentation suites, typecheck, lint, and diagram validation.
