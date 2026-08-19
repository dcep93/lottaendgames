# Rule V Secondary-Controller Check

## Scope

Correct Rule V's checking branch so “check from the secondary squeeze diagonal” identifies the bishop that controls the matching secondary before the move, rather than requiring the checking destination to remain on that diagonal.

## Behavior

When a primary squeeze diagonal is already controlled, a preferred Rule V check must:

- move the distinct bishop that begins on the matching secondary diagonal;
- deliver check from any legal destination;
- leave the other bishop controlling that same bundle's primary diagonal after the move.

The checking bishop may leave the secondary diagonal. In `8/4k3/1B6/1B2K3/8/8/8/8 w - - 0 1`, `Bc5+` therefore satisfies Rule V: the bishop starts on the matching secondary at `b6`, while the `b5` bishop remains on the primary.

Setup behavior is unchanged. An occupied secondary still anchors the bundle before a prospective secondary is considered, and all primary-secondary roles must belong to one geometry and use distinct bishops.

## Presentation

Rendered Rule V text remains unchanged.

## Verification

Add the supplied regression and every rotation/reflection, update the former destination-based rejection case to test the secondary controller's origin, retain all Rule R/S/U/V tests, run lint and build, then find and open a fresh Phase 1 loop while treating entry into Phase 2 as termination.
