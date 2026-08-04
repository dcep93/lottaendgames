# Two Bishops Batched Analysis Design

## Goal

Remove replay sluggishness without adding history, cross-position memoization, a transposition cache, or broader mate search.

## Current bottleneck

On the supplied 28-move Phase 1 positions, one phase classification costs about 7 ms, but the classifier is rerun inside every candidate score. A White scoring pass therefore costs roughly 200 ms. The session then performs separate scoring passes for recommendations and explanations, and the UI performs another for the current hint. Black reply selection costs less than 1 ms.

## Design

### Two Bishops batch context

Create an immutable position context once for a legal-move batch. It contains phase, kings, bishops, Degenerate repair, Mate-in-3 applicability, existing wall geometry, and other source-position-only values already calculated by every candidate. Score each candidate move against that shared context. Keep the public single-move scorer as a compatibility wrapper that creates one context for one call.

### One facade analysis pass

Add a registered-rule-set analysis operation that scores a position once and exposes:

- ideal White moves;
- the current hint;
- the explanation for a requested legal move.

Existing `idealWhiteMoves`, `currentWhiteHint`, and `explainWhiteMove` remain compatible wrappers. The session uses the combined operation so correctness and explanation share one scored batch. This is an ephemeral return value, not a board-keyed cache.

### UI

The current-position hint performs one analysis batch for its current FEN. Historical logs continue using the reason stored when the move was played.

## Correctness and verification

Move selection, reasons, phase labels, symmetry, statelessness, Mate-in-3 scope, and Black policy must remain unchanged. Add generic facade tests proving a combined analysis scores candidates only once, focused Two Bishops equivalence tests, and a replay benchmark regression for the supplied loop. Run focused rule/session/presentation tests and TypeScript only; do not run the full mate suite, commit, push, deploy, or synchronize plan archives.
