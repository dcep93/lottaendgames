# Two Bishops: Sequester Control or Occupy

## Problem

The rendered `sequester` rule says to control the edge square two squares from
Black, but the selector explicitly rejects a bishop occupying that square. In
`5k2/8/1B4K1/5B2/8/8/8/8 w - - 4 3`, `d8` is the relevant two-away square.
The bishop on `b6` already attacks it, while `Bd8` currently loses the
sequester comparison merely because occupation is not counted.

## Design

Update the existing two-away post-move condition. It is satisfied when any
bishop either:

- occupies a candidate edge square two squares from Black's current square; or
- attacks that square along a clear diagonal.

Do not add a score field or another visible priority. Keep `bishops off edge`
later in the rule order so it can independently prefer fewer bishops on Black's
edge among candidates that survive sequester.

Update the rendered copy to:

> Phase 2: Force Black's king towards the target corner, or otherwise use a
> bishop to control/occupy the square 2 away from Black's current square.

## Verification

- Prove both attack and occupation produce zero two-away penalty.
- Preserve D4 symmetry.
- Run focused Two Bishops rules and affected presentation tests.
- Run TypeScript and diff checks.
- Find and load the next all-Phase-2 loop in one fresh browser tab.

## Assumptions

- Occupation and attack are equivalent only for the sequester two-away
  condition; later priorities remain free to distinguish them.
- The slash form `control/occupy` is intentional rendered copy.
