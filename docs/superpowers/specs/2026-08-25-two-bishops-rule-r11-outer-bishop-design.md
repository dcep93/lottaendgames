# Two Bishops Rule R11: Outer Bishop Safety

## Behavior

Add `rule r11` immediately after `rule r9` and before `rule r`.

Evaluate the resulting position after White's candidate move. When the two bishops form a double-diagonal wall, identify the outer-wall bishop relative to Black's enclosed corner. Prefer positions where that outer bishop is not a knight's move from Black's king.

The rule is inactive when there is no double-diagonal wall or no outer-wall bishop can be identified.

## Scoring

- `0`: the identified outer-wall bishop is not a knight's move from Black's king.
- `1`: the identified outer-wall bishop is a knight's move from Black's king.

## Verification

Add focused score and rule-order coverage, run the Two Bishops minimal-policy test file, build the app, and revalidate the existing short loop.
