# Two Bishops: Degenerate XX

## Purpose

Break the Phase 2 cycle at
`5K1k/5B2/8/8/1B6/8/8/8 w - - 0 1` by recognizing the fixed king and
light-bishop setup and requiring the dark bishop to establish control of `h6`.

## Matcher

- Phase 2 only.
- Match White king `f8`, Black king `h8`, and the light-squared bishop `f7`.
- Match all D4 rotations and reflections.
- Do not match translations.
- Ignore the dark bishop's starting square, provided it has a legal move that
  can establish the required control.

## Selector

Keep only legal dark-bishop moves whose resulting position gives that bishop a
clear diagonal to `h6`. Stop after this repair so lower priorities cannot undo
it. In the supplied position, `Bd2` is the unique survivor.

## Presentation

Add `degenerate — xx` immediately after corner diagonals in both degenerate
priority and diagram order. Display the supplied position, highlight `h6`, and
show the arrow `Bb4–d2`. Caption: `Control h6 with the dark-squared bishop.`

## Verification

- Canonical `Bd2` selection and reason.
- All D4 equivalents.
- Rejection of translated and nearby king/light-bishop arrangements.
- Direct diagram/reason alignment.
- Focused Two Bishops tests, diagram generation check, TypeScript, and diff
  check.
- Find and load the next all-Phase-2 cycle in one fresh browser tab.

## Assumptions

- `xx` is the requested visible reason name, not a placeholder.
- “Control h6” means a clear bishop attack on `h6` after White's move, rather
  than occupying `h6`.
