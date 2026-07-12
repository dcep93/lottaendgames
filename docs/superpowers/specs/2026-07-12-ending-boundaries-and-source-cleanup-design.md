# Ending Boundaries And Source Cleanup Design

## Goal

Make the structured representation of all 100 endings preserve the PDF's
reading order, use one ordinary prose section type, and contain clean English
without extraction artifacts. The runtime must use that structure directly so
standalone introductions remain full-width and board-specific content remains
beside its board.

## Ending Boundaries

Every `ending` section is a hard boundary that closes the preceding position
group. Verify all 100 ending boundaries against the PDF's selectable text and
layout order.

When an ending banner is followed by a standalone heading and introduction
before the next diagram, preserve this sequence:

1. `ending`
2. `heading`
3. one or more standalone prose sections
4. `position`

The heading and introduction render full-width because position grouping does
not begin until the `position` section. Headings that genuinely describe an
adjacent board remain in that board's content group.

The chapter 1 correction must specifically produce `Ending 2`, `Opposition`,
its introductory prose, and then position 1.4. Neither the heading nor the
introduction may belong to position 1.3 or position 1.4's side-by-side group.

## One Prose Type

Convert every `moves` section in chapters 1 and 3 through 13 to `text`. Preserve
the distinct `panel`, `heading`, `ending`, `position`, and `title` types.

Move parsing, SAN clickability, branch reconstruction, navigation, and audits
must derive from textual content and position context rather than a `moves`
section hint. The source JSON and generated runtime payload must contain no
`moves` sections.

## English Review

Read every section in every represented chapter. Compare the structured text
with the PDF's embedded selectable text and surrounding page context. Do not
use OCR when the embedded text resolves the wording.

Correct:

- words split or joined by extraction;
- incorrect letters, punctuation, apostrophes, and capitalization;
- stray page headers, page numbers, or unrelated chapter text;
- text assigned to the wrong heading, ending, position, or chapter;
- notation spacing only where needed to preserve readable, playable chess text.

Record reproducible corrections in the source repair pipeline. Regenerate the
chapter JSON and hashed runtime payload after repairs.

## Audits

Expand structural checks to:

- enumerate exactly 100 endings;
- verify source-backed post-ending heading and introduction placements;
- verify runtime grouping does not attach standalone introductions to adjacent
  boards;
- reject all remaining `moves` sections in source and runtime data;
- retain zero strict SAN misses and all existing position, panel, subtitle, and
  marker guarantees.

Run unit tests, presentation tests, content and structural audits, strict SAN
audits, lint, and the production build. Do not perform a visual end-to-end pass,
consistent with `AGENTS.md`.

## Scope

This pass covers the 100-endgames material represented by chapters 1 and 3
through 13. Differently styled material outside those chapters remains out of
scope.
