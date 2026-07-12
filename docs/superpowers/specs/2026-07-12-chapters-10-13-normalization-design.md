# Chapters 10-13 Normalization Design

## Goal

Normalize chapters 10-13 from OCR-backed text into cleaner chapter JSON that follows the same reading-order model as chapters 5-9: chapter title, endings, prose, move lines, callout panels, captions, and verified positions when available.

## Scope

- Clean noisy PDF text-layer chess notation into readable SAN-style notation.
- Preserve the author's prose while repairing obvious OCR spacing and piece-symbol artifacts.
- Split obvious move-heavy lines into `moves` sections.
- Split visibly labelled summary/conclusion blocks into `panel` sections.
- Add chapters 10-13 to strict playable-SAN audit only after their positions and moves can be verified by `chess.js`.

## Position Policy

Positions must not be invented from following move text. A `position` section needs a FEN extracted from the rendered PDF diagram or another verified source. If extraction is uncertain, the JSON should keep the nearby content as text/caption/moves without marking the position playable.

## Testing

Run the existing unit tests, content audit, lint, and build after regeneration. The content audit remains the gate for chapters whose SAN can be engine-replayed.
