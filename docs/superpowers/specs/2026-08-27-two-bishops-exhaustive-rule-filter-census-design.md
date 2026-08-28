# Two Bishops Exhaustive Rule-Filter Census

## Goal

Prove whether the current production Two Bishops policy is loop-free across the complete legal Standard starting-position universe. The proof must follow every tied best White move and every legal Black reply. Alongside the proof, report how much work each ordered White rule performs.

## Proof semantics

The exhaustive verifier will use the existing D4-canonical production adapter. D4 reduction is valid because the policy is required to be rotation- and reflection-equivariant. A successful run must enumerate every canonical Standard root, prove every reachable policy state finite, and reject cycles, rule gaps, non-mating terminal branches, and fifty-move draws.

The verifier must return early with a playable identity-oriented witness when it finds a failure. A successful completed run is an acyclic certificate; an interrupted or bounded run is only partial coverage and must never be described as proof.

## Rule-filter census

The existing ordered selector already records the rule responsible for eliminating each candidate move. Two Bishops will expose that selection result to verifier-only instrumentation without changing the selected moves.

For every first expansion of a canonical White state, the census will record for each rule:

- candidate moves eliminated;
- positions where the rule eliminated at least one move.

Canonical counts are exact for the proof graph. Estimated full-board counts may be derived with symmetry-orbit weights and must be labeled approximate. Counting will be deduplicated by canonical state so cache hits and repeated roots do not inflate totals.

## Persistence and performance

The exhaustive run will use a persistent policy-fingerprinted cache and resumable proof checkpoints. Rule counts will be checkpointed with the proof state. Instrumentation will reuse the existing selector trace and will not rescore positions solely for counting.

## Output

Progress output will show roots and unique states. The final machine-readable report will include:

- completed-universe status;
- policy and engine fingerprints;
- roots and unique positions examined;
- maximum mate length;
- per-rule elimination and affected-position counts;
- either the acyclic certificate or the first failure with a playable loop URL.

## Verification

Focused tests will prove that census instrumentation preserves ideal-move selection, attributes eliminated moves to the correct ordered rule, deduplicates repeated state expansions, and labels incomplete runs honestly. The production policy itself must remain unchanged.
