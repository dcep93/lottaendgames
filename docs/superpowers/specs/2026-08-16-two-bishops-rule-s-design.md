# Two Bishops Rule S

## Rule and order

Add this Phase 1 priority immediately before Rule T:

> **rule s** — When the kings are a knight's move apart, a bishop controls the secondary squeeze diagonal, and the other bishop can control the primary squeeze diagonal in one move, take opposition.

The visible order becomes Rule S, Rule T, Rule V, Rule W, then king closer.

## Geometry

For each legal White king move that creates direct opposition, derive the existing primary and secondary squeeze diagonals from the resulting king opposition. Direct opposition means the kings share a rank or file with one square between them.

The starting bishops must satisfy distinct roles:

1. one bishop has a clear attack to at least one square on the secondary squeeze diagonal; and
2. the other bishop is not already on the primary squeeze diagonal and has a legal one-move destination on it.

When those prerequisites hold, Rule S prefers the White king move that creates the corresponding opposition. If no legal opposition move has the required bishop preparation, Rule S ties every candidate.

In `8/4B3/8/8/5K2/3B4/6k1/8 w - - 18 10`, `Bd3` attacks `e4` on the prospective secondary diagonal and `Be7` can reach `c5` on the prospective primary diagonal. Rule S therefore makes `Kg4` uniquely correct.

## Rule T refinement

Keep Rule T's rendered text and all-replies king-moat test. Among candidates that force every legal Black reply either to take opposition or widen the starting king moat, prefer the candidate with fewer legal Black replies.

After `Kg4 Kf2`, both `Bg5` and `Bc5+` satisfy the binary Rule T condition, but `Bc5+` leaves two legal replies while `Bg5` leaves three. Rule T therefore makes `Bc5+` uniquely correct.

## Verification

Pin the S–T–V–W order and exact Rule S wording. Test the supplied two-move sequence, distinct bishop roles, clear secondary control, reachable primary control, Rule T's reply-count tie-break, all D4 transformations, Phase 2 inactivity, prepared-batch equivalence, presentation, lint, build, and diff validity. Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.

## Scope

Do not add a Rule S diagram. Do not change Rule T's rendered wording, Rule V, Rule W, king closer, Black's reply policy, or phase detection.
