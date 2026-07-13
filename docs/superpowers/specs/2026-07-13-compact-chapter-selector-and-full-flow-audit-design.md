# Compact Chapter Selector and Full Flow Audit Design

## Goal

Replace the oversized top chapter contents with a compact, professional chapter
selector and perform a complete manual PDF-to-app fidelity audit. The audit will
read the source PDF in order and follow the corresponding local application flow,
repairing every confirmed discrepancy through targeted source edits.

## Chapter Selector

The top chapter navigation becomes a styled native `select` control. Its options
show both chapter number and name, for example `Chapter 1 - Basic endings`. The
currently selected chapter remains visible in the closed control, and changing
the option immediately loads the chosen chapter through the existing chapter
selection handler.

The control will use the existing brown, pink, and warm neutral palette. It will
have a concise label, a clear keyboard focus state, and a familiar dropdown
chevron. The native select remains responsible for keyboard, screen-reader, and
mobile picker behavior. Styling will not replace those native interactions with
a custom popover.

The bottom chapter selector remains the existing compact number-only button
group. It stays hidden while chapter data is unavailable and does not repeat the
chapter names.

## Manual Audit Method

The audit will proceed chapter by chapter and page by page through the complete
`100 Endgames You Must Know` PDF. For each source passage, the corresponding
local app flow will be inspected before moving forward. This is an explicitly
requested full visual and textual audit, so it is permitted despite the normal
project preference for focused visual checks.

Each comparison will cover:

- every word of English prose and every printed move sequence;
- chapter titles, section headings, ending labels, standalone headings, and
  their order;
- printed boxes and callouts, which must render as panels rather than ordinary
  prose;
- position numbers, subtitles, captions, board diagrams, side to move, pieces,
  and non-FEN markers;
- which content belongs to a board and which content must remain standalone;
- page and section transitions, including content that starts before or
  continues after a diagram;
- test problem and solution pairing in Chapters 2 and 14;
- actual played and variation moves, which must remain clickable and legal;
- threat descriptions and prose destinations, which remain non-clickable under
  the documented move-linking policy.

The comparison will use rendered PDF pages for layout and diagram fidelity. PDF
text extraction may help locate a page but will not be treated as authoritative
for reading order, boxes, chess symbols, or piece identity.

## Source Editing Policy

The chapter JSON files are maintained through manual, localized edits only. No
PDF extraction or normalization script may rewrite a source chapter during this
work. The PDF is the authority used to identify and confirm each correction.

After source fixes are complete, the existing payload builder may compile the
source JSON into the denormalized content-hashed source and runtime payloads.
This derived build is required for the app but does not alter the manually
maintained chapter JSON.

All existing uncommitted work will be preserved. Corrections will be made on top
of the current working tree without reverting unrelated changes.

## Component Boundaries

- `ChapterSelector` will retain the compact bottom-button presentation and gain
  a dedicated native-select presentation for the top navigation.
- The chapter manifest remains the single source for chapter number and name.
- Existing chapter loading, caching, playback, active-board state, keyboard
  navigation, and Lichess link generation remain unchanged.
- Audit corrections stay in the relevant chapter JSON and structural ledger;
  no new generalized extraction system will be introduced.

## Error Handling

The selector will preserve the current chapter if an invalid value is received,
although all rendered options come from the trusted manifest. Existing chapter
load errors continue to use the current alert surface. The bottom selector is
not rendered until chapter data is available.

During the audit, uncertain source readings will be resolved against the
rendered PDF diagram or text before a source edit is made. Ambiguity will not be
hidden with a SAN-ignore entry or speculative FEN patch.

## Verification

The selector tests will require:

- one top native select containing all fourteen chapter names in manifest order;
- the active chapter represented by the selected option;
- chapter changes routed through the existing selection callback;
- the compact bottom button selector remaining name-free;
- no duplicated top table of contents.

After the full audit and manual repairs, verification will include:

- valid JSON for every chapter and structural ledger;
- structural, source-text, content, presentation, and playback tests;
- zero strict SAN misses and zero advisory misses across all chapters;
- every generated Lichess line replaying successfully;
- lint and production build;
- responsive inspection of the selector and representative normal/test study
  layouts;
- a complete final PDF-to-app flow pass confirming that corrected ordering,
  panel treatment, diagram association, and chapter transitions match.

Temporary PDF renders will stay under `tmp/pdfs` and will be removed when the
audit is complete.
