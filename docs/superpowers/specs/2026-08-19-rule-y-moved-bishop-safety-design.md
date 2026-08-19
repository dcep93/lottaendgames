# Rule Y Moved-Bishop Safety

## Rule

Render Rule Y as:

> Use a bishop to prevent Black from attacking the other undefended bishop on their next move, moving along a diagonal that separates the kings, unless Black can attack it on the next move.

## Behavior

Keep the existing threatened-partner and separating-diagonal requirements. A bishop move satisfies Rule Y only when every legal immediate Black reply also leaves the moved bishop unattacked. Black attacks the moved bishop when the replying king finishes adjacent to it or captures it.

The safety exception is part of Rule Y eligibility, not a later tiebreak.

In `8/8/1B6/5k1B/8/2K5/8/8 w - - 2 2`, `Be3` protects the bishop on h5 but permits `Ke4`, which attacks the bishop on e3. Therefore `Be3` must not satisfy Rule Y. Apply the result under rotations and reflections.

## Alternatives Rejected

- Testing only direct captures misses a king move that attacks the bishop for the following turn.
- Deferring the condition to universal bishop safety changes Rule Y's stated meaning and its reason attribution.
