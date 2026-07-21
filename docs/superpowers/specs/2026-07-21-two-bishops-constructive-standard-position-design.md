# Constructive Two-Bishops Standard Position Design

## Goal

Generate opposite-colored bishops by construction instead of randomly placing
both bishops and rejecting same-colored results.

## Selection behavior

For a Two Bishops Standard attempt:

1. Randomly place Black's king, one White bishop, and White's king on distinct
   squares using the existing uniform square selection.
2. Collect the remaining squares whose color is opposite the first bishop.
3. Select the second White bishop uniformly from that collection.
4. Build the FEN and apply the existing complete position validation.

The final legality validation still rejects checks, terminal positions, and
other invalid starts. Rejected legal-structure attempts still retry, with the
existing fixed fallback after 1,000 failures.

Queen, Rook, Bishop and Knight, Two Knights vs Pawn, and every Training Wheels
generator remain unchanged.

## Implementation boundaries

`positions.ts` defers one White bishop only for Two Bishops Standard attempts.
The shared position validator continues to verify opposite-colored bishops as
a defensive invariant, but the Standard generator no longer uses that check as
its normal selection mechanism.

## Verification

- Add a deterministic random-sequence test proving the second bishop is chosen
  only from the opposite-colored remaining squares.
- Preserve deterministic seeded generation and legal-position validation.
- Run position tests, the complete mate suite, lint, build, and a diff check.
