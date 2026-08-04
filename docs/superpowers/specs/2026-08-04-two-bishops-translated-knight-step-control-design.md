# Two Bishops Translated Knight-Step Control Design

## Goal

Make `degenerate — knight-step control` recognize its exact relative piece arrangement anywhere on the board, not only at the eight board-anchored D4 locations.

For `8/k7/2K5/8/8/1B6/1B6/8 w - - 0 1`, the rule must activate and accept `Be5`, the translated equivalent of the diagram's `Bd5`.

## Geometry

Preserve the canonical offsets from the diagram:

- Black king `h3` relative to White king `f4`;
- bishops `g8/g7` relative to White king;
- uncontrolled square `h5`; and
- target control square `g2`.

Apply each D4 rotation/reflection to that entire offset pattern, then translate its White-king anchor onto the actual White king. A match requires every translated square to remain on-board and every piece to occupy the exact translated relative square.

Keep the existing conditions: Phase 2, kings a knight's move apart, the designated square initially uncontrolled, and at least one legal bishop move establishing control of the translated target square.

## Alternatives Considered

- Enumerating individual translated fixtures would be verbose and easy to miss.
- Loosening the matcher to any knight-move king arrangement would discard the bishop geometry and overactivate.
- Transforming canonical offsets and translating the anchor preserves the existing human pattern exactly and is the selected approach.

## Verification

- Preserve the original diagram position and all D4 transforms.
- Add the supplied translated position and its D4 transforms, accepting `Be5` equivalents.
- Replace the former translated-position rejection with genuine relative-geometry near misses.
- Run focused Two Bishops rules, TypeScript, diagram validation, diff checks, and an all-Phase-2 fail-fast loop scan.

## Non-goals

- No change to other degenerates, their order, Phase 2, rendered copy, or move-selection rules.
