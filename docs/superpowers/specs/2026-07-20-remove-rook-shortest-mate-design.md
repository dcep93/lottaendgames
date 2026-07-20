# Remove Rook shortest-mate selection

## Goal

Remove `shortest mate` / `exact mate progress` from Rook move selection. Every algorithmic Rook priority must appear in the training guide with the same order, label, and explanation used by the reason column.

## Runtime policy

- Delete the exact-mate score fields, activation geometry, comparisons, guide entry, and Rook tests that assert exact-distance choices.
- Do not retain a hidden tablebase fallback, guide-only reordering, or an unexplained cycle breaker.
- Remove exact mate distance as a general-purpose Rook priority. Runtime may
  consult the exact table only inside a symmetry-canonical, verifier-generated
  draw-risk certificate exposed by the visible `avoid draws` rule.
- At `2R5/1k6/8/3K4/8/8/8/8 w - - 8 5`, the visible geometric priorities must select `Rc1`.

## Loop repair

After removing the rule, run the exhaustive symmetry SCC diagnostic. Repair
ordinary positions with concise geometry where the distinction is genuinely
human-recognizable. For the residual exceptional states, generate a
symmetry-canonical certificate and expose it as:

**avoid draws** — In a proven repetition or 50-move risk, choose a move that
leaves the draw.

Within a certified state, the rule accepts exact draw-exit steps as a binary
safety gate. It is not a global mate-distance comparison, and the later visible
geometric rules still decide among tied safe exits. The certificate also covers
an 80-ply safety corridor below the formal 100-ply boundary so a safe exit
cannot immediately re-enter an overlong detour.

For every cyclic component:

1. reduce the witness to its cycle boundary;
2. identify the missing human-recognizable geometric distinction;
3. add one concise visible rule and its matching score comparison, or add the
   exceptional symmetry class to `avoid draws`;
4. add literal and transformed regression fixtures; and
5. rerun the exhaustive diagnostic.

New rules must be rotation/reflection symmetric. They may use narrowly scoped
geometric edge cases or a generated verifier certificate, but no FEN, square,
orientation, history, box-size, exact-distance, or verifier-rank special case
may select a runtime move unless its effect is represented by a rendered rule.

## Required alignment

The registered Rook rule descriptions must be in evaluator order. No `guideOrder` may make the guide appear different from the runtime order. For any rejected legal move, the reason column must name the first visible rule that eliminates it.

## Verification

- Focused tests prove `Rc1` and exact guide/evaluator alignment.
- Full tests, lint, and build pass.
- The exhaustive symmetry Rook SCC check passes with zero cycles and zero rule
  gaps. Because the evaluator and certificate are symmetry-invariant, this
  covers all rotations and reflections.
- The independent symmetry policy-rank derivation proves every canonical root
  and reports a maximum White rank below 100 plies.
