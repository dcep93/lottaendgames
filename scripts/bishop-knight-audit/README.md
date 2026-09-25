## Current reporting scope: precage terminals

Until the user changes this scope, treat a central bishop with a knight on a
currently eligible precage square as an audit terminal, for either side to move.
Use the production precage predicate, including the opposite-side requirement
relative to Black. This does not declare support or change app move preferences.
After obtaining a complete, current `--scope all` graph, run from the repository root:

```sh
./app/node_modules/.bin/tsx scripts/bishop-knight-audit/precage-terminal.mts SOURCE_AUDIT OUTPUT_DIRECTORY
```

The postprocessor verifies the production policy fingerprint, removes transitions
that encounter a terminal before White, after White, or after Black, and recomputes
cycle membership. It inspects the original cyclic components only: deleting edges
cannot create a cycle outside them. Independent reachability checks validate the
resulting cycle-position set. Report D4-distinct post-White positions **on** loops,
not positions that can reach a loop, and distinguish cyclic components from individual
four-ply cycles. Saved source counts must not be presented as terminal-filtered counts.

# Audit policy: preferred White × all legal Black

Since 2026-09-23, every Black legal reply is enumerated. Historical reports using app-selected Black replies are narrower evidence, not exhaustive counts for this policy. Rerun into a new output directory to establish the new baseline. Production Black preferences remain unchanged. A saved replay follows its explicit Black moves; Play Best may select a different reply.

# Bishop-and-knight unsupported-position audit

From `app/`:

```sh
npm run audit:unsupported -- --out /absolute/path/to/audit --workers 8
```

Requires Node 22.13 or newer (built-in `node:sqlite`) and `npm ci` in `app/`.

For supported-position continuations, use a separate output directory:

```sh
npm run audit:unsupported -- --scope supported --out /absolute/supported-audit --workers 8
```

This mode selects every supported post-White placement as a root, continues
through both supported and unsupported positions, and stops only at mate,
capture, or stalemate. Its percentages use supported starting placements as the
denominator. Direct membership counts supported boards on a cycle; the cycle
can also contain unsupported boards. The full root census is still performed.
Scope is included in the checkpoint fingerprint; cross-scope root reuse is
rejected. Default `--scope unsupported` retains the original support-terminal
behavior. Do not run the unsupported-only `direct-membership.mts` postprocessor
on a supported audit.
## Full audit: support changes and loops together

```sh
npm run audit:unsupported -- --scope all --out /absolute/full-audit --workers 4
```

This selects every supported and unsupported post-White placement and **does not
stop at support**. It follows all preferred White ties through support changes and
every legal Black reply. Run it when measuring support loss and loops in
the same policy snapshot. Neither a support-terminal audit nor the union of two
separate starting populations is a substitute for following paths across
support boundaries.

Additional persisted outputs:

- `full-report.md`: D4 orbit and physical counts by initial support status, direct
  cycle membership, eventual loop reachability, piece-position motifs, losses,
  and replay links.
- `full-details.json`: machine-readable population partitions and component
  origins, including cycles reached after support.
- `support-loss-events.json`: every best White transition from the prior supported
  White result to an unsupported White result, deduplicated jointly under D4.
  It separates mating losses and records possible subsequent outcomes.

Support is evaluated after White, never reclassified just because Black moved.
A loss event retains three boards: the prior post-White result, the current
White-turn board, and the new post-White result. One shared symmetry transforms
all three. Actual orbit sizes are counted; symmetric placements are not blindly
multiplied or divided by eight. Loop totals are cyclic components, which can
contain multiple simple loops. Replay links are checked by the app decoder.

The full postprocessors reuse the saved graph, so changing report groupings
requires no new census. With the matching source snapshot, run from `app/`:

```sh
AUDIT_DIR=/absolute/full-audit npx tsx ../scripts/bishop-knight-audit/full-details.mts
AUDIT_DIR=/absolute/full-audit npx tsx ../scripts/bishop-knight-audit/full-report.mts
```

