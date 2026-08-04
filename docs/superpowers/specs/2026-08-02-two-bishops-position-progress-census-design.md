# Two Bishops Position Progress Census Design

## Goal

Measure how close the current Two Bishops policy is to completion by classifying every unique board position seen in bounded random policy closures, rather than counting only sampled starting positions.

## Sampling

- Generate fixed-seed legal Two Bishops positions with the existing D4-canonical sampler and no adversarial-corpus injection.
- Add sampled positions incrementally and globally deduplicate every reachable structural position.
- Expand every tied recommended White move and every legal Black reply through the production policy adapter.
- Finish the current sampled position's closure before evaluating the stop rule.
- Stop after the census classifies at least 30 unique positions as loop-leading.

## Classification

Build the directed continuation graph for all positions seen. Mate branches terminate successfully and do not add continuation nodes. Disallowed terminal branches are retained as failure annotations.

Classify unique positions in this order:

1. **Loop-leading:** the position belongs to a cyclic SCC, or can reach a cyclic SCC through at least one continuation.
2. **Other-failure-leading:** it cannot reach a loop but can reach stalemate, material loss, rule gap, fifty-move draw, or another disallowed terminal failure.
3. **Mate-terminating:** every continuation terminates in mate; it can reach neither a loop nor another failure.
4. **Incomplete:** its closure exceeded the configured bound or otherwise could not be classified.

If a position can reach both mate and a loop, it is loop-leading because the trainer must handle every tied White move and legal Black reply.

## Metric

Report:

- `x`: unique loop-leading positions.
- `y`: unique mate-terminating positions.
- `completionShare = y / (x + y)`.
- Other-failure-leading and incomplete counts separately.
- Sample seed, sampled starting-position count, total unique positions seen, elapsed time, SCC count, and cache statistics.

The metric is a reproducible development indicator, not a proof or an estimate of the complete legal-universe proportion. Its value is most useful when compared across policy fingerprints with the same seed and stop threshold.

## Implementation

Add a separate Two Bishops progress-census script. Reuse the production adapter, canonical state keys, existing sampler, and persistent transition cache. Do not change production rules, the fail-fast gate, the adversarial corpus, or shared cache semantics.

## Verification

- Add small synthetic graph tests covering self-loops, multi-state cycles, reverse loop reachability, mate-only states, mixed mate/cycle states, and non-cycle failures.
- Run only the new focused verifier tests, targeted verifier TypeScript, and diff hygiene.
- Run the census once with threshold 30 and report `x` and `y` honestly.

## Non-goals

- Do not run the full mate suite, exhaustive legal universe, full adversarial corpus, or global production SCC proof.
- Do not commit, push, deploy, or synchronize the plan archive.
