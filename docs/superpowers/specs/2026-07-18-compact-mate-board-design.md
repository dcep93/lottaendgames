# Compact Mate board

## Goal

Reduce the Mate exercise board's visual dominance while giving the controls and
move log more room. The board's desktop maximum width decreases from roughly
`32rem` to `16rem`.

## Confirmed layout

The desktop workspace uses a board column capped at `16rem` and a flexible log
column that receives the reclaimed width. The board card, chessboard, and the
guidance/position-details group all remain inside the compact board column.

At narrower workspace breakpoints, the board column remains capped at `16rem`
and is centered rather than expanding to the viewport width. This avoids the
unusable result of applying a strict 50% viewport width on phones while keeping
the board materially smaller than its current mobile presentation.

The two information disclosures stack naturally when the compact column cannot
support them side by side. The controls and log retain their current full-width
stack below the board column at narrow widths.

## Boundaries and behavior

This is a CSS layout change. It does not alter the chessboard position,
orientation, notation, piece interaction, animation duration, session state,
routes, controls, log contents, selector, or mating logic.

Sizing follows the repository's `rem` convention. The board remains square,
keyboard-operable, and free of page-level horizontal overflow.

## Verification

- Existing Mate presentation and interaction tests remain green.
- The production build and lint pass.
- A targeted desktop check confirms a board width near `16rem` and a wider log
  column.
- A targeted narrow-width check confirms the board stays centered, does not
  exceed `16rem`, and introduces no horizontal overflow.

## Alternatives rejected

- **Strict 50% width at every viewport:** makes the board too small on phones.
- **Reduce board area by 50%:** produces only a modest linear-size reduction and
  does not satisfy the requested visual change.
- **Shrink only the chessboard inside the existing wide column:** leaves unused
  space and does not return width to the controls and log.

## Constraints

- Preserve unrelated and in-progress user changes.
- Keep the patch limited to Mate workspace sizing and responsive alignment.
- Do not perform a broader visual pass.
