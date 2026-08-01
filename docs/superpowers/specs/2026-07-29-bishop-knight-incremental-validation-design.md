# Bishop + Knight incremental validation design

## Goal

Validate one unchanged, visible Bishop + Knight policy through nested fixed-seed
gates without rebuilding already explored closures, while safely retaining
policy-independent chess work across policy revisions.

## Root sequence

The permanent adversarial corpus is always the prefix. Random legal positions
then come from a deterministic online, D4-canonical sequence. Selection uses
only board geometry, never the current rule label, so changing a rule cannot
silently change the roots. Every larger gate is an exact prefix extension of
the smaller gate.

## Cache boundaries

Persistent SQLite rows store:

- normalized positions and canonical D4 keys;
- legal White moves;
- the result of applying one legal White move, including all legal Black
  replies and terminal outcomes; and
- complete selected-policy expansions keyed by a deterministic source
  fingerprint.

The source fingerprint covers the production rule and selector sources. A
policy change therefore cannot reuse selected White moves, reason-dependent
edges, failures, or results from an older policy. Policy-independent position
and move rows remain reusable.

An in-memory graph session belongs to exactly one fingerprint. Adding a larger
root prefix adds unseen roots, expands only newly reached nodes, and retains one
global node map and edge store. SCC analysis may rebuild compact adjacency from
the retained edges, but it never calls the policy again for an already expanded
node.

## Reporting

Each rung reports:

- policy fingerprint and root-prefix digest;
- newly added roots, nodes, expansions, and edges;
- graph-session expansion hits and misses;
- persistent primitive and policy-expansion hits and misses;
- SCC and failure totals; and
- the next rung attempted only when the unchanged candidate passes.

Any rule change creates a new fingerprint and resets candidate validation to
the ten-root gate. Only the persistent policy-independent rows carry over.

## Development gate correction

Policy iteration does not use the global SCC graph. It checks ten fixed,
D4-canonical development roots independently, followed by a small permanent
smoke corpus of representative witnesses. The existing exact proof search
stops on the first repeated board or disallowed terminal branch. A failing root
therefore produces a playable witness without exploring unrelated roots.

The development cache has three explicit namespaces:

- canonical position keys are policy-independent;
- selected expansions are keyed by a deterministic policy fingerprint; and
- completed root results are keyed by the same fingerprint.

The root runner reuses cached completed roots, but each uncached root receives
its own proof stack and completed-proof map. This prevents one root's proof
state from hiding a cycle in another. A failed gate stops immediately. A rule
change invalidates selected expansions and root results without invalidating
canonical position keys.

Only an unchanged candidate that passes this small gate advances to 100, then
1,000, then the full adversarial corpus. The global SCC census remains a
separate final-validation tool for a frozen policy.

## First root-local policy correction

The first smoke witness starts with an established wall: White's bishop is
beside White's king on Black's side. The former final tie-break moved that
bishop as far from Black as possible, producing `Ba3 ...Kd8 Bd6 ...Ke8` and
reconstructing the same board.

`edge cage` now preserves an established bishop wall before choosing how to
hold Black on the edge. This is a position-only invariant, not a remembered-move
exception: if the current board has no wall, the comparison is neutral. Its
rendered instruction states the same priority explicitly. The invariant lives
in `edge cage`, rather than the later `coordinate pieces` rule, because the
later placement cannot recover wall-preserving moves already eliminated by
king approach priorities.

When two wall squares contain Black equally well, `edge cage` keeps the bishop
on the wall square closest to Black's edge. This prevents the wall from
rotating inward merely because Black sidesteps, and expresses the human goal of
pushing Black toward an edge. Once the existing wall and knight formation are
safe, this stable edgeward progress comes before reactive one-move escape
control; otherwise the knight can chase Black laterally forever.

The next exposed cycle moved White's already wall-adjacent king back and forth
while the knight remained distant. The ordinary handoff is simpler than a new
knight-specific priority: once the king-bishop wall is established, `king
closer` no longer applies. The existing coordination rule can then choose the
king or knight handoff without forcing either piece to chase Black laterally.

The following gate reached the knight's key square, then immediately moved the
knight away to reconstruct the wall. When the two shapes cannot both survive
one move, the established knight seal takes precedence: keep the knight on its
key square and use a bishop waiting move. This is again board-only geometry;
the comparison is neutral until the current board already has the seal.

Likewise, once the knight is already behind White's king, `edge cage` does not
move that knight out of formation merely to answer Black's current square. A
king or bishop move may legitimately change the relative label. Once the
knight is also adjacent to White's king, hold the knight while the king or
bishop advances. When the knight–king gap is larger, ordinary coordination may
still bring the knight closer.

During ordinary coordination, an established wall changes the order of work:
keep the knight behind the king, then bring knight and king together before
re-evaluating whether the bishop is in front. This prevents White's king from
circling a distant knight merely to preserve a transient bishop-front score.
Without an established wall, the added comparison is neutral.
