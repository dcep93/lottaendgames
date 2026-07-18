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
available track width. The White track contains White best moves followed by
Keyboard shortcuts. The Black track contains Black resistance followed by the
Starting position and its copy control. Both columns retain their registered
production order. On narrow viewports the two tracks stack, preserving those
groupings and placing the White track first.

The desktop dialog width is `69.6rem`, exactly 20% wider than its former
`58rem` width. It remains capped at 100% of the available container and keeps
the existing narrow-viewport padding and stacking behavior.

White's first three registered priorities are visually grouped without a label
or explanatory sentence. Remaining White priorities follow without a subsection
label and keep their exact evaluator order. The White column starts directly
with the numbered priorities; it does not render the rule set's White-intro
paragraph.

## Selected Endgame Identity

The dialog heading uses the selected catalog label followed by “endgames,” such
as **Rook endgames** or **Bishop and Knight endgames**. It has no subtitle.

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

Tests cover the 60/40 adjacent grid structure, shortcuts grouped below White,
the starting position grouped below Black, the universal first-three group,
selected endgame headings, exact shortcut glyphs, removal of headings and
priority-intro copy, narrow-layout stacking, readable FEN and replay encoding,
legacy-link decoding and canonical routing, malformed input, interactive dialog
inspection, full tests, lint, and production build.
