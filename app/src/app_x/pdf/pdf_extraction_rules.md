# Structured Book Source Rules

`book.json` is the single curated source for the reader. It represents all authored
study material from the Introduction through the Bibliography. Publication front
matter such as the cover, title page, copyright page, and printed table of contents
is intentionally excluded.

Do not regenerate or normalize `book.json` from the PDF or EPUB. Future fixes are
manual, narrow edits checked against the embedded PDF text and the relevant
rendered page. Extraction and repair scripts in `scripts/` are historical tools,
not supported source-writing workflows.

After a source edit, rebuild the derived runtime payload:

```bash
python3 scripts/build_chapter_payload.py
```

The builder validates `book.json`, precomputes playback/render metadata, writes one
cache-busted public `chapter-runtime.<hash>.json`, and updates
`chapterPayloadManifest.ts`. The source JSON is not bundled into the client and no
second source-shaped payload is emitted.

## Book Shape

```json
{
  "schemaVersion": 1,
  "parts": [
    {
      "id": "introduction",
      "label": "Introduction",
      "name": "Introduction",
      "sections": []
    }
  ]
}
```

Part order is Introduction, Chapters 1-15, then Bibliography. Preserve the PDF's
reading order within each part.

Every section has `type` and `content`. Supported types are:

- `title`: part title.
- `heading`: visible standalone heading.
- `text`: ordinary prose and chess analysis.
- `ending`: `{ "number": "21", "text": "..." }`.
- `panel`: a visibly boxed/callout passage with `text` and optional `title`.
- `caption`: nearby source, composer, year, or diagram note.
- `position`: legal playable chess position.
- `problem`: test position with prompt, hidden solution, and optional solution FEN.
- `diagram`: display-only instructional chessboard.
- `table`: semantic tabular material.

The retired `moves` and `note` section types must not be restored.

## Text And Structure

Preserve the author's complete wording, paragraph order, headings, and printed
callouts. Resolve PDF line-break hyphenation and broken chess glyphs manually;
do not rewrite the author's language. Omit running headers and page numbers.

`text` and move analysis both render as normal prose. Clickable moves are derived
from text automatically when an actual played line or explicit variation is legal
from its parent board. Threat descriptions and prose square references are not
clickable merely because they resemble SAN. For example, `threatening 3...Ng3`
and `the bishop goes to e7` remain prose.

An `ending`, `heading`, `title`, or new board closes the preceding board group.
Standalone introductions and headings must remain full-width rather than being
attached to the previous board. Content following a `position` remains associated
with that board until one of those boundaries appears.

## Positions And Problems

Every `position`, `problem`, and `diagram` contains an `orientation` read from the
rendered PDF. The current edition prints every audited board with White at the
bottom, so every current value is `white`; do not infer orientation from the
side-to-move FEN field.

Every `position` contains a globally unique `number` and a complete legal FEN.
Infer the active colour from nearby analysis when possible; otherwise use `w`.
Use `- - 0 1` for unknown castling, en-passant, and move counters.

Optional position fields:

- `subtitle`: printed heading directly introducing the board.
- `caption`: source, composer, date, or genuine analysis note.
- `displayLabel`: printed label used instead of the internal number.
- `alternateFens`: verified alternate initial states.
- `markers`: printed non-piece annotations layered over the board.
- `routes`: printed paths through ordered board squares, with a source meaning.

Each marker has `square`, `symbol`, and `meaning`. Optional `variant` is `badge`
or `label`. Markers remain present when sharing a square with a piece, so printed
key-square asterisks are visible above kings and other pieces.

A `problem` contains `number`, `prompt`, `fen`, and `solution`; `solutionFen` is
used when revealing the answer requires adding or changing a piece. Problem 14.13
intentionally uses an incomplete starting placement because choosing the white
king's square is the question; its `solutionFen` is legal.

When correcting a bad FEN, read the pieces from the rendered PDF diagram first.
Use the move text only to verify the result, never as the sole basis for inventing a
replacement position.

## Instructional Diagrams

Use `diagram` when a printed chessboard is explanatory rather than a legal game
position:

```json
{
  "type": "diagram",
  "content": {
    "number": "intro-rook-mobility",
    "label": "The rook",
    "fen": "8/8/8/8/8/8/8/8",
    "markers": [
      {
        "square": "a8",
        "symbol": "14",
        "meaning": "Squares dominated by a rook",
        "variant": "label"
      }
    ]
  }
}
```

Diagram FEN is placement-only and may omit kings. Diagrams have no playback,
active-board state, pointer cursor, or Lichess link. Legal fortress examples use
`position`; route, mobility, domination, and Troitsky boundary charts use
`diagram`. A diagram may use `subtitle` for the printed second caption line and
`routes` for a printed path that must remain visible above the board.

## Tables

Use `table` for printed tables:

```json
{
  "type": "table",
  "content": {
    "caption": "Endgame statistics",
    "columns": ["Type of ending", "Games"],
    "rows": [["Rooks", "320,548"]]
  }
}
```

All rows must match the column count. Keep numerical strings as printed.

## QA

For relevant source or playback changes, run:

```bash
cd app
npm test
npm run test:content
npm run test:audit-san
npm run test:audit-san:advisory -- --all
npm run lint
npm run build
```

Expected SAN failures and misses are zero. The source audit protects the 100 ending
numbers, complete part order, text anchors, section semantics, 337 board visuals,
and the byte-stable complete-book content hashes. Keep browser checks targeted to
the changed surface; this project does not use full visual end-to-end passes.
