# Two Bishops Rule U

## Rule and order

Add this Phase 1 priority immediately after Rule T:

> **rule u** — When the kings are a knight's move apart, a bishop controls the secondary squeeze diagonal, and a bishop can move to control the primary squeeze diagonal, take opposition.

The visible order becomes Rule S, Rule T, Rule U, Rule V, Rule W, then king closer.

## Geometry and behavior

For each legal White king move that creates direct opposition, derive the primary and secondary squeeze diagonals from the resulting king positions. Direct opposition means the kings share a rank or file with one square between them.

On the board after the candidate king move, the bishops must satisfy distinct roles:

1. one bishop has a clear attack to at least one square on the secondary squeeze diagonal; and
2. the other bishop is not already on the primary squeeze diagonal and has a legal one-move destination on it.

When those prerequisites hold, Rule U prefers the White king move that creates the corresponding opposition. A king move that screens the secondary bishop does not qualify. If no legal opposition move has the required bishop preparation, Rule U does not apply.

In `8/1k6/3K1B2/8/8/3B4/8/8 w - - 2 2`, the prospective geometry after `Kd7` satisfies the two bishop roles, so Rule U makes `Kd7` uniquely correct.

## Presentation

Render the requested Rule U text in the Phase 1 rule list immediately after Rule T. Do not add a Rule U diagram.

## Verification

- Pin the S–T–U–V–W order and exact Rule U wording.
- Verify `Kd7` is uniquely correct in the supplied position.
- Verify all rotations and reflections.
- Verify the bishops use distinct roles and that blocked secondary control does not qualify.
- Verify Rule U is inactive in Phase 2.
- Verify prepared-batch scoring matches direct scoring.
- Run focused tests, diagram drift, lint, build, and `git diff --check`.
- Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.

## Scope

Do not change Rule S, Rule T, Rule V, Rule W, king closer, Black's reply policy, phase detection, or existing diagrams.
