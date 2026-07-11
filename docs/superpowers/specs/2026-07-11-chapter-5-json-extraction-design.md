# Chapter 5 JSON Extraction Design

## Goal

Create a structured JSON representation of Chapter 5 from `app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf` and store it at `app/src/app_x/pdf/chapter_5.json`.

The JSON must represent the full chapter in reading order as an array of section objects:

```json
[
  { "type": "title", "content": "Rook vs Pawn" },
  { "type": "text", "content": "This is one of the most important chapters." }
]
```

The extraction rules should live beside the PDF at `app/src/app_x/pdf/pdf_extraction_rules.md` and should be treated as a living document for future chapter extraction work.

## Source Scope

Chapter 5 is "Rook vs. Pawn". The table of contents places it on book pages 68-82, with Chapter 6 "Rook vs. 2 Pawns" starting on book page 83.

The Chapter 5 JSON should include:

- chapter title;
- introductory prose;
- endings 21-29;
- positions 5.1-5.15;
- diagram captions and source notes;
- chess analysis and move text;
- all intervening prose needed to represent the complete chapter.

## JSON Shape

`chapter_5.json` will be a top-level JSON array. Every item has:

- `type`: a string identifying the section kind;
- `content`: the section payload.

Allowed section types for this chapter:

- `title`: chapter title string.
- `text`: prose paragraph or grouped prose paragraphs as a string.
- `ending`: object with `number` and `text`.
- `position`: object with `number`, best-effort `fen`, and optional metadata.
- `caption`: nearby diagram caption or source note when it should stand separately from a position.
- `moves`: chess analysis or move sequence text when distinct from surrounding prose.
- `note`: extraction note, used sparingly for unavoidable OCR or diagram ambiguity.

## Position Objects

Every `position` object must include a best-effort FEN string for the chess pieces, even when the printed diagram contains non-FEN annotations.

Non-FEN printed symbols are represented separately in `markers`.

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

The `fen` describes only the pieces and ordinary FEN fields. The `markers` array supplements the FEN with printed diagram annotations such as `*`. If a marker's meaning is unclear, the meaning should be `"as printed"` rather than guessed.

## Extraction Workflow

Use a manual-assisted workflow:

1. Use PDF text extraction to draft the chapter prose and locate headings, endings, positions, and analysis blocks.
2. Render or visually inspect the Chapter 5 pages to verify layout-sensitive content, especially diagrams, captions, chess notation, and symbols.
3. Reconstruct each position's best-effort FEN from the printed diagram.
4. Add marker objects for any printed non-FEN symbols.
5. Preserve all Chapter 5 content in reading order.
6. Validate the generated JSON.

This approach favors correctness over fully automatic extraction because the source PDF is OCR-backed and chess diagrams are not reliably represented as text.

## Rules Document

`app/src/app_x/pdf/pdf_extraction_rules.md` will define:

- target JSON array shape;
- allowed section types;
- paragraph grouping rules;
- reading-order expectations;
- handling for endings, positions, captions, moves, and notes;
- the best-effort FEN plus `markers` rule;
- QA expectations against rendered or visually inspected PDF pages.

## Validation

After generating `chapter_5.json`, run checks that confirm:

- the file parses as JSON;
- the top-level value is an array;
- every item has `type` and `content`;
- every `ending` has `number` and `text`;
- every `position` has `number` and `fen`;
- `markers`, when present, include `square`, `symbol`, and `meaning`;
- no placeholder strings such as `TODO` or `TBD` remain.

## Out Of Scope

This work will not build a reader UI, normalize the whole book, extract other chapters, or create an engine-validated chess database. It will focus only on representing Chapter 5 faithfully enough for the app to consume later.
