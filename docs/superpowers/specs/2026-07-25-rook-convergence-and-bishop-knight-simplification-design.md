# Rook Convergence and Bishop + Knight Simplification

## Goal

Make the Rook checkmate recommendations converge from every supported legal
position while presenting a short, memorable human strategy. Give Bishop +
Knight a smaller presentation cleanup without attempting to eliminate every
loop yet. Leave Two Knights unchanged.

## Rook

The visible strategy has three ideas after the universal rules:

1. **rook box** — Make a safe box around Black. Keep it, and shrink it whenever
   possible.
2. **waiting move** — When the box cannot shrink and White's king cannot get
   closer, move the rook without changing the box so Black must move.
3. **king closer** — Bring White's king toward Black's king.

The current implementation can prefer a waiting move over a safe shrink and
repeat a position. Merely reordering the existing rules still leaves many
cycles. Add an internal, position-only convergence filter backed by the exact
KRK progress table. When the current position is a supported winning position,
a recommended White move must lead to a supported winning position with a
strictly smaller rank.

This is not a shortest-mate rule. Every rank-decreasing move survives the
filter, so the board-based teaching priorities still choose among all safe
progress moves. The filter is internal: it does not appear in the modal,
reason column, or user vocabulary.

Merge the existing keep-box, shrink-box, and establish-box comparators under
the single visible `rook box` explanation. Remove `cover escape squares`; its
special one-ply net is neither necessary for convergence nor a useful general
lesson. Evaluate shrinking before waiting so a waiting move cannot replace a
safe reduction of Black's room.

## Bishop + Knight

Keep the current move-selection algorithm. Simplify its human-facing names and
copy into six board ideas:

1. **mating net**
2. **knight key square**
3. **build the cage**
4. **king closer**
5. **knight closer**
6. **bishop in front**

Each explanation is one short sentence. Replace the dense Zone X notes with a
brief explanation of the bishop-colored mating corners and simple captions for
the cage and key-square diagrams. Render both diagrams on ordinary 8×8 boards
so they remain legible on mobile. Condense Black resistance to the few useful
ideas a learner can remember.

Some Bishop + Knight loops may remain. This pass prioritizes simplicity and
presentation quality; exhaustive convergence is explicitly deferred.

## Verification

- Add Rook regressions for the known loop and for the internal filter staying
  out of presentation.
- Run the seeded Rook production verifier and the relevant unit tests.
- Confirm the Bishop + Knight rule list, descriptions, and diagrams match the
  simplified presentation.
- Run lint/build and inspect the training modal at desktop and mobile widths.
- Do not change Two Knights code, copy, tests, or presentation.
