# PDF Structural Fidelity Design

## Goal

Correct structural extraction mistakes across all represented chapters of
*100 Endgames You Must Know*. Preserve printed boxes, headings, position
subtitles, captions, and diagram markers in the structured JSON and reader.

Position 1.9 is the reference failure case:

- its boxed key-square rule must be an untitled panel;
- `Knight's pawn` must introduce position 1.10;
- position 1.9 must not repeat `Position 1.9` as a subtitle;
- the e6 asterisk must remain visible above the white king.

## Source Of Truth

Use the PDF text layer and rendered PDF pages together. The text layer supplies
words, reading order, fonts, sizes, and coordinates. Vector lines identify many
printed boxes. Rendered pages resolve ambiguous geometry and diagram details.

OCR or flattened extracted text is only a draft. Do not infer source layout
from the current JSON when the PDF can answer it.

## Structural Model

### Headings

Add a `heading` section whose content is the printed heading text. Use it when a
heading introduces a topic spanning prose or multiple positions.

When a heading directly introduces one position, store it as that position's
`subtitle`. The heading belongs to the following content, never to the final
paragraph of the preceding position.

### Position Labels And Captions

The position's `number` already renders its printed `Position N` label. Remove
any `caption` or position caption whose normalized value is only the same
generic label.

Reserve `caption` for genuine contextual text such as a source, composer, date,
or other printed diagram note. A position may have both a subtitle and a real
caption when the PDF contains both.

### Panels

Every visibly boxed or callout passage in the represented chapters becomes a
`panel` section in source reading order. Panel titles are optional because some
printed boxes, including the key-square rule beside position 1.9, have no title.
Do not invent one.

Panel text must be removed from the surrounding prose or moves section so it is
represented exactly once.

### Markers

Markers remain supplements to FEN. Render the marker layer above chess pieces
and center each marker on its square. This applies when a marker and piece share
the same square, as on e6 in position 1.9.

## Corpus Audit

Build an inventory for every represented chapter containing:

- printed position labels and their neighboring typography;
- heading candidates, with font and coordinate evidence;
- vector-box regions and their enclosed text;
- current position subtitles and captions;
- markers sharing squares with pieces.

Classify each heading as a position subtitle, standalone heading, or false
positive. Classify each box as a panel or non-content decoration. Resolve
ambiguous candidates against rendered PDF pages.

Apply corrections to the per-chapter source JSON. Update extraction rules so
the structural decisions remain discoverable. Regenerate the hashed source and
runtime payloads after source corrections.

## Rendering

- Render standalone headings as visible content hierarchy within the relevant
  board's independently scrolling text column when grouped with a position.
- Render position subtitles beneath the position number without duplicating the
  number label.
- Render real captions separately from subtitles.
- Render titled and untitled panels consistently in the side-by-side content
  column.
- Keep marker overlays non-interactive and above pieces.

The changes must preserve the current mobile and desktop side-by-side reader,
move playback, keyboard navigation, and Lichess board links.

## Validation

Add structural checks that enforce:

- no position caption normalizes to its own `Position N` label;
- every heading candidate in the audit inventory has a classification;
- no classified heading remains appended to preceding prose;
- every classified panel appears once and only once in JSON;
- panel title is optional but panel text is non-empty;
- every printed position label maps exactly once;
- marker-over-piece cases remain represented in marker data;
- generated payloads match source hashes and schemas.

Run the existing content audit, strict and advisory SAN audits, move-parser
tests, exhaustive Lichess-link audit, build, and lint. Inspect ambiguous PDF
source pages as needed. Per `AGENTS.md`, do not perform a visual end-to-end pass
of the app.

## Scope

This pass covers structural fidelity for all 100 endgames in the currently
represented chapters. It does not redesign the reader or reopen already
verified chess analysis unless a structural correction exposes a concrete FEN,
marker, text, or playback defect.
