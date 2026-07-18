# Exhaustive Mate Verifier Design

## Goal

Add a developer script that proves the implemented mating rules cannot loop or
fail across the positions the app can generate. The proof obligation is
universal:

- White may choose any move returned by the selected rule set as optimal.
- Black may choose any legal response, including responses the Black scoring
  rules consider suboptimal.
- Every resulting path must end in checkmate.

A repeated structural position, stalemate, material loss, promotion, fifty-move
draw, missing optimal move, illegal rule output, or other non-checkmate terminal
state fails verification.

## Surface

The capability is a Node/TypeScript developer script and is never bundled into
the rendered app.

```text
npm run verify:mate -- --mate all
npm run verify:mate -- --mate rook
```

The default proof covers all five implemented mating sets. A mate filter allows
focused development runs. The script prints periodic progress and a final
machine-readable summary.

Exit codes distinguish:

- `0`: the requested state universe was exhaustively verified;
- `1`: a concrete counterexample was found;
- `2`: verification was incomplete because of invalid configuration, resource
  limits, interruption, or an unsupported proof optimization.

An incomplete search must never be reported as verified.

## Starting-position universe

The verifier covers every position the production generators can emit:

- Queen and Rook: every legal distinct placement of the two kings and the
  mating piece that passes `validateMatePosition`.
- Two Bishops: every legal placement with opposite-colored White bishops.
- Bishop and Knight: every legal distinct placement of both kings, the bishop,
  and the knight.
- Two Knights vs Pawn: every Standard and Train source/transform declared by
  the production manifest, because this set uses a finite manifest rather than
  unrestricted placement generation.
- Train mode: every seed under every transform the production generator can
  select, retaining the seed's exact halfmove clock.

For unrestricted Standard generation the root clock is `0`, matching production.
Arbitrary shared-FEN positions outside these generator universes are not part of
the certificate.

## Proof graph

The verifier compresses play into full turns. A node is a legal White-to-move
position. To expand one node:

1. Ask the production rule set for every optimal White move.
2. Validate and apply each optimal move.
3. Accept a branch immediately if that move checkmates.
4. Fail if it creates any other terminal result.
5. Enumerate every legal Black move from the resulting position, not merely the
   rule set's preferred Black candidates.
6. Apply each response and either classify its terminal result or connect it to
   the next White-to-move node.

This makes both tied White moves and all Black replies universal branches. A
single failing branch invalidates the mating pattern.

Structural position identity uses the board, side to move, castling rights, and
en-passant square. Fullmove numbers do not affect the graph. Halfmove clocks are
tracked for fifty-move correctness, while a repeated structural identity still
counts as an algorithmic loop even if the increasing clock would eventually
force a draw.

## Exact search

Use a tri-color depth-first graph search with memoized completed nodes:

- entering a node marks it active;
- reaching an active structural node proves a cycle;
- a node is proven only after every child branch is proven;
- parent edges retain enough information to reconstruct a failure path and the
  exact boundary of a cycle.

The verifier has no success horizon. Optional node or time limits are diagnostic
only and return `incomplete` with exit code `2`.

For the large non-pawn universes, use compact piece-square encodings and board
symmetry canonicalization. Symmetry reduction is sound only after an exhaustive
equivariance audit confirms that transformed positions produce equivalent sets
of optimal White child positions. If that audit fails, verification stops as
incomplete with the mismatching position; it does not silently omit asymmetric
states. Pawn positions use only transformations that preserve pawn direction,
or no reduction when the finite manifest is already small.

Work may be divided among worker threads by root-position shards. Each worker
performs an exact search with its own active stack and memo. Duplicate work
between workers affects performance only, not correctness.

## Results and witnesses

A successful result reports, per mate set:

- root positions checked;
- unique structural positions expanded;
- White choices and Black replies traversed;
- maximum mating path found;
- elapsed time;
- exact verification status.

A non-cycle failure reports:

- mate set and failure classification;
- starting FEN;
- ordered SAN path;
- final FEN;
- relevant optimal/legal choice sets at a rule gap or illegal move.

A cycle failure is normalized to the minimal directly replayable witness. Its
`startingFen` is the encountered state at the first active occurrence, its move
list contains only the cycle, and `cycleStartPly` is `0`. The original root
prefix is omitted, while the root source label remains for provenance. The
final FEN remains the repeated state in the encountered orientation; under
symmetry reduction it may be proof-equivalent rather than textually identical
to the minimal starting FEN.

The witness must be directly replayable with `chess.js`. Output ordering and
position enumeration are deterministic so failures reproduce across runs.

## Code organization

Keep all verifier runtime code outside `app/src` so it cannot enter the browser
bundle:

```text
scripts/verify_mate_patterns.mts
scripts/mate-verifier/enumerate.mts
scripts/mate-verifier/search.mts
scripts/mate-verifier/state.mts
scripts/mate-verifier/report.mts
scripts/mate-verifier/*.test.mts
```

The verifier imports the production catalog, validation helpers, chess adapter,
and registered rule sets. It must not duplicate the mating rules it is intended
to verify.

## Testing and execution policy

Fast verifier tests use small injected graphs and focused real positions to pin:

- all optimal White choices are explored;
- all legal Black responses are explored;
- a non-preferred Black response can expose a failure;
- self-loops and longer cycles produce minimal witnesses without root prefixes;
- stalemate, material loss, promotion, rule gaps, and fifty-move draws fail;
- checkmate-only DAGs pass;
- resource limits return incomplete rather than success;
- enumeration is deterministic and matches the production generator universe.

These focused tests join the normal Mate test command. The full exhaustive proof
is intentionally an explicit developer command because its runtime is much
larger. Each mating-rule change should be followed by the relevant filtered
exhaustive command before release.
