# Reusable unsupported-position audit

The bishop-and-knight rules change frequently. The audit must identify the
highest-exposure remaining loop components without depending on a temporary
script or old move-selection results.

Use the existing exhaustive approach, now in `scripts/bishop-knight-audit`,
behind `npm run audit:unsupported`. It enumerates post-White placements, explores
all tied best moves with Black's return history, stops at support and terminal
outcomes, then uses strongly connected components to distinguish loop membership
from loop reachability. Report physical placements, not symmetry representatives.

This deliberately chooses a full White-policy rebuild rather than a random sample or
rule-trigger-based cache invalidation. A sample can miss rare components;
selective invalidation needs a proof that unaffected rules cannot change later
candidate comparisons. A complete rebuild remains tractable with bundled code,
worker processes, pure-read memoization, cached per-position policy data, and
resumable SQLite checkpoints.

The run captures an immutable executable policy snapshot and rejects checkpoint
reuse after any policy/audit fingerprint change. Its report provides a comparison
to a prior audit, descriptive rule traces, component reach and exclusive reach,
and localhost replay links. Validated four-ply witnesses are preferred for the
sidebar, with a light-square bishop and Black nearer h8 than a1.

Verification covers placement/history encoding, exact enumeration totals,
checkpoint rejection, optimized-versus-production worker equivalence, direct
Black-history semantics, D4 symmetry, independent sink-removal confirmation of
SCC reachability, and three production-policy repetitions of displayed loops.

Unchanged root classifications and initial Black replies can be reused with
`--roots-from`. Reuse requires exact equality of the extracted root evaluator
dependency closures, including support and Black-policy helpers. It never reuses
White-policy results across a rule edit.
