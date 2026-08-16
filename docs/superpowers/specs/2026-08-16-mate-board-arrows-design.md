# Mate Board Arrow Drawing Design

## Change

Enable `react-chessboard`'s built-in arrow drawing on the interactive Mate board
by setting `allowDrawingArrows` to `true`.

This preserves the library's normal right-click-drag behavior and leaves piece
clicking, piece dragging, move submission, and board orientation unchanged. No
custom pointer handlers or arrow-state storage are needed.

## Verification

Add a component-level assertion that the board receives
`allowDrawingArrows: true`. Run the focused presentation tests, lint, and build,
then open a local Phase 1 loop for manual right-drag use.