## Fixed cohort plus five-second residual estimate

After a rule change, estimate **positions directly on unsupported loops**, never
positions that can merely reach a loop. Use preferred White moves (including
all ties), every legal Black reply, and D4-deduplicated post-White positions.

1. Extract **all** positions on unsupported cycles from the last completed full
   audit, not just one witness per component. Freeze this cohort and record the
   source audit, policy fingerprint, and Black policy. Do not replace it with a
   short-cycle sample after each change. A new full audit replaces the baseline.
2. Recheck that fixed cohort under the current rules. Report `x / b` positions
   still on an unsupported loop. Breaking the old witness is insufficient: the
   position may lie on a different cycle. Supported results do not count toward
   the unsupported survivor total. Do not impose a four-ply cycle limit.
3. Spend **five seconds**, not a fixed 5,000-position run, sampling uniformly
   from the remaining current unsupported D4 domain, excluding the entire
   baseline cohort. Record elapsed sampling time, seed, attempted positions,
   resolved positions, loop hits, and unresolved positions. Keep positions and
   unique loop families as separate counts; several samples can occupy one loop.
4. Let `R` be the size of that remainder, `n` the sample size, and `k` the sampled
   positions directly on unsupported loops. Assuming representative sampling,
   estimate `x + R * k / n`. Show the exact survivor count and the extrapolated
   contribution separately, together with uncertainty and the sampling scope.
   Exclude baseline members from `R` even when their old loop has disappeared.

The budget is for the residual sampling phase. Reuse cached root populations and
current-policy results to keep repeated runs quick. Never carry cached membership
results across a policy change without rechecking them. If the deadline interrupts
cycle classification, preserve an unresolved status: an unfinished search is not
proof of no cycle. Do not compute an apparently exact density from only the fast,
completed cases. Report bounds or a clearly labeled detection lower bound when
classification is incomplete. Zero discoveries in five seconds does not establish
that the remainder is loop-free. Do not silently substitute four-ply detection for
arbitrary cycle membership.

The historical `cohort-2026-09-23.json` contains 641 D4 positions from the older
`0205bf4` audit. It is retained for reproducibility; use the latest completed full
audit when creating the current baseline. Older audits used restricted Black
preferences. They can supply the historical cohort, but its survivors must be
rechecked with **all legal Black replies**, and its old density is not a current
all-legal measurement.

The current frozen baseline is `cohort-full-b1be217-2026-09-24.json`: **659 D4 positions /
5,272 physical positions** on wholly unsupported cycles, from the full-domain
audit of policy `b1be217`. Another 46 unsupported D4 positions lie only on mixed
supported/unsupported cycles. The older `cohort-full-2026-09-24.json` (1,159
positions, policy `9fbb749`) and other cohorts remain historical evidence.

See `docs/audits/2026-09-24-full-b1be217.md` for the exact counts and replays.
Use exact White K/B/N formations modulo D4 as the fine motif partition and
B/N setups as a separate coarser partition. Neither uses translations or played
moves to determine membership. Report the granularity alongside “largest”; do
not compare or add counts across the two partitions.

```sh
# Only after a new full audit: extract all cyclic positions, not just witnesses.
app/node_modules/.bin/tsx scripts/bishop-knight-audit/freeze-unsupported-cohort.mts \
  --audit /absolute/completed-full-audit --out /absolute/frozen-cohort.json

# Exact current-policy membership, all cycle lengths, wholly unsupported cycles.
app/node_modules/.bin/tsx scripts/bishop-knight-audit/unsupported-cohort.mts \
  --baseline scripts/bishop-knight-audit/cohort-full-b1be217-2026-09-24.json \
  --out /absolute/cohort-check

# Five-second residual sample, reusing the closed graph from that exact check.
app/node_modules/.bin/tsx scripts/bishop-knight-audit/residual-estimate.mts \
  --baseline scripts/bishop-knight-audit/cohort-full-b1be217-2026-09-24.json \
  --cohort-dir /absolute/cohort-check \
  --census /absolute/completed-full-audit/census.sqlite \
  --unsupported-population CURRENT_D4_UNSUPPORTED_POPULATION
```

