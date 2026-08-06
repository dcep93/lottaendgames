# Two Bishops Rule Z X-Ray Coverage

## Goal

Update Rule Z to read:

`Phase 1: Control or x ray the target square with a bishop without checking, unless following rule v.`

For the supplied position, `Ke4` must no longer lose Rule Z merely because White's king screens the f3 bishop from the target square.

## Semantics

A bishop covers the Phase 1 target for Rule Z when the bishop and target are on the same diagonal and the bishop does not occupy the target. Intervening pieces do not prevent this Rule Z x-ray coverage.

The resulting position must still not check Black. Rule V's existing exception and behavior remain unchanged.

This change is local to Rule Z. Rule Y, Phase 2 rules, and all other bishop-control calculations continue to require their existing clear lines.

## Implementation

Extract a geometric bishop-alignment predicate from the existing clear-line helper. The clear-line helper first checks alignment and then checks blockers. Rule Z uses alignment; existing consumers continue using the clear-line helper.

## Verification

- Assert `Ke4` x-rays the target in the supplied position and receives zero Rule Z penalty.
- Assert the position still does not check Black after `Ke4`.
- Assert all D4 transforms preserve the result.
- Assert a non-diagonal bishop does not satisfy Rule Z.
- Assert existing clear-line Rule Y behavior is unchanged.
- Update rendered Rule Z text and presentation coverage.
- Run the complete Two Bishops rules test, presentation test, TypeScript build, lint, and diagram drift check.
