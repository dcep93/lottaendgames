# Two Bishops Incremental Validation Cache

## Goal

Make the Two Bishops validation ladder practical without weakening its proof
semantics. The ladder starts with ten fixed-seed D4-canonical random roots plus
the entire permanent adversarial corpus, then extends the unchanged graph
through 100, 1,000, 10,000, 100,000, 1,000,000 roots where applicable, and the
complete legal Standard universe.

## Cache boundaries

The verifier owns two explicitly separate cache layers.

1. Policy-independent entries are keyed by normalized board state and verifier
   schema version. They may survive policy edits and include canonical keys,
   legal moves, White-result positions, legal Black replies, terminal outcomes,
   reset flags, and board-only geometry already exposed to the verifier.
2. Policy-dependent entries are namespaced by a SHA-256 policy fingerprint.
   They include selected White moves, visible reason IDs, selected graph edges,
   failures, SCC results, and reason-family summaries. Any policy or selector
   source change creates a different namespace; stale entries are never read.

The cache lives under the ignored `tmp/mate-verifier-cache/` directory. Writes
are atomic. A corrupt, incompatible, or partial cache is ignored rather than
trusted.

## Incremental rung session

A single ladder invocation creates one graph session for one policy
fingerprint. Adding a rung:

- reuses every node and expansion already in the session;
- adds only roots not previously present;
- expands only newly reached states;
- keeps state deduplication global across corpus and sampled roots;
- recomputes SCCs over the complete accumulated graph for that rung.

The fixed-seed random sample must be prefix-stable: the ten random roots at the
first rung are the first ten random roots at every larger rung. The permanent
corpus is added independently and does not consume the requested random count.

## Reporting

Each rung reports:

- requested random roots, corpus roots, and unique total roots;
- graph-node hits and misses;
- policy-expansion hits and misses;
- policy-independent transition-skeleton hits and misses;
- incremental new states and edges;
- cumulative states and edges;
- SCC/failure statistics and visible-rule reason families.

The CLI must distinguish incomplete, failed, cyclic, and acyclic results. A
larger rung is never reported as validated unless its closure and SCC pass
finish.

## Rule iteration

Development begins at the completed ten-root-plus-corpus gate. At most one
general, rendered, stateless geometric rule correction is made for the dominant
visible reason family. A policy change creates a new fingerprint and resets
policy-dependent validation to ten roots while retaining safe
policy-independent cache entries.

## Verification

Tests cover prefix-stable root sampling, corpus-plus-random semantics,
incremental graph equivalence to a fresh full run, zero re-expansion when a rung
is repeated, safe policy-fingerprint invalidation, corrupt-cache recovery, and
cache hit/miss accounting. Existing Two Bishops focused tests remain mandatory.

No commit, push, deployment, or exhaustive-universe claim is part of this work.
