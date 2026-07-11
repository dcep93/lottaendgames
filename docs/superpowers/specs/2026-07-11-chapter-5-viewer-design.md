# Chapter 5 Viewer Design

## Goal

Render `app/src/app_x/pdf/chapter_5.json` as a readable Vite app experience inside `app/src/app_x`.

The first version should be a static Chapter 5 reader with actual chessboards generated from FEN, marker overlays for non-FEN diagram annotations, and tailored rendering for the JSON section types.

## Data Flow

The app imports `chapter_5.json` at build time. There is no runtime fetch, backend, Firebase runtime dependency, or persistence.

The JSON is a top-level array of section objects:

```json
{ "type": "text", "content": "Paragraph text." }
```

The viewer renders the array in order.

## Components

Implementation should stay inside `app/src/app_x`.

Suggested units:

- `ChapterViewer`: owns the page shell and maps over sections.
- `SectionRenderer`: routes each `{ type, content }` item to the right view.
- `ChessBoard`: parses and renders a FEN position.
- FEN helpers: parse the piece-placement field into an 8-by-8 board.
- Section types: TypeScript types for title, text, ending, caption, moves, position, markers, and unknown fallbacks.

These can start in one or a few files as long as the code remains readable. Split files if the implementation grows large.

## Section Rendering

- `title`: large page title.
- `text`: readable prose block.
- `ending`: strong divider with ending number and title.
- `caption`: small label/source note.
- `moves`: distinct analysis block that reads differently from prose.
- `position`: board card with position number, optional caption, chessboard, marker overlays, and a compact FEN line.
- unknown section type: small note so malformed future data does not crash the app.

## Board Rendering

The board renderer will parse the FEN piece-placement field and draw an 8-by-8 board. Orientation is standard: rank 8 at the top, White's side at the bottom.

Pieces render with Unicode chess symbols. Use a high-contrast font stack that works for chess glyphs.

Use the FEN for pieces only. The board renderer does not need to validate legal chess, turn, castling, en passant, or move counters.

## Markers

Position markers render on top of the board square named in JSON.

- `symbol: "*"` renders as a small pink star badge.
- `symbol: "outlined square"` renders as an inset outline.
- unknown symbols render as a small badge with the printed symbol.

Markers supplement the FEN and should not replace chess pieces.

## Visual Style

Keep the current house style:

- dark/night base;
- warm brown panels and borders;
- pink title/accent moments;
- occasional playful Comic Sans/Chalkboard-style display typography;
- polished but compact reading layout.

The page should be a single scrollable chapter reader. Text should sit in a comfortable reading column; board cards can be slightly wider but must remain responsive.

On mobile, boards shrink to fit the viewport without horizontal scrolling, and text must not overlap or overflow its containers.

## Validation

After implementation, run:

- `npm run build`
- `npm run lint`

Also perform browser visual checks at desktop and mobile widths. Confirm:

- the title renders;
- ending dividers render;
- prose and moves are readable;
- boards render from FEN;
- markers appear on board squares;
- layout does not overlap or overflow.

## Out Of Scope

This pass will not add search, chapter navigation, PDF side-by-side viewing, move playback, engine validation, legal move validation, JSON editing, or multi-chapter routing.
