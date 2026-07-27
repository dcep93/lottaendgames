# Bishop and Knight policy finalization

## Goal

Finalize the Bishop + Knight mating pattern as a transparent teaching policy
that works from every supported Standard position and reaches the existing
finishing route with fewer than 20 remaining loop families.

The app must recommend moves through terse, logical, human-readable board
rules. The current 119-entry mating-net lookup may remain unchanged, but no
entry, tablebase lookup, proof rank, concealed selector, or post-hoc
explanation may be added.

## Fixed constraints

- Keep all 119 mating-net entries byte-for-byte unchanged.
- Do not add another lookup, route table, tablebase query, proof-distance
  selector, move override, or history-dependent White priority.
- Score White moves from the current position and candidate move only.
- Render every priority that can eliminate a White move, in evaluator order.
- Use the actual decisive priority for correctness, current hints, and the
  Reason column.
- Keep every rule understandable without engine analysis.
- Keep rule titles and descriptions terse.
- Treat rotations and reflections identically.

Black may continue using its displayed return-to-position and resistance
priorities. Any special treatment of the W maneuver or mating-net replies must
remain visible in the Black-resistance text.

## Policy structure

The policy will use a strict sequence of position-based comparisons. Immediate
mate, material safety, and stalemate prevention remain universal. The
provisional strategic sequence is:

1. **mate**
2. **pieces safe**
3. **no stalemate**
4. **mating net** — Follow the recorded finishing route when available;
   otherwise enter it.
5. **knight key square** — Move the king inward, then place the knight between
   the kings to seal the edge.
6. **edge cage** — Enter and keep the bishop-and-knight cage; use an established
   knight route first.
7. **king closer** — Bring White's king closer without opening the cage.
8. **coordinate pieces** — Keep the knight behind White's king and the bishop
   in front; bring the knight closer when neither formation is available.

These labels and their order may change when concrete loop evidence shows that
a different decomposition is more accurate or teachable. The fixed requirement
is that the final prose completely describes the final comparisons in their
actual order.

## Scoring design

The current policy contains overlapping pairwise comparisons that can produce
comparison cycles before board-state loops are considered. Replace those
comparisons with total, deterministic, D4-symmetric position scores.

Each visible rule may contain a short lexicographic tuple when its sentence
states the same ordering. A later rule may not silently override or repair an
earlier rule. If two moves remain indistinguishable after every displayed
priority, both remain correct.

Existing geometric helpers may be retained when they:

- inspect only the current board and candidate result;
- behave identically under all eight rotations and reflections;
- implement the displayed sentence exactly; and
- do not encode individual positions or routes.

Position-specific fixes are prohibited outside the unchanged mating-net table.

## Loop metric

A loop case is one cyclic strongly connected component in the complete
symmetry-reduced production-policy graph.

The authoritative acceptance run:

- enumerates every supported production root;
- expands every tied correct White move;
- expands every legal Black reply;
- uses D4 symmetry only for graph identity;
- reports the number of cyclic components; and
- succeeds for this project when that number is less than 20.

Rotations and reflections of one cyclic region count once. Distinct cyclic
regions count separately. For every remaining component, an identity-mode run
must produce a directly playable local FEN and move sequence.

## Development workflow

Development will proceed by geometric rule families rather than isolated FEN
exceptions:

1. Preserve the known exact four-ply `build the cage` / `king closer` loop as a
   regression witness.
2. Replace cyclic comparison machinery with total position scores.
3. Run focused rule, symmetry, and lookup-integrity tests.
4. Run bounded or first-failure diagnostics while iterating.
5. Classify each witness by the earliest visible rule that permits the cycle.
6. Refine the general board rule and add a regression covering all symmetries.
7. Run one complete symmetry-reduced SCC analysis after the bounded diagnostics
   stabilize.
8. Generate identity-mode witnesses for every remaining component.

Resource-heavy graph runs must be sequential. A bounded run that grows without
useful progress should be stopped rather than allowed to exhaust the machine.

### Bishop wall refinement

The first phase should express the human plan directly: drive Black away from
White's king and toward an edge. A visible `build the wall` rule therefore
prefers a safe bishop move that places the bishop orthogonally adjacent to
White's king on Black's side of the king. Among otherwise equal wall moves, it
prefers the move whose legal Black replies leave Black with the least access to
the center.

This rule is position-only, D4-symmetric, and uses one-ply legal reply geometry.
It is not a tablebase, route lookup, history check, or encoded position. The
canonical focused witness should select `Bd5`; after `...Ke3`, the same rule
should select `Be4`.

## Integrity checks

Automated tests must prove:

- the lookup still contains exactly the same 119 frozen entries and checksum;
- no Bishop + Knight production module imports a tablebase or proof-rank
  selector;
- no built-in move override or hidden rule exists;
- evaluator order equals modal order;
- every correct and incorrect fixture reports its actual discriminator;
- all score comparisons are deterministic and order-independent;
- every geometric comparison preserves D4 symmetry;
- every lookup entry and transformed move remains legal;
- the fixed mating-net route still mates against every supported reply;
- selected branches do not lose a minor piece or stalemate;
- no supported position has a rule gap; and
- the complete graph contains fewer than 20 cyclic components.

## Completion

The work is complete when the production policy satisfies the fixed constraints,
the displayed rules are concise and mechanically exact, the existing mating
net remains unchanged, the authoritative graph reports fewer than 20 loop
families, every remaining family has a playable witness, and the focused tests,
TypeScript checks, lint, production build, and diff checks pass.
