# PDF Extraction Rules

These rules describe how to convert chapters from `100-endgames-you-must-know-2008.pdf` into JSON files for the app.

## Output Shape

Each chapter file is a top-level JSON array. Every entry is a section object:

```json
{ "type": "text", "content": "Paragraph text." }
```

The app runtime does not import these per-chapter source files directly. After changing chapter JSON, regenerate the single async-loaded payload and its TypeScript pointer with:

```bash
python3 scripts/build_chapter_payload.py
```

The generated runtime file is `app/public/app_x/chapters.<hash>.json` and includes `schemaVersion`, a deterministic `contentHash`, and every chapter's sections. `app/src/app_x/chapterPayloadManifest.ts` points the viewer and tests at the current hashed file. Vite should serve that file as a public asset instead of bundling chapter JSON into the main JavaScript chunk. The URL changes when chapter content changes, so browser/CDN caches can keep long-lived copies without serving stale chapter content after a deploy. A single chapter payload under 2 MB is acceptable.

Chapter IDs and labels live in `app/src/app_x/chapterManifest.json`. The payload builder and viewer both use that manifest, so update it when adding or renaming chapters.

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
- `panel`: visibly boxed or callout content, such as a summary panel.
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

When correcting a bad FEN, always re-extract it from the rendered PDF diagram first. Do not infer a replacement FEN only by reverse-engineering the following move text. The move text is a QA check: after extracting the diagram, verify that the nearby printed line is legal from the extracted FEN. If the diagram and printed line still conflict, document the ambiguity with a `note` section or a nearby comment in the extraction work, rather than silently inventing a position.

If a chapter has normalized text but an unverified diagram, keep the printed label as a `caption` such as `"Position 10.2"` or `"Analysis diagram 10.7"` instead of creating a `position` section. Promote it to `position` only after the FEN has been extracted from the rendered diagram or another verified source.

For chapters 10-13, run `python3 scripts/normalize_chapters_10_13.py` after changing the raw OCR-backed text or the normalization rules.

For chapters 1, 3, and 4, run:

```bash
python3 scripts/extract_chapters_3_4.py
```

Those early chapters do not expose inline `Ending N` headings in the body text, so the extractor inserts `ending` sections from the PDF table of contents at the matching printed position boundaries. Diagram labels remain `caption` sections until their FENs are verified from the rendered diagrams.

For diagram extraction from rendered PDF images, run:

```bash
python3 scripts/promote_extracted_diagrams.py
```

That script trains on verified chapter 5-9 diagrams, crops diagrams by their printed board border, and promotes only simple, legal-looking captions to `position` sections. Early chapters and marker-heavy diagrams use documented, rendered-PDF-verified FEN overrides in the promoter. Captions with printed markers, ambiguous template matches, missing kings, duplicate kings, or pawns on impossible ranks must remain captions until the diagram can be represented with a verified `fen` plus explicit `markers`.

## Captions And Sources

Use `caption` for nearby diagram source text, composer names, years, and small labels that are not prose or moves. A caption may be a string or an object. Prefer a string unless structured fields are clearly helpful.

## Moves

Use `moves` for analysis lines and move sequences that would be hard to read inside a prose block. Keep the text human-readable and repair only obvious OCR spacing problems.

Clickable move playback is for moves actually played in the main line or an explicit variation. Do not treat threat notes or prose square references as required clickable moves unless the text presents them as a playable variation.

Examples:

- `1.Bh4+? ... 2.Kc7 Ne4 (threatening 3...Ng3) 3.Be1` means `3...Ng3` is explanatory threat text, not a played move.
- `when the white bishop goes to e7` is prose, not SAN.

If a threat or prose reference is important enough to become playable, represent the missing line as an explicit variation in the chapter text instead of relying on the parser to infer it.

The no-leftovers SAN scanner reports only actionable leftovers: residual SAN-looking text that can legally play from the immediately previous rendered move state. OCR fragments, prose threats, and branch references without a reconstructable preceding state should be filtered with reusable rules rather than one-off ignores.

## Panels

Use `panel` for visibly boxed or callout content in the PDF. Keep panel content in reading order where the panel appears.

Example:

```json
{
  "type": "panel",
  "content": {
    "title": "Summary of interesting ideas",
    "text": "1) Pushing the defending king from the rear does not work..."
  }
}
```

The `title` is the printed panel heading without trailing punctuation such as a colon. The `text` is the full panel body. Do not summarize or flatten panel content into ordinary prose.

## QA

Use OCR text as a draft, not as the final authority. Check rendered page images for:

- chapter boundaries;
- ending labels;
- position numbers;
- diagram pieces;
- diagram markers;
- captions and source notes;
- panels and callouts;
- chess notation;
- missing paragraphs.

Before finishing, validate that the JSON parses, every section has `type` and `content`, every ending has `number` and `text`, every panel has `title` and `text`, every position has `number` and `fen`, every marker has `square`, `symbol`, and `meaning`, and no `TODO` or `TBD` strings remain.
