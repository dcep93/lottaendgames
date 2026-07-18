# Compact Mate Log Table Design

## Goal

Reduce the Mate move log's minimum width while matching chess420's compact
training feedback. Preserve every existing historical-move cycling action.

## Table structure

Use these eight columns, in order:

1. `#`
2. `Phase`
3. `White`
4. `Black`
5. `Black replies`
6. `Correctness`
7. `Duration`
8. `Reason`

Remove the separate `Ideal Black replies` and `Legal Black replies` columns.
The combined `Black replies` cell displays `ideal / legal`. Each number remains
its existing button: the left number cycles an ideal Black reply, and the right
number cycles any legal Black reply. Existing disabled and busy states remain
unchanged.

## Correctness

Match chess420's presentation:

- Display `👍` for a correct White move and `👎` for an incorrect White move.
- Follow the emoji with a compact `/N` button when at least one ideal White move
  exists.
- The `/N` button keeps the current action, accessible label, and disabled
  behavior for cycling an ideal White move.
- Do not display the words `Correct`, `Incorrect`, `correct choice`, or `correct
  choices` as visible cell content. Those details remain available through the
  button's accessible label.

## Width and styling

Lower the table's explicit minimum width so the compact eight-column table fits
the log panel at common desktop widths without unnecessary horizontal scrolling.
Keep nowrap behavior for rows, the sticky header, the Reason ellipsis, and the
existing horizontal overflow fallback for genuinely narrow viewports.

Use a small inline separator treatment for ` / ` and preserve tabular numerals
on choice buttons.

## Testing

Update presentation tests to verify:

- The shortened `White` and `Black` headers.
- One `Black replies` header and no legacy reply headers.
- `ideal / legal` values render in one table cell and both controls retain their
  callbacks and labels.
- Correctness renders as `👍 /N` or `👎 /N` without visible descriptive labels.
- The reduced CSS minimum width remains responsive with horizontal overflow as a
  fallback.

