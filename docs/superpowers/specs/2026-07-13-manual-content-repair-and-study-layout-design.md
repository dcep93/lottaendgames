# Manual Content Repair and Study Layout Design

## Goal

Finish the confirmed PDF-fidelity repairs without running another PDF-to-JSON
regeneration, improve chapter discovery, and replace the board/text column layout
with a consistent two-row study layout.

## Source Policy

The existing `app/src/app_x/pdf/chapter_*.json` files are now maintained by
targeted manual edits. The PDF remains the reference for exact wording, order,
headings, captions, and boxed material, but no extraction script may rewrite a
chapter JSON file as part of this work.

After manual source edits, the existing runtime build may compile the chapter
JSON into the denormalized, content-hashed generated payload. This compilation
does not alter the source chapter files and is not PDF regeneration.

## Content Repairs

The implementation will manually restore the confirmed missing material:

- Chapter 7: omitted prose and variations around Positions 7.4 and 7.6.
- Chapter 8: the introduction to Position 8.5 and the recommended exercise
  introducing the knight-blockade diagram series.
- Chapter 9: omitted explanatory paragraphs, variations, exercises, headings,
  and the final summary, preserving their PDF order.
- Chapter 12: verify and correct the questionable passage around printed page
  192 directly against the PDF.

Printed conclusion, rule, and summary boxes will be represented as `panel`
sections wherever they were flattened into ordinary prose. The manual panel
review includes the known underclassification in Chapters 1, 3, 4, and 10-13
and checks the remaining chapters for the same established pattern.

The existing move-linking policy remains unchanged. Played moves and legal
variation moves are clickable. Prose descriptions of threats or hypothetical
piece destinations are not made clickable merely because they resemble SAN.

## Chapter Navigation

`chapterManifest.json` will store both the chapter number label and the chapter
name. This metadata is available before the runtime chapter payload finishes
loading.

The top navigation becomes a table of contents with one chapter per row. Each
row displays the chapter number and chapter name and uses the existing active
chapter treatment. The whole row is the chapter-selection control.

The bottom navigation remains a compact chapter-number selector and does not
repeat chapter names. It remains absent while chapter data is unavailable.

## Position Study Layout

Normal positions and test problems use the same two-row study frame:

1. The first row places the board on the left and the position number, subtitle,
   caption, and other position metadata on the right.
2. The second row spans the full study width and contains the associated prose
   or revealed test solution.

The complete frame is capped at `100svh`. The first row takes its natural
height; the second row receives the remaining available height and scrolls
independently. This keeps the board visible while the reader moves through all
content associated with that position.

Board-only positions omit the empty second row. An unrevealed test solution
shows only its compact toggle area. Once revealed, the solution occupies the
same scrollable second row used by ordinary position prose.

The layout applies at both desktop and phone widths. The board remains large
enough to inspect on mobile, while the position metadata wraps beside it rather
than forcing horizontal page overflow.

## Component Boundaries

- `ChapterSelector` is split or parameterized into an explicit top contents
  presentation and compact bottom presentation.
- `PositionStudyGroup` and `ProblemStudyGroup` retain the existing data and
  playback responsibilities but share the two-row structural contract.
- `PositionCard` continues to own board rendering, Lichess URLs, active-board
  state, and position reset behavior. Its internal layout becomes horizontal
  within the first study row.
- No changes are made to move parsing, branch selection, active-board keyboard
  navigation, or Lichess PGN construction unless required to preserve current
  behavior under the new markup.

## Verification

Tests will require:

- all fourteen chapter names in the top contents, in source order, one row per
  chapter;
- a compact number-only bottom selector;
- the two-row structure for ordinary positions and revealed test solutions;
- independent text scrolling, a one-viewport study-height cap, and no
  horizontal overflow at representative desktop and phone widths;
- explicit presence and `panel` classification for each restored passage;
- zero strict SAN audit misses across all chapters;
- passing unit, content, structural, presentation, lint, and production-build
  checks.

Responsive browser checks will be focused on the affected navigation and study
layouts. Per `AGENTS.md`, this work does not include a full visual end-to-end
pass.
