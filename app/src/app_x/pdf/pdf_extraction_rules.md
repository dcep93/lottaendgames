# PDF Extraction Rules

These rules describe how to convert chapters from `100-endgames-you-must-know-2008.pdf` into JSON files for the app.

## Output Shape

Each chapter file is a top-level JSON array. Every entry is a section object:

```json
{ "type": "text", "content": "Paragraph text." }
```

Every section must have:

- `type`: a short lowercase string.
- `content`: either a string or an object, depending on the type.

## Section Types

- `title`: chapter title as a string.
- `text`: prose paragraph or a small group of continuous prose paragraphs as a string.
- `ending`: `{ "number": "21", "text": "Kings do not push. Just counting" }`.
- `position`: a diagram position object.
- `caption`: diagram source, composer, year, or nearby caption text.
- `moves`: chess analysis or move sequence text when it is clearer as its own section.
- `note`: extraction note for unavoidable ambiguity. Use sparingly.

## Reading Order

Preserve the printed chapter order. Section objects should appear in the same order a reader encounters them.

Omit running headers, page numbers, table-of-contents remnants, and repeated book titles unless they are part of the chapter content.

## Paragraphs

Use `text` for prose. Preserve full paragraph text. Adjacent short paragraphs may be grouped when they form one continuous explanation before the next structural element.

Fix obvious OCR spacing errors, especially around punctuation and chess words, while preserving the author's wording.

## Endings

Use `ending` whenever the printed text introduces an ending. The number is a string so it can preserve the printed label without numeric coercion.

Example:

```json
{
  "type": "ending",
  "content": {
    "number": "21",
    "text": "Kings do not push. Just counting"
  }
}
```

## Positions

Every `position` section must include:

- `number`: the printed position number, such as `"5.1"`.
- `fen`: a best-effort FEN string for the pieces only.

Use normal FEN fields when they are not known from the diagram:

- active color: infer from surrounding move text when possible, otherwise use `"w"`;
- castling: `"-"`;
- en passant: `"-"`;
- halfmove: `"0"`;
- fullmove: `"1"`.

Printed diagram symbols that are not pieces and cannot be represented in FEN belong in `markers`.

Example:

```json
{
  "type": "position",
  "content": {
    "number": "5.1",
    "fen": "8/8/8/8/8/8/8/8 w - - 0 1",
    "markers": [
      { "square": "e4", "symbol": "*", "meaning": "as printed" }
    ]
  }
}
```

The `fen` describes the chess pieces. The `markers` array supplements the FEN with printed diagram annotations such as `*`. If a marker's meaning is unclear, use `"as printed"`.

## Captions And Sources

Use `caption` for nearby diagram source text, composer names, years, and small labels that are not prose or moves. A caption may be a string or an object. Prefer a string unless structured fields are clearly helpful.

## Moves

Use `moves` for analysis lines and move sequences that would be hard to read inside a prose block. Keep the text human-readable and repair only obvious OCR spacing problems.

## QA

Use OCR text as a draft, not as the final authority. Check rendered page images for:

- chapter boundaries;
- ending labels;
- position numbers;
- diagram pieces;
- diagram markers;
- captions and source notes;
- chess notation;
- missing paragraphs.

Before finishing, validate that the JSON parses, every section has `type` and `content`, every ending has `number` and `text`, every position has `number` and `fen`, every marker has `square`, `symbol`, and `meaning`, and no `TODO` or `TBD` strings remain.
