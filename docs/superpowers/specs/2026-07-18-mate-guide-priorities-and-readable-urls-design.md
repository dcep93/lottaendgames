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

Both columns retain their registered production order. On narrow viewports the
columns stack with White first.

White's first three registered priorities are visually grouped under
**Universal priorities** with a short statement that they apply in every
position for the selected mating material. These are the universal mate,
material-safety, and stalemate protections. Remaining White priorities appear
under **Technique priorities** and keep their exact evaluator order.

## Selected Endgame Identity

The dialog heading uses the selected catalog label followed by “endgames,” such
as **Rook endgames** or **Bishop and Knight endgames**. “How best moves are
chosen” remains as supporting header text rather than the only title.

## Supporting Information

After the two priority columns, the dialog presents any rule notes, training
information, and the starting position.

Training information continues to explain Standard and Train because this is
useful reference material, but it does not announce the current mode. Remove:

- “Move White; Black replies automatically.”
- “Play Best makes one recommended White move.”
- the sentence explaining reason hints and the guide.

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

Tests cover priorities appearing before all supporting sections, adjacent grid
structure, the universal first-three group, selected endgame headings, exact
shortcut glyphs and copy removal, narrow-layout stacking, readable FEN and
replay encoding, legacy-link decoding and canonical routing, malformed input,
interactive dialog inspection, full tests, lint, and production build.
