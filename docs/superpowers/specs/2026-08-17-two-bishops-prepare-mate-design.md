# Two Bishops Prepare Mate Design

## Rule and order

Add this general priority immediately before `central king`:

> **prepare mate** — With the black king in the corner and the white king a knight's move away, play a bishop waiting move, maintaining the secondary squeeze diagonal.

Keep the existing universal safety priorities before it. Keep every later priority and its rendered text unchanged.

## Geometry

The rule applies when Black's king starts in a corner and White's king is a knight's move away. From the two edge-adjacent squares beside that corner, select the unique square that would place Black's king in direct opposition to White's king. Derive the ordinary opposition squeeze geometries from White's king and that projected Black escape square.

Retain the squeeze geometries whose secondary diagonal is controlled by a starting bishop. A candidate satisfies `prepare mate` when it:

- is a bishop move;
- does not check Black's king; and
- leaves a bishop controlling the same secondary squeeze diagonal.

Moving the secondary bishop along that diagonal and moving the other bishop while leaving the secondary bishop in place both maintain it. If the trigger or a prepared secondary diagonal is absent, the rule does not apply.

## Supplied position

In `8/8/2B5/2B5/8/8/2K5/k7 w - - 48 25`, Black's projected opposition escape is a2. The c6 bishop controls the matching secondary diagonal. Quiet bishop waits that preserve it survive `prepare mate`; later `bishop distance` makes `Bf8` unique. The displayed reason is `prepare mate` because this new priority eliminates the competing king move.

## Verification

- Pin the priority immediately before `central king` and the exact rendered wording.
- Assert `Bf8` is uniquely correct in the supplied Phase 2 position with reason `prepare mate`.
- Cover all D4 rotations and reflections.
- Reject king moves, checks, and bishop moves that abandon the prepared secondary diagonal.
- Preserve prepared-batch equivalence and existing rule behavior outside the corner-knight trigger.
- Run the focused rules and presentation suites, lint, build, and diagram consistency check.
- Find and open a strict Phase 1 loop, treating entry into Phase 2 as termination.
