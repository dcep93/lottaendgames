# Remaining Source Anomalies Design

## Goal

Resolve the three remaining source-fidelity findings without attributing app
transcription or playback defects to the printed book. Position 10.24 and
Position 10.26 will be repaired in the app. The genuine Position 11.1 source
anomaly will remain source-faithful in the chapter and will be disclosed in the
About-page errata.

## Approaches Considered

### Source-faithful targeted repair (selected)

Correct the app's staging for Position 10.24 and its transcription for Position
10.26. Preserve the exact Position 11.1 source text, keep its impossible move
unclickable, and explain the anomaly in About. This approach distinguishes
digital-edition defects from confirmed source defects and does not invent a
correction where the author's intended move is uncertain.

### Normalize every line to legal chess

Change all three lines to legal move sequences. This would make playback
uniform, but Position 11.1 has no securely established correction, so this
approach would silently replace the source with a guess.

### Preserve every current token and annotate only

Leave all chapter data unchanged and add notes around the suspicious moves.
This would preserve the current transcription, but it would retain the false
illegal-move findings created by the app in Positions 10.24 and 10.26.

## Source Findings

### Position 10.24: app playback anchoring error

The source gives `7.Kd4 Ke6 8.Kc4` as a side continuation. The app currently
anchors `7...Ke6 8.Kc4` after the separate `7.Rh7!?` line, placing the white
king on e4 before `8.Kc4` and making that move look like an illegal two-square
king jump. The printed continuation is legal when it begins from the position
after `6...Kf6` and includes `7.Kd4`.

### Position 10.26: app transcription error

The source prints `8.Rb8? Rh8+ 9.Kc7 Rh7+=`. The app currently transcribes the
first move as `8.Rb5?`, which makes the following `...Rh8+` impossible as a
check. The book is correct; the app text and playback positions are wrong.

### Position 11.1: confirmed source anomaly

The source prints `2...Rg1?! 3.Kc6` and later says `3...Rc8! holds`. A rook on
g1 cannot move to c8. The intended correction cannot be established from the
source with enough confidence, so the digital edition must not invent one.

## Product Behavior

### Position 10.24

- Keep the visible source prose and notation unchanged.
- Replace the incorrectly staged `7...Ke6 8.Kc4` segment with a segment that
  begins at `7.Kd4` from the position immediately after `6...Kf6`.
- Make `7.Kd4 Ke6 8.Kc4 Kd6 9.Kb4 Kc6=` available as legal playback.
- Remove the false claim that the book contains an illegal king jump.

### Position 10.26

- Change the chapter transcription from `8.Rb5?` to the source-faithful
  `8.Rb8?` in both visible text and playback data.
- Recompute the response position so `...Rh8+ 9.Kc7 Rh7+=` is legal and
  clickable.
- Remove the false claim that the book contains an impossible check.

### Position 11.1

- Preserve the chapter's exact `3...Rc8!` source token.
- Keep the impossible move unclickable rather than manufacturing a board state.
- Add a linked Position 11.1 entry to the About-page errata. It will identify
  print page 154 / PDF page 155, explain that the rook is on g1 and cannot reach
  c8, and state that the intended move is uncertain.

## Data and Ledger Changes

- Update Position 10.24's affected playback segments and parent FENs in
  `book.json`; no diagram FEN changes are required.
- Update Position 10.26's visible text, playback token, and dependent parent FEN
  in `book.json`; no diagram FEN changes are required.
- Keep Position 11.1's chapter data source-faithful.
- In the ledger generator, remove the false PDF-page 150 and PDF-page 152 source
  deviations and record those corrected units as matched.
- Retain the PDF-page 155 source deviation, with evidence that the About page
  discloses it and that no speculative correction was applied.
- Regenerate the fidelity ledger and chapter runtime payload from their curated
  sources rather than editing generated outputs by hand.

## Testing and Verification

- Replay Position 10.24 from the post-`6...Kf6` position through
  `7.Kd4 Ke6 8.Kc4 Kd6 9.Kb4 Kc6=`.
- Assert that Position 10.26 contains `8.Rb8?`, does not contain the app-only
  `8.Rb5?`, and replays through `...Rh8+ 9.Kc7 Rh7+=`.
- Keep Position 11.1's `3...Rc8!` in the unclickable-source-anomaly coverage.
- Verify the third About erratum's Position 11.1 link, both page references, and
  uncertainty wording.
- Regenerate the chapter payload and fidelity ledger, then run the focused
  parser, chapter-fidelity, About, ledger, and source-audit tests.
- Run the repository's standard test, content, strict-SAN, advisory, lint, build,
  and diff-integrity gates, followed by targeted visual checks of the affected
  positions and About entry.

## Non-goals

- Do not change any diagram layout for these positions.
- Do not expose the internal fidelity ledger in the UI.
- Do not list the Position 10.24 or Position 10.26 app defects as book errata.
- Do not guess what the Position 11.1 move should have been.
- Do not alter unrelated source normalization or playback behavior.
