# Mate Guide Priorities and Readable URLs

## Goal

Make the Mate training dialog lead with the evaluator rules that matter most,
show the relationship between White's choices and Black's resistance, identify
the selected endgame explicitly, simplify the supporting copy, and replace
percent-heavy exact-position URLs with readable hashes.

## Priorities-First Dialog

The first content inside the dialog is a responsive two-column grid:

- **White best moves** appears on the left.
- **Black resistance** appears on the right.

At desktop widths, the grid uses `minmax(0, 3fr) minmax(0, 2fr)`, giving the
White column approximately 60% and the Black column approximately 40% of the
available track width. White best moves and Black resistance share that grid's
row. The priorities grid uses `align-items: start`, so both sections keep their
natural content height and pack their content at the top instead of stretching
internal rows across the height of the taller section. A separate sibling grid
uses two equal
`minmax(0, 1fr)` tracks for Keyboard shortcuts and Starting position. This
makes the two supporting sections start at the same vertical position and gives
each half of the available width. On narrow viewports both grids become one
column, producing White, Black, Keyboard shortcuts, Starting position.

The desktop dialog width is `69.6rem`, exactly 20% wider than its former
`58rem` width. It remains capped at 100% of the available container and keeps
the existing narrow-viewport padding and stacking behavior.

White's first three registered priorities are visually grouped without a label
or explanatory sentence. Every built-in material presents those priorities in
this exact universal order and with no help-text suffix:

1. `mate`
2. `pieces safe`
3. `no stalemate`

The registered descriptions also supply these concise labels to current hints
and move-log reasons. Material-specific stable rule IDs remain unchanged.
Where an evaluator applies safety and stalemate in a different order, explicit
guide ordering changes presentation only; scoring and move selection retain
their production order. Remaining White priorities follow without a subsection
label and keep their registered guide order. The White column starts directly
with the numbered priorities; it does not render the rule set's White-intro
paragraph.

## Selected Endgame Identity

The dialog heading uses the selected catalog label followed by “: checkmate,”
such as **Rook: checkmate** or **Bishop and Knight: checkmate**. It has no
subtitle.

## Supporting Information

After the two-column area, the dialog presents any rule notes at full width.
It does not contain a “How training works” section or descriptions of the two
modes. Remove:

- “How best moves are chosen.”
- “How training works.”
- the Standard and Train explanatory bullets.
- “Move White; Black replies automatically.”
- “Play Best makes one recommended White move.”
- the sentence explaining reason hints and the guide.
- the explanatory paragraph about best moves surviving priorities and tied moves
  remaining best moves.

The user-facing name of the `train` mode is **Training Wheels** in the sidebar
and accessible workspace label. The internal mode value and `/train` route stay
unchanged for compatibility.

Keyboard shortcuts use compact key/action pairs:

- `Enter`: Start over
- `←`: Undo
- `↑`: Play best move
- `→`: Redo

The arrow glyphs are literal Unicode arrows rendered in keyboard-key elements.

## Reason-Linked Highlighting

Opening the guide from a current reason hint or a move-log reason carries that
rule's stable ID into the dialog. The matching White priority receives a
high-contrast highlight and `aria-current="true"`, making the clicked reason
easy to locate visually and identifiable to assistive technology.

Opening the guide from the generic Training info button or Reason column header
does not highlight a priority. A missing or unregistered reason ID also leaves
the guide unhighlighted. Closing and reopening from a generic opener clears any
previous selection. The highlight changes presentation only; rule ordering,
evaluation, and log data remain unchanged.

## Readable Mate Hashes

Canonical FEN-only links use:

```text
#fen=<board>_<turn>_<castling>_<en-passant>_<halfmove>_<fullmove>
```

For example:

```text
#fen=8/8/8/8/3k4/8/1R6/3K4_w_-_-_0_1
```

FEN fields cannot contain underscores, so the format is unambiguous. Replay
links retain the same readable FEN and encode SAN plies as a comma-delimited
`moves` field. Individual SAN tokens remain percent-encoded where required for
characters such as `+` and `#`, but ordinary separators no longer become
`%20`.

The decoder accepts both the new readable format and the existing fully
percent-encoded FEN/move format. Routing always emits the new canonical form,
so opening an old link upgrades it through the existing history replacement.
All existing supported-position, counter, castling, replay length, terminal,
and move-legality checks remain unchanged.

## Tests and Verification

Tests cover the top-aligned 60/40 priority grid, White and Black sharing its row,
the separate 50/50 supporting grid for Keyboard shortcuts and Starting position,
the exact universal first-three labels and order across every material, selected
endgame headings, exact shortcut glyphs,
removal of headings and priority-intro copy, narrow-layout stacking, readable
FEN and replay encoding, legacy-link decoding and canonical routing, malformed
input, clicked-reason highlighting and generic-opener clearing, interactive
dialog inspection, full tests, lint, and production build.
