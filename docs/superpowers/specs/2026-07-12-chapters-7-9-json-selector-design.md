# Chapters 7-9 JSON And Selector Design

## Goal

Add Chapters 7, 8, and 9 from `100-endgames-you-must-know-2008.pdf` to the structured app viewer.

## Scope

Create `chapter_7.json`, `chapter_8.json`, and `chapter_9.json` in `app/src/app_x/pdf/` using the existing chapter section schema. Preserve the printed reading order, full prose, ending labels, move lines, diagram captions, source notes, panels, and positions.

The viewer should expose Chapters 5-9 in the existing top and bottom chapter selector. Switching chapters should continue to reset active board state and rebuild move playback/navigation from the selected chapter.

## Extraction Strategy

Use OCR text as a draft and rendered PDF page images as the authority for chapter boundaries, diagrams, captions, panels, and chess notation. Chapter 7 covers PDF pages 90-96, Chapter 8 covers PDF pages 97-104, and Chapter 9 covers PDF pages 105-127. Stop before Chapter 10 begins.

Every diagram should include a best-effort FEN. When prose describes a hypothetical board state that has clickable SAN but no printed diagram, represent that context with `alternateFens` on the nearest position rather than leaving the SAN unclickable.

## Validation

Run JSON parsing and schema validation for all chapter files, validate FENs through chess.js, scan all text/move/panel sections for SAN-looking tokens that fell through as plain text, and run `npm test`, `npm run lint`, and `npm run build`.

Use a browser check after implementation to verify the selector reaches Chapters 7-9 and boards render without console errors.
