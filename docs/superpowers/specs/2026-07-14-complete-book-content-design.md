# Complete Book Content Design

## Goal

Complete the reader's authored content by adding the Introduction, Chapter 15
(Appendix), and Bibliography. At the same time, consolidate all manually curated
book content into one canonical JSON source file.

After this work, the app will contain every authored reading and study section
from the Introduction through the Bibliography. Publication front matter - the
cover, title and copyright pages, ISBN page, and printed table of contents - remains
intentionally excluded because the app supplies its own navigation.

## Source Of Truth

The canonical source will be:

`app/src/app_x/pdf/book.json`

Its shape is:

```json
{
  "schemaVersion": 1,
  "parts": [
    {
      "id": "introduction",
      "label": "Introduction",
      "name": "Introduction",
      "sections": []
    },
    {
      "id": "1",
      "label": "Chapter 1",
      "name": "Basic endings",
      "sections": []
    }
  ]
}
```

The parts appear in authored reading order:

1. Introduction
2. Chapters 1-14
3. Chapter 15 - Appendix
4. Bibliography

The existing `chapter_*.json` files and `chapterManifest.json` will be retired
after migration and validation. Navigation, source-text tests, and payload builds
will derive labels, names, ordering, and sections from `book.json`; there will be
no compatibility layer or duplicate manifest.

All future corrections must be narrow manual edits to `book.json`. PDF/EPUB
extraction and normalization scripts must not regenerate this curated source.
`scripts/build_chapter_payload.py` remains responsible only for building the
derived source/runtime payloads and updating the hashed payload pointer.

## New Section Types

### Diagram

`diagram` represents an instructional chessboard that is not a legal game
position, such as a piece-mobility chart or route map.

```json
{
  "type": "diagram",
  "content": {
    "number": "intro-rook-mobility",
    "label": "The rook",
    "fen": "8/8/8/3R4/8/8/8/8",
    "markers": []
  }
}
```

Diagram FENs need valid piece-placement syntax but do not need legal kings, side
to move, or move counters. Diagrams render through `react-chessboard` and the
existing marker overlay, but never enter SAN parsing, keyboard playback, active
board state, or Lichess linking. Their cursor remains non-interactive.

### Table

`table` represents structured tabular content, initially the Introduction's
endgame statistics.

```json
{
  "type": "table",
  "content": {
    "caption": "Endgame statistics",
    "columns": ["Type of ending", "Games", "% games", "Drawn", "% drawn"],
    "rows": []
  }
}
```

Tables render as semantic HTML tables. They remain readable at desktop widths
and scroll horizontally within their own wrapper on narrow screens.

Existing section types continue to represent titles, headings, prose, panels,
ending banners, legal positions, and test problems.

## Content Representation

### Introduction

The Introduction preserves every authored paragraph and printed heading from
printed pages 9-25. Its statistics become one `table` section. The following
instructional charts become `diagram` sections with their printed square values
or paths represented as markers:

- rook mobility
- bishop mobility
- queen mobility
- knight mobility
- knight routes
- king routes
- knight domination

Positions I.1-I.6 become legal `position` sections with manually verified FENs,
captions, and identifiers that cannot collide with Chapter 1 positions.

### Chapter 15 - Appendix

The Appendix preserves its two printed sections, all explanatory prose, and all
diagram captions. Fortress positions F1-F19 become legal `position` sections.
Troitsky's Line becomes a legal position with the printed boundary stars stored
as markers. Position text follows each board in the existing board-above-content
study layout.

### Bibliography

The Bibliography preserves its introduction and every listed author/work entry.
Entries use standalone headings plus ordinary prose. No decorative cards or
invented metadata will be introduced.

All new prose is manually transcribed and checked against both the PDF's embedded
selectable text and rendered pages. Obvious extraction spacing and glyph errors
are corrected without rewriting the author's language.

## Runtime And Navigation

The async loading model remains unchanged: the browser fetches one hashed,
cache-busted runtime payload containing every part and precomputed metadata.
The source payload remains non-served.

The selector order is:

`Introduction -> Chapters 1-14 -> Chapter 15 - Appendix -> Bibliography`

The app opens on the Introduction. The top control remains the professional
dropdown; the bottom control remains the compact selector and supports all
seventeen destinations at narrow widths.

Runtime board counts include `position`, `problem`, and `diagram` sections.
Summary metadata omits zero-value categories. For example, the Bibliography
shows its section count without "0 endings" or "0 boards".

Legal fortress positions retain existing behavior: clicking the board opens its
FEN in the Lichess editor. Instructional diagrams are display-only.

## Rendering

Introduction and bibliography prose remains full width. Standalone headings stay
outside board groups. Legal positions use the established two-row study layout:
the board and its position copy share the header row, and corresponding text
occupies the independently scrollable row below it.

Instructional diagrams use the existing brown board palette and centered marker
overlay. They have stable responsive dimensions and no pointer cursor. The
statistics table receives restrained borders, a sticky header, and horizontal
overflow on small screens. Bibliography entries use existing heading and prose
typography rather than cards.

The established brown, pink, and occasional Comic Sans styling remains intact.

## Validation And Error Handling

The payload build must fail clearly when `book.json` has an invalid schema,
duplicate part ID, duplicate board identifier, unknown section type, malformed
table, malformed marker, invalid legal FEN, or invalid diagram piece placement.
The current runtime fetch error remains the user-facing fallback for a missing or
invalid generated payload.

Source validation will assert:

- exact part order and names;
- one canonical source file and no retired per-chapter JSON/manifest;
- all expected Introduction, Appendix, and Bibliography headings;
- the complete statistics table and bibliography list;
- 33 new board visuals: seven instructional diagrams, six Introduction fortress
  positions, nineteen Appendix fortress positions, and Troitsky's Line;
- unique board identifiers and valid marker squares;
- legal FENs through `chess.js` and separate diagram-placement validation;
- no retired `moves` sections, extraction artifacts, placeholders, or broken
  characters.

## Verification

Implementation is complete only when:

1. Every word on printed Introduction pages 9-25 and Appendix/Bibliography pages
   240-248 has been read and represented.
2. Every new diagram has been manually checked against a rendered PDF page.
3. Existing Chapters 1-14 remain byte-for-byte equivalent in section data after
   migration to `book.json`.
4. Strict and advisory SAN audits remain at zero misses across all 100 endings.
5. Selector, summary, table, diagram interaction, fortress Lichess links, and
   bibliography presentation tests pass.
6. The hashed payload is rebuilt and JSON validation, unit tests, content audits,
   lint, and the production build pass.
7. Targeted desktop and mobile browser checks confirm the new table, diagrams,
   board/text layout, navigation, and bibliography flow without overlap or
   clipping.

## Completeness

This scope completes the book as a reader: every authored study and reference
section from the Introduction through the Bibliography is present. Only
publication front matter already replaced by app chrome and navigation is omitted.
