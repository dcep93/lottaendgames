# Bishop Distance Rule Design

## Goal

Add a final Two Bishops priority that prefers both bishops farther from Black's king.

## Rule

Add this ordered priority immediately after `unscreen bishops`:

> **bishop distance** — Prefer bishops farther from Black's king.

For every candidate, calculate each resulting bishop's Chebyshev distance from Black's king. The rule score is the smaller of the two distances, so the nearer bishop determines the candidate's score. Prefer the larger score.

This maximin metric matches the final historical implementation of the former “Prefer bishops further from Black's king” rule. It prevents one far bishop from compensating for another bishop that remains close.

The rule has no phase qualifier and applies in both phases. As the final ordered priority, it only resolves moves still tied after `unscreen bishops`.

## Testing

- `bishop distance` appears immediately after `unscreen bishops` with the exact rendered text.
- A candidate with a larger minimum bishop-to-Black-king distance wins.
- The metric uses Chebyshev king-step distance.
- The rule remains invariant under every board rotation and reflection.
- Existing earlier priorities remain unchanged.

