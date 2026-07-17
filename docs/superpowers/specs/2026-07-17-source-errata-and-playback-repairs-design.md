# Source Errata and Playback Repairs Design

## Goal

Correct three audit findings without conflating errors introduced by the app with errors printed in the 2008 source PDF. The public About-page errata will list only confirmed source errors. App transcription, diagram, and playback mistakes will be corrected without an errata entry.

## Source Findings

### Position 10.19: app diagram error

The PDF diagram starts the white rook on h4. The app currently starts it on h5, which makes the printed move `3.Rh5` appear to be an illegal null move. The book is correct; the app FEN, derived playback positions, extraction report, ledger classification, and tests are wrong.

### Position 12.16: app transcription error

The PDF prints `1...Kb4 2.Ke5 Kxb3`. The app currently renders `1...Kxb4`, marks it unplayable, and stages the continuation from a manually supplied downstream position. The book is correct; the app text, playback classification, ledger classification, and tests are wrong.

### Position 12.19: printed move-number error

The PDF prints `4...Kb5` after `1.Kc1 Kd4 2.Kc2 Kc4 3.d3+ Kd4`, while describing it as an immediate counterattack. The coherent alternative is `3...Kb5`, played legally from c4 immediately after `3.d3+`. The source contains a move-number typo, not an illegal king jump.

## Product Behavior

### App-originated corrections

- Position 10.19 will render the rook on h4 and provide legal playback through `3.Rh5`.
- Position 12.16 will render the source-faithful `1...Kb4` and provide legal playback through `2.Ke5 Kxb3`.
- Neither correction will appear in About-page errata because neither is an error in the printed book.

### Source erratum

- Position 12.19 will continue to display the printed `4...Kb5` so the chapter text remains source-faithful.
- Its playback override will start from the position immediately after `3.d3+`, allowing the intended c4-b5 king move.
- The About page's existing “Note on this digital edition” list will add a linked Position 12.19 entry. It will state that the PDF prints `4...Kb5` on print page 185 / PDF page 186, and that the immediate legal alternative is `3...Kb5`.

## Data Changes

### Position 10.19

- Change the initial FEN to `3r4/8/8/8/7R/3P1k2/3K4/8 b - - 0 1`.
- Update every Position 10.19 playback parent FEN that depends on the rook starting on h4.
- Keep later parent positions on h5 only after the legal `3.Rh5` move.
- Update the diagram extraction report to the corrected FEN.

### Position 12.16

- Change only the erroneous main-line text from `1...Kxb4` to `1...Kb4`; the separate `1.b4?` variation still correctly contains `4...Kxb4`.
- Ensure `1...Kb4`, `2.Ke5`, and the remainder of the line are available as normal legal playback.
- Do not change the Position 12.16 diagram FEN.

### Position 12.19

- Keep the visible token `4...Kb5`.
- Change its playback parent FEN to `8/p7/P7/8/2k5/3P4/2K5/8 b - - 0 3`, the position after `3.d3+`.
- Do not change the Position 12.19 diagram FEN.

## Fidelity Ledger

The ledger generator remains the source of truth; the generated ledger will not be repaired by hand.

- Remove the false Position 10.19 `source-null-move-pdf-144` deviation and record the page and board as matched after correcting the app.
- Remove the false Position 12.16 `source-illegal-capture-pdf-184` deviation and record the page as matched.
- Replace the Position 12.19 `source-illegal-king-jump-pdf-186` classification with a source move-number typo. Its evidence will explain the legal `3...Kb5` alternative from c4.
- Regenerate `source_fidelity_ledger.json` after updating the generator and source data.

## Tests

- Assert the corrected Position 10.19 FEN and replay the main line from the diagram through `3.Rh5`.
- Remove `3.Rh5` from Chapter 10's unclickable-token expectations.
- Assert that Chapter 12 contains `1...Kb4 2.Ke5 Kxb3` and not the mistranscribed main-line `1...Kxb4`.
- Remove Position 12.16's `1...Kxb4` from unclickable-token expectations and add legal playback coverage.
- Remove Position 12.19's source-labeled `4...Kb5` from unclickable-token expectations and assert that it plays from the post-`3.d3+` position.
- Extend About-page presentation coverage for the linked Position 12.19 erratum, both page references, and the `3...Kb5` correction.
- Run the focused source-fidelity, move-parser, About-page, ledger, and source-validation tests, followed by the repository's standard test suite.

## Non-goals

- Do not expose the internal fidelity ledger in the UI.
- Do not add About entries for errors introduced only by the app.
- Do not silently change the Position 12.19 chapter text from `4...Kb5` to `3...Kb5`.
- Do not alter the already-correct Position 12.16 or Position 12.19 diagram layouts.
