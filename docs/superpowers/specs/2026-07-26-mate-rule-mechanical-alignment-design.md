# Mate rule mechanical alignment

## Goal

Make the evaluator, correctness result, reason column, and training modal describe
one identical decision process for every mating pattern.

Queen, Rook, and Two Bishops must remain loop-free and avoid fifty-move draws
under every recommended White move and every legal Black reply. Bishop-and-
Knight and Two-Knights-vs-Pawn must obey the same explanation contract, but this
pass does not require eliminating every loop in those two unfinished strategies.

## Non-negotiable invariant

Every mechanism that can eliminate a legal White move must be a visible,
human-readable priority in the modal at the same point where the evaluator
applies it.

For any position:

- `idealWhiteMoves` is the survivor set after applying the displayed priorities
  in order.
- `currentWhiteHint` is the last displayed priority that reduced that survivor
  set.
- A correct played move receives that exact current priority.
- An incorrect played move receives the first displayed priority that eliminated
  it.
- If no displayed priority distinguishes tied legal moves, no reason is invented.

The evaluator may compute tablebase distances, proof ranks, or other diagnostics
for offline verification, but those values may not affect move selection unless
they are represented by a displayed rule whose wording accurately describes the
mechanism.

## Shared selection architecture

The shared selector will expose one immutable decision trace containing:

- the surviving candidates;
- the priority that last reduced the survivor set; and
- the exact priority that eliminated each rejected candidate.

The registered rule-set facade will use that trace directly for correctness and
reasons. `currentTeachingHint`, which currently replaces an internal decision
with a visible rule that merely favors the winner, will be removed.

Built-in rule sets may not contain `presentationRole: internal`. A visible guard
is mechanically permissible, but it must appear in the modal and must be
returned as the actual reason when decisive. This pass will remove the existing
Rook and Two Bishops hidden guards rather than rename them.

Displayed priority order will be derived from evaluator order. `guideOrder` may
not make the modal contradict evaluation order. Universal priorities will
actually evaluate in the displayed order:

1. mate;
2. pieces safe;
3. no stalemate.

Repeated ids will be consolidated into one ordered rule with subpriorities when
they express one concept. A concept that occurs at two genuinely different
stages must receive two distinct names and descriptions; the modal may not
deduplicate separated evaluator stages into a false single priority.

## Pattern audit

### Queen

Queen has no hidden selector, but its consolidated descriptions and comparator
order will be audited together:

- two-square corner cage;
- queen a knight move from Black, off the edge;
- queen box size, shorter side before longer side; and
- king closer, including its channel and edge restrictions.

Each description will state every subpriority in its actual order. Exhaustive
Queen verification must still pass after consolidation.

### Rook

The hidden `rook convergence` stage will be removed from selection. Proof ranks
remain available only to the verifier.

The visible evaluator will use three teachable concepts:

- rook box: create, keep, and shrink Black's box;
- waiting move: when required by the king geometry, preserve the box and place
  the rook as far from Black as possible while closer to White; and
- king closer: approach Black without taking opposition when another equally
  close approach exists.

All score fields currently grouped under those concepts will be reordered or
consolidated so the prose is a complete description of the comparison. The
exhaustive Rook verifier will identify any regression; fixes must be expressed
as visible board geometry, never as a reintroduced proof-rank selector.

### Two Bishops

The `two-bishops proof filter` will be removed from selection. DTM remains an
offline oracle.

The repeated `corner finish` and `bishop wall` stages will each become one rule
with explicit subpriorities. The waiting-move predicate and its prose will be
made identical; a move such as `Bg4` cannot satisfy the prose while being
rejected by a narrower private predicate.

Verification will first search the production policy for loops and fifty-move
failures. Each failure will be repaired with a visible, position-only rule.
The bundled tablebase will then confirm that recommended moves retain a forced
mate and respect the fifty-move bound. It will never choose among them.

The generated modal diagrams will be regenerated because their active reasons
now come from the exact visible trace.

### Bishop and Knight

The exact finishing lookup will become a displayed scored priority rather than
a `whiteMoveOverride`. Immediate mate, safety, and stalemate remain ahead of it.
The reason `mating net` will therefore be both the displayed concept and the
mechanical discriminator.

Repeated concepts will be consolidated where their score stages are contiguous.
Any non-contiguous stage will be renamed or reordered so the modal exposes the
real sequence. Existing loop-oriented geometry may remain even if the overall
strategy still loops.

Black's special finishing-pattern behavior will either be represented in its
displayed priorities or removed; it may not remain an undocumented exception.

### Two Knights versus Pawn

The universal priorities will be reordered to match their display. The verified
construction is already a visible priority and may continue to use committed
route data because its description explicitly says so.

Every White and Black score field will be checked against the corresponding
modal sentence and ordering. Existing unsupported positions or loops are outside
this pass, but no hidden selector or false reason is allowed.

## Automated audit

A repository audit will fail when:

- a built-in evaluator contains an internal priority;
- displayed ids are ordered differently from their first evaluator occurrence;
- one visible id appears in separated evaluator stages;
- a move override bypasses the displayed priority sequence;
- `currentWhiteHint` differs from the selector's exact last eliminating rule;
- an incorrect move's reason differs from its exact eliminating rule; or
- a built-in rule has no visible description.

Pattern regression fixtures will include the reported Two Bishops `Bg4`
position. Exhaustive or certificate verification will cover Queen, Rook, and
Two Bishops. Focused fixture verification will cover Bishop-and-Knight and
Two-Knights.

## Completion criteria

- No post-hoc reason substitution remains.
- No hidden built-in White selector remains.
- Modal order equals evaluator order for all five patterns.
- Every tested correct and incorrect move reports its mechanical discriminator.
- Queen, Rook, and Two Bishops pass their exhaustive loop and fifty-move checks.
- All focused tests, TypeScript checks, lint, production build, and desktop/mobile
  modal checks pass.
