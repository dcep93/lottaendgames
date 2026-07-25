# Remove the Two Bishops finish guarantee

## Goal

Remove `finish guarantee` from the Two Bishops teaching policy. The app must not
show a tablebase-derived rule that a human cannot apply from the board, while
retaining the proven convergence safeguard internally.

## Design

- Delete `finish guarantee` from the training modal and reason vocabulary.
- Retain proof-distance progress as an internal correctness filter because
  removing it revives known board-position oscillations.
- Attribute visible hints and move reasons only to board-based teaching rules.
- Keep the remaining position-only Two Bishops rules in their current order.
- Update presentation and rule tests so no Two Bishops reason or modal section
  refers to the removed guarantee.

## Verification

Run focused Two Bishops rule and presentation tests. Confirm that known
anti-oscillation positions retain their convergent moves while the modal and
registered descriptions contain no `finish guarantee`.