The cohort checker uses two workers and caches complete results by policy and
baseline fingerprints. A changed policy needs a fresh output directory. Captures
and supported White results terminate their own branches. Cycle membership uses
labels on edges inside cyclic strongly connected components, so paths merely
leading to a loop never count. The sampler validates both fingerprints and
interleaves unfinished searches rather than letting one deep search consume the
whole budget. Its output explicitly separates hits, nonloops, and unresolved
samples; incomplete classification yields a detection lower-bound estimate.
Population preload and fingerprint validation precede the five-second sampling
clock. The unsupported population argument must come from the current support
census; an older census may supply the unchanged legal-placement domain, but its
support counts must not silently be reused after a support-rule change.

The older `cohort.mts` remains available for historical cohort checks that follow
paths through support changes; do not use its unfiltered counts as unsupported-
only loop totals.

## Staged work: seven, then five, then three

```sh
npm run audit:diagonal -- --diagonal 7 --out /absolute/seven-baseline --workers 8
npm run audit:diagonal -- --diagonal 7 --out /absolute/seven-after-fix --workers 8 \
  --compare /absolute/seven-baseline/result.json --gate loops
```

`--diagonal` filters **starting post-White placements only**. Every tied best
continuation is followed through smaller diagonals and unsupported positions;
reaching a five- or three-diagonal does not complete a seven-start path. The
starting filter is part of the immutable snapshot fingerprint. Later use `5`
and `3` with separate directories. A comparison must use the same stage.

`--gate loops` exits nonzero while any selected start can reach a cycle.
`--gate mate` additionally requires every branch to end in mate: no captures or
stalemates, and mate reachable from every selected start. An empty population
fails either gate. Reports and `gate.json` are written even on a failed gate.
Gates rerun when resuming; a previous successful stamp never bypasses them.
Zero-loop success must not be called mate success.

`placement-archetypes.json` groups **actual positions**, not played moves. It
counts every downstream cyclic board by its support size, the king/bishop's
central/edge/interior placement, and king protection of each minor. It also
records all component memberships and deduplicates shared boards. Consequently,
a seven-stage run can show three-diagonal or unsupported cycle motifs. The
report distinguishes these downstream totals from selected-start denominators.

For each fix: inspect the rule trace, change the application preference,
regress its reflections, run a new full stage, and compare against the previous
snapshot. Never treat breaking a recorded witness as an exhaustive improvement.
Do not change the support definition or bypass r1.5 solely to satisfy the gate.

Omit `--out` to use the gitignored `.audit/bishop-knight` directory. For a new
policy, use a new directory. Optionally add `--compare /previous/result.json`
to put the previous audit counts next to the current report.

This is exhaustive over **13,660,584 distinct post-White KBNvK placements**:
distinct piece squares and nonadjacent kings, either bishop color. It is a
placement census, not a retrograde proof that every placement is reachable from
an initial game. The 1,707,888 D4 symmetry representatives are weighted back to
physical placements. Support is classified only after White moves.

## Outputs

- `report.md`: percentages, archetypes, ranked components, localhost replay links.
- `display-loop.json`: a verified example, preferring a minimal four-ply loop,
  light-square bishop, and Black nearer h8 than a1.
- `result.json`: all components, representative loops, rule selection traces,
  reachable and exclusive placement counts.
- `root-family-membership.json`: which loop components each starting placement
  can reach, useful for measuring overlapping coverage of proposed fixes.
- `census.sqlite`: roots, cached White-position policies, and legal-reply edges.
- `manifest.json`: policy commit, exact bundle fingerprint, runtime and scope.
- `progress.json`: phase, elapsed time, roots and graph states processed.
- `*.complete`: completed stages; rerunning the same command resumes unfinished
  work and skips completed stages.

