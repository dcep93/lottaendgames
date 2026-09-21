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
- `census.sqlite`: roots, cached White-position policies, and history-aware edges.
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
transaction with fresh node IDs; every White policy and history transition is
still recomputed. This saves the enumeration phase on most preference-only edits.

## Meaning of the numbers

A starting position is a **Black-to-move board immediately after White moves**.
The first Black choice has no prior-position history. Thereafter each graph
state stores the current White-to-move board **and the previous White-turn
board**, because Black's return preference depends on that history.

All tied best White moves and all tied best Black replies are followed. Branches
stop at a supported diagonal, mate, stalemate, or capture of a minor piece.
“Can reach a loop” means **at least one** best-move branch reaches a cycle;
“cannot reach a loop” does **not** mean forced mate. Support is a boundary here,
not a claim about subsequent play. The fifty-move rule and repetition claims
are intentionally excluded from structural cycle detection.

“On a discovered loop” counts a post-White board occurring in a cyclic
history-aware component. “Fresh starts that can return to a loop containing
themselves” is stricter: the same board without history must be able to reach
that component. These are different denominators from White-turn history
states; the report's percentages always use unsupported post-White placements.

A component is a strongly connected group of history states and may contain
multiple distinct cycles. Reach counts overlap across components/archetypes;
exclusive reach and cumulative coverage avoid double counting. Exposure ranks
are not a promise that one rule change removes that many looping starts.

## Speed and safeguards

- Bundle production code once with esbuild.
- Bounded worker-local memoization of a pure piece-placement read, returning
  fresh copies to preserve the production API contract.
- Multiple worker processes evaluate independent batches.
- Compute each White-position policy once; reconstruct cheap transitions for
  each distinct return history from its cached branch data.
- SQLite transactions and checkpoints make interrupted runs resumable.
- Graph analysis uses typed arrays and iterative traversals, not recursive DFS.

Before enumeration, deterministic samples compare the optimized worker against
an unmodified production bundle and direct production history handling. Another
1,000 random placements check all eight symmetries. SCC reachability is checked
independently by repeatedly removing sinks. Witnesses are replayed three times
against production move selection. A cycle that needs preexisting history is
explicitly labeled instead of being advertised as a valid fresh-load replay.

## Maintaining the scaffold

`worker.mts` is the only policy adapter. `encoding.mts` owns packed placements,
D4 canonicalization, and paired-history keys. `census.mts` owns parallel work and
checkpointing. `analyze.mts` owns SCC/outcome analysis and witnesses.
`classify.mts` adds rule traces, reach/exclusive counts, and descriptive mechanism
groups. `report.mts` renders the result. Rule descriptions in `classify.mts`
should be updated when ordered subpriorities change; unmatched rules still get
an explicit rule ID and priority number rather than changing move selection.

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
