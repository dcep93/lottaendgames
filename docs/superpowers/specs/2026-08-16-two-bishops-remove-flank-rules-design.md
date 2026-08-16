# Two Bishops Flank-Rule Removal Design

## Removal

Remove Rules A, B, BC, C, D, and E from the Two Bishops evaluator and rendered
priority guide.

Delete their score fields, position-context data, flank-diagonal and king-moat
helpers, generated Rule A diagram, and dedicated tests. Do not leave disabled
or unreachable versions of the rules in production code.

## Remaining policy

The visible Phase 1 sequence becomes:

1. mate;
2. pieces safe;
3. no stalemate; and
4. king closer.

Existing Phase 2 priorities, degenerate repairs, proof data, Black policy, and
the `king closer` metric are unchanged.

## Verification

Pin the reduced rendered priority list and absence of Rules A–E and BC. Preserve
the existing universal-safeguard, Phase 2, symmetry, and board-position tests.
Run focused tests, lint, build, generated-diagram freshness, and find a strict
Phase 1 loop where entry into Phase 2 terminates the branch.
