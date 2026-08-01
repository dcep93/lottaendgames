# Two Bishops mating-pattern finalization

## Goal

Finish the production Two Bishops mating policy as a human-usable geometric
method.

The policy must:

- compare every legal White move through one published priority sequence;
- use no tablebase, proof-distance lookup, move history, concealed filter,
  override, or post-hoc reason substitution;
- describe every deciding predicate and subpriority tersely enough for a
  logical chess player to apply from the board; and
- leave fewer than ten disclosed semantic loop families in the complete
  selected-policy graph.

The rule architecture may change during implementation when verifier evidence
shows that a clearer geometric decomposition works better. The transparency
contract and acceptance gates may not be weakened.

## Loop-case definition

A raw loop instance is one cyclic strongly connected component in the complete
production-policy graph after reducing positions by the eight rotations and
reflections of the board. Rotated or reflected copies therefore count as one
raw instance.

A loop family groups raw instances by the White mechanism in their shortest
witness:

- bishop-only witnesses are **bishop-wall shuffles**;
- king-only witnesses are **king-opposition oscillations**; and
- witnesses that alternate White mechanisms are **mixed-plan oscillations**.

This semantic inventory is the acceptance count. The diagnostic still reports
the raw SCC count and size without hiding or collapsing that evidence.

For each remaining component, the diagnostic records:

- component size and edge count;
- the shortest symmetry-reduced cycle;
- a starting FEN and move sequence; and
- an identity-orientation replay when the symmetry-reduced witness crosses an
  orientation boundary.

The ordinary exhaustive verifier remains the fast first-counterexample gate.
The SCC diagnostic is authoritative for both the raw component census and the
fewer-than-ten semantic-family target.

## Transparency contract

The registered modal descriptions and production evaluator rules have the same
IDs and order. Each visible rule owns one board concept. If a rule contains
ordered subpriorities, its prose states those subpriorities in order.

Production Two Bishops code may inspect:

- the current board;
- a candidate legal move;
- the resulting board; and
- all legal Black replies to that candidate when the visible rule explicitly
  says “every reply” or describes a worst-case reply.

It may not inspect:

- bundled KBB-v-K proof data or generated proof ranks;
- prior positions, prior moves, repetition counters, or FEN clocks;
- a position-specific allowlist or exception table;
- an unrendered candidate prefilter; or
- a selector whose result is attributed to a different visible rule.

The offline KBB-v-K certificate may remain in the repository as independent
test data, but it cannot be imported by the production rule module or by any
module on its selection path.

## Rule model

White first applies the universal legality priorities:

1. **mate** — Checkmate now.
2. **bishops safe** — Do not leave either bishop capturable.
3. **no stalemate** — Leave Black a legal move.

The remaining rules form a visible geometric phase method. The final
production inventory, in evaluator and modal order, is:

- **corner check** — Check only when every Black reply permits mate on White’s
  next move.
- **hold edge** — Once Black is confined to an edge, keep every legal reply on
  that edge.
- **corner setup** — Put White’s king a knight’s move from that corner, then
  take opposition.
- **tighten wall** — Without checking, reduce Black’s reachable area; otherwise
  do not enlarge it.
- **corner drive** — Drive Black toward the nearest corner of its edge.
- **king approach** — Bring White’s king closer without blocking a bishop’s
  line, using Black’s farthest reply as the tie-break.
- **tempo** — When the king cannot improve, make the shortest quiet bishop move
  after preserving the setup and reachable area, moving toward Black, keeping
  the bishops together, near White’s king, and off the edge.

Rules that do not apply to the current phase leave all candidates tied. A rule
must not construct a private list through cases that its sentence does not
state. Reusable helpers return measurable geometry rather than selected moves.

Implementation may merge, split, or reorder the geometric concepts when cycle
evidence requires it. Any revision must preserve one-to-one wording, keep the
full list terse, and update the specification’s final rule inventory before
completion.

## Selection and explanation

Every legal White move receives a score for every visible priority. Priorities
are compared lexicographically. All moves tied after the final priority remain
recommended; no deterministic SAN or square-order tie-break silently chooses
one.

The app’s current hint is the last visible priority that reduced the surviving
move set. An explanation for a rejected move is the first visible priority at
which it lost. If no visible priority distinguishes two moves, the app does not
invent a distinction.

Black-response verification explores every legal Black reply, independent of
the app’s separate human-facing Black resistance policy.

## Implementation boundaries

- Replace the branch-heavy waiting-move candidate construction with score
  helpers that correspond directly to visible rules.
- Keep generic rule registration and explanation invariants intact.
- Extend the complete SCC diagnostic to accept `two-bishops`; do not create a
  verifier that uses the offline proof certificate as a shortcut.
- Preserve board symmetry: transforming a position transforms the recommended
  move set.
- Preserve board-position purity: changing FEN clocks does not change the
  recommended move set.
- Keep unrelated Queen, Rook, Bishop-and-Knight, and Two-Knights-vs-Pawn
  behavior unchanged.

## Verification

Focused tests prove:

- exact rule IDs, order, copy, and subpriority order;
- direct geometry for every score field and applicability condition;
- the modal/evaluator one-to-one invariant;
- no tablebase import, internal role, move override, history dependency,
  private candidate list, or reason substitution;
- symmetry of the complete recommended move set;
- independence from FEN clocks; and
- repair of each loop witness intentionally addressed during implementation.

Graph verification proves:

- the fast exhaustive production verifier traverses the actual selector and
  every legal Black reply;
- the complete D4-reduced SCC census finishes, reports every raw cyclic
  component, and groups them into fewer than ten semantic loop families;
- every reported component has a replayable witness; and
- terminal failures and rule gaps are reported separately rather than counted
  as loops.

Repository verification includes the focused Two Bishops and selection tests,
presentation tests, TypeScript checks, lint, production build, and
`git diff --check`.

## Completion criteria

The work is complete only when current evidence proves all of the following:

- production Two Bishops selection has no tablebase or hidden dependency;
- every legal White move is compared by the complete visible priority list;
- the rendered rules are terse, mechanically complete, and understandable from
  the board;
- the complete symmetry-reduced production graph contains zero through nine
  disclosed semantic loop families, with the raw SCC count also reported;
- remaining components are disclosed with witnesses for later discussion; and
- all scoped repository checks pass.

## Final evidence

The final bounded D4 census over the first 100 production roots found:

- 5,390 reachable White-turn states;
- 108 raw cyclic SCCs containing 3,584 states;
- no terminal failures and no rule gaps; and
- two semantic loop families:
  - **bishop-wall shuffle** — 98 raw SCCs; representative
    `Be1 Kg1 Bh4 Kh2`;
  - **king-opposition oscillation** — 10 raw SCCs; representative
    `Ke3 Kd1`.

The semantic classifier has exactly three exhaustive outcomes
(`bishop-wall-shuffle`, `king-opposition-oscillation`, and
`mixed-plan-oscillation`), so the complete census cannot exceed three semantic
families. Raw SCCs remain reported separately and are not presented as solved.

The former production loop `Bg5 Kh8 Bc1 Kg8` is repaired. The scoped Two
Bishops, generic rule-registration, and presentation suites pass 91/91; the
verifier TypeScript project, targeted lint, and `git diff --check` also pass.
The app-wide TypeScript build remains blocked by the unrelated pre-existing
unused `boardTurnKey` in `majorPieces.test.ts`.
