# Streamlined Mate header and smaller board

## Goal

Remove redundant visible page and drill identity text, move the mating controls
directly beneath the module tabs, and reduce the exercise board's width and
height by 20% at every viewport.

## Confirmed header layout

The Mate page begins with the existing `Book | Mate` module selector. The
material-icon selector and horizontal Standard/Train controls follow directly
beneath it.

The following visible identity text is removed:

- the `Lotta Endgames` kicker;
- the large `Mate` page title;
- the selected set heading, such as `Queen`;
- the selected-mode badge, such as `Standard`.

Standard and Train remain visible in the selector because they are interactive
mode controls, not a duplicate selected-state heading.

A visually hidden level-one heading preserves a useful page heading for
assistive technology. The selected workspace keeps its existing descriptive
region label, so the current material and mode remain available to screen
readers without occupying visual space.

## Confirmed board sizing

The board is 80% of its former linear size. Its desktop maximum decreases from
roughly `32rem` to `25.6rem`, and the workspace board column shrinks with it so
the controls and move log receive the reclaimed width.

At narrower workspace breakpoints, the board column uses 80% of the available
content width, up to the same `25.6rem` maximum, and is centered. The board
remains square. Guidance and Position Details stay beneath the board and stack
naturally when the narrower column cannot support them side by side.

The controls and move log retain their current full-width stack after the board
when the workspace switches to one column.

## Boundaries and behavior

This is a composition and CSS layout change. It does not alter:

- selector routes or active states;
- chessboard position, orientation, notation, or piece interaction;
- the sequential 100 millisecond Play Best animations;
- session state, controls, log contents, sharing, or mating logic.

Sizing follows the repository's `rem` convention. The board remains
keyboard-operable and the page must not develop horizontal overflow.

## Component boundaries

- `Mate` removes the visible reader header, keeps a visually hidden page
  heading, and places `MateSidebar` immediately after the module selector.
- `MateWorkspace` removes only its visible set/mode header. Its descriptive
  region label, board/information column, and controls/log column remain.
- Mate CSS owns the 80% board sizing, centered responsive alignment, and the
  reclaimed desktop grid width.

No routing, catalog, rule, session, or persistence change is added.

## Verification

- Presentation tests confirm the visible kicker, page title, selected-set
  heading, and selected-mode badge are absent while the hidden level-one heading
  and labelled workspace remain.
- Selector links and Standard/Train controls retain their existing accessible
  names and active states.
- Existing Mate interaction and animation tests remain green.
- The production build and lint pass.
- A targeted desktop check confirms a board width near `25.6rem`, a wider log
  column, and the selector directly below `Book | Mate`.
- A targeted narrow-width check confirms an 80%-width centered board and no
  horizontal overflow.

## Alternatives rejected

- **Keep compact identity text beside the module tabs:** still repeats context
  already conveyed by the active module, selector, and labelled workspace.
- **Fixed desktop-only board cap:** leaves the mobile board at its former size
  and does not fulfill a consistent 20% reduction.
- **Reduce board area by 20%:** produces only a small linear-size change and is
  visually too subtle.
- **Shrink only the chessboard inside the existing wide column:** leaves unused
  space and does not return width to the controls and log.

## Constraints

- Preserve unrelated and in-progress user changes.
- Supersede the discarded 50% board design completely.
- Keep the patch limited to Mate composition, presentation coverage, sizing,
  and responsive alignment.
- Do not perform a broader visual pass.
