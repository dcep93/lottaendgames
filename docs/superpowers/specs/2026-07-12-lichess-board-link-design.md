# Lichess Board Link Design

## Goal

Make every promoted board open its complete selected line in a new Lichess
analysis tab, with Lichess initially showing the move currently displayed in
Lotta Endgames.

## Interaction

The full board surface is an external link. It opens in a new tab and supports
normal link behaviors such as keyboard activation and opening through the
browser context menu. The whole board uses a pointer cursor to communicate that
it is one clickable surface. Pieces remain non-draggable and do not receive
separate interaction behavior.

Clicking the board does not change the active board or playback state in Lotta
Endgames.

## Line Selection

Build one linear line from the board's initial position to a leaf:

1. Include the ancestry of the move currently displayed on the board.
2. From the current move, follow the board's remembered preferred continuation.
3. Where no preference exists, follow the navigation graph's default main-line
   continuation.
4. Stop at the first leaf.

At the initial position, follow the main line unless the board still retains a
preferred continuation. Resetting a position currently clears its preferences,
so a reset board opens the main line.

## PGN And Lichess URL

Use `chess.js` to load the board's initial FEN, apply the selected SAN sequence,
and generate valid PGN. Arbitrary endgame positions receive the standard
`SetUp` and `FEN` headers automatically.

Open Lichess's temporary inline-PGN analysis route rather than importing a
permanent public game. Append the absolute current ply as the URL fragment.
Lichess uses that fragment to select the displayed move while retaining the
rest of the line for forward navigation.

The generated URL must remain within Lichess's 5,000-character inline-PGN route
limit. Treat an invalid line or oversized URL as unavailable instead of opening
a misleading partial analysis.

## Components

- A pure line-selection helper converts navigation state into an ordered move
  list and identifies the current ply.
- A pure Lichess helper validates the line with `chess.js`, generates PGN, and
  returns the analysis URL.
- `ChessBoard` receives the URL and renders the existing board inside an
  external link without changing chessboard interaction settings.

## Verification

- Unit-test main-line selection, hypothetical branch selection, current-ply
  indexing, initial-position indexing, black-to-move positions, invalid moves,
  and the URL-length guard.
- Confirm generated PGNs replay to the expected leaf FEN with `chess.js`.
- Run build, unit tests, lint, and relevant SAN/content audits.
- Do not perform a visual end-to-end pass, per project instructions.