The stored executable bundles are a snapshot: edits to the application while
an audit runs cannot mix policies in the results. Resuming with different rules
or audit code is rejected. The report is regenerated on resume, so the comparison input can change.
A previous audit's White policies are never silently reused after rule changes.

## Reusing unchanged roots after preference changes

```sh
npm run audit:unsupported -- --out /new/audit --roots-from /previous/audit \
  --compare /previous/audit/result.json
```

The root cache contains only post-White support classifications and initial Black
replies, not White move choices. The command extracts the root evaluator's full
transitive dependency closure from both executable worker snapshots and compares
its normalized executable hash. If support or Black's policy changed, reuse is
rejected: omit `--roots-from` for a full census. Identical roots are copied in one
transaction with fresh node IDs; every preferred White move and legal Black reply is
still recomputed. This saves the enumeration phase on most preference-only edits.

## Meaning of the numbers

A starting position is a **Black-to-move board immediately after White moves**.
Black replies are all legal moves, with no capture priority, score filtering, or return preference. States use canonical boards without history. The old pair encoding is retained with a constant NONE history field for storage compatibility, but old snapshots cannot be resumed under the new fingerprint.

All tied preferred White moves and all legal Black replies are followed. A capture terminates only that reply; all other replies continue. In the default unsupported-only scope, branches
stop at a supported diagonal, mate, stalemate, or capture of a minor piece.
With `--scope all` or `--scope supported`, support is not terminal.
“Can reach a loop” means **at least one** best-move branch reaches a cycle;
“cannot reach a loop” does **not** mean forced mate. For the unsupported-only scope, support is a boundary,
not a claim about subsequent play. The fifty-move rule and repetition claims
are intentionally excluded from structural cycle detection.

“On a discovered loop” counts a post-White board on an internal cyclic-component edge. Merely reaching a loop does not count. With all legal Black replies, prior history cannot change membership. A component can contain multiple minimal loops; component totals are not counts of all possible simple cycles.

## Speed and safeguards

- Bundle production code once with esbuild.
- Bounded worker-local memoization of a pure piece-placement read, returning
  fresh copies to preserve the production API contract.
- Multiple worker processes evaluate independent batches.
- Compute each canonical White-position policy once; expand its legal Black replies without duplicate history states.
- SQLite transactions and checkpoints make interrupted runs resumable.
- Graph analysis uses typed arrays and iterative traversals, not recursive DFS.

Before enumeration, deterministic samples compare the optimized worker against
an unmodified production bundle and direct preferred-White and legal-Black move generation. Another
1,000 random placements check all eight symmetries. SCC reachability is checked
independently by repeatedly removing sinks. Witnesses are replayed three times
against preferred White moves and legal Black replies. Production Play Best may choose another Black reply, so replay the saved moves to see the witness.

## Maintaining the scaffold

`worker.mts` is the only policy adapter. `encoding.mts` owns packed placements,
D4 canonicalization, and legacy paired keys with constant NONE history. `census.mts` owns parallel work and
checkpointing. `analyze.mts` owns SCC/outcome analysis and witnesses.
`classify.mts` adds rule traces, reach/exclusive counts, and descriptive mechanism
groups. `report.mts` renders the result. Rule descriptions in `classify.mts`
should be updated when ordered subpriorities change; unmatched rules still get
the current rule help text and priority number rather than changing move selection.

Run focused scaffold tests:

```sh
npm run test:audit:unsupported
```

## Classifying positions directly on cycles

After an audit completes, run from `app/`:

```sh
npx tsx ../scripts/bishop-knight-audit/direct-membership.mts /completed/audit
```

This reads only the saved graph and results, without importing the current app
policy or rerunning enumeration. `direct-membership.json` reports distinct
post-White placements by moved piece, selection mechanism, and component closure,
plus counts per component. It deduplicates boards before restoring symmetry
weights, asserts the total matches the exhaustive analysis, and reports overlaps
between groups. Use these counts when targeting positions directly on cycles;
use the main report's reach counts when targeting all starts leading to cycles.
