# Two Bishops Rule R11: Outer Bishop Safety

## Behavior

Add `rule r11` immediately after `rule r9` and before `rule r`.

Evaluate the resulting position after White's candidate move. When the two bishops form a double-diagonal wall, identify the outer-wall bishop directly from Black's position: it is the bishop whose controlled wall diagonal is farther from Black across the wall's shared axis. Prefer positions where that outer bishop is not a knight's move from Black's king.

This geometry does not require the wall to face an already identified caged corner. The rule is inactive only when there is no double-diagonal wall or no outer-wall bishop can be identified.

## Scoring

- `0`: the identified outer-wall bishop is not a knight's move from Black's king.
- `1`: the identified outer-wall bishop is a knight's move from Black's king.

## Verification

Add focused score and rule-order coverage, run the Two Bishops minimal-policy test file, build the app, and revalidate the existing short loop.

Regression coverage must include bishops on `a1–h8` and `a2–g8` with Black on `f4`: the `e6` bishop is the outer bishop and is a knight's move from Black.
