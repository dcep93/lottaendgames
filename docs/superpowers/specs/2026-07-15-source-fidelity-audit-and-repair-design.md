# Source-Fidelity Audit and Repair Design

## Objective

Re-audit *100 Endgames You Must Know* from the rendered PDF and repair every
omitted, corrupted, misplaced, or unsupported source element in Lotta Endgames.
The result must be safe to show the author: every displayed word, move, diagram,
caption, marker, and deliberate deviation must have explicit source evidence.

The rendered 2008 PDF is authoritative. Existing JSON, generated payloads,
parsers, tests, and extraction reports are implementation artifacts and must not
be used as proof that the PDF was reproduced correctly.

## Protected Scope

The following areas remain unchanged:

- P1.1, nested long-form reading behavior;
- P1.2, the existing mobile board/card layout;
- P1.7, screen-reader position and playback descriptions;
- P1.8, the visual language and typography;
- P1.9, payload loading and rendering performance;
- the Mate navigation entry and its Coming Soon destination;
- the About landing page, publication details, deviations summary, and linkable
  table of contents;
- the approved four-item position control row: Lichess, Previous, Reset, Next;
- in-page board expansion, including click and Escape restoration;
- visible coordinates, source-matched orientation, and dedicated Lichess links;
- omission of move-status and keyboard-hint text from the control row.

The Mate entry is an accepted product decision and is not a release blocker.

## Work Decomposition

The project proceeds as sequential, independently verifiable source releases:

1. Chapter 13 correction release.
2. Introduction and Chapters 1-4.
3. Chapters 5-9.
4. Chapters 10-12.
5. Chapters 14-15 and Bibliography.
6. Whole-book reconciliation and replacement audit report.

Each release completes the full evidence, repair, testing, and visual-review
cycle before the next release begins. A passing parser or build cannot advance a
release whose PDF comparison is incomplete.

## Source Evidence Ledger

Create a machine-readable source-fidelity ledger organized by book part and PDF
page. Each source unit receives a stable identifier and records:

- book part, ending, and position association;
- PDF page and printed page;
- source-unit type: title, heading, paragraph, panel, table, caption, diagram,
  prompt, solution, move line, or variation;
- the corresponding app section or explicit exclusion;
- comparison status and reviewer evidence;
- any deliberate deviation identifier;
- diagram-specific evidence where applicable: FEN, orientation, caption,
  markers, routes, arrows, labels, and side to move.

The ledger must contain every source unit, including material the move parser
does not recognize and schematic diagrams that do not contain both kings. No
unit may silently disappear because it does not fit the current schema.

Statuses are limited to `pending`, `matched`, `corrected`, and
`accepted-deviation`. A release gate permits no `pending` entries. A
`corrected` entry identifies both the erroneous app value and repaired value.
An `accepted-deviation` entry links to the governed errata record.

## Comparison and Repair Workflow

For every PDF page in a release:

1. Render the complete page at inspection resolution.
2. Inventory its source units in reading order.
3. Compare each unit against the existing `book.json` and rendered application.
4. Record the result in the source-fidelity ledger.
5. Patch the existing JSON and supporting schema; never regenerate `book.json`
   from scratch.
6. Rebuild the runtime payload from the patched source.
7. Run source, chess, structural, presentation, and build checks.
8. Inspect the repaired chapter in the browser beside the rendered PDF.

Text comparison preserves spelling, punctuation, numbering, proper-name
diacritics, headings, captions, and the distinction between prose and diagram
metadata. Layout may adapt to the web, but semantic order and ownership must
match the source.

## Chess Verification

Every printed move in main lines and variations is inventoried independently of
whether the current parser promotes it to a clickable token. Verification must
detect:

- missing moves and variations;
- illegal or mistyped squares;
- changed checks, mates, captures, promotions, annotations, and evaluations;
- incorrect move numbers or side to move;
- lines assigned to the wrong starting diagram;
- parser skips that current SAN statistics omit.

The PDF transcript is compared first. Engine legality is a separate second
check and cannot rewrite printed text. Where the PDF contains an apparent chess
error, the printed value remains identifiable and any corrected playback value
is represented through the errata system.

## Diagram Verification

Every printed diagram must have a corresponding rendered app diagram or an
explicit accepted exclusion. Verification covers:

- complete numbered sequences within each chapter;
- piece placement and side to move;
- source orientation;
- printed caption and game attribution;
- stars, outlined squares, labels, arrows, routes, cages, barriers, and other
  instructional overlays.

Extend the diagram model when the book uses a visual that the current position
schema cannot represent. In particular, Chapter 13 Positions 13.1-13.3 must
support schematic piece-and-marker diagrams without inventing missing kings,
and Analysis diagram 13.5 must reproduce its knight-route overlay.

The old extraction report is reconciled against both the ledger and final
`book.json`. A report entry cannot remain clean when its FEN, markers, or
presence differs from the displayed source.

## Governed Deviations and Errata

Maintain a single structured errata register. Each record contains:

- location and edition;
- exact printed value;
- corrected value used by the app, if any;
- chess or editorial rationale;
- PDF and printed page;
- presentation status.

The front matter continues to explain all deliberate deviations. Where a
corrected move or prompt appears in the reading flow, printed text and project
commentary must remain distinguishable so that commentary is never presented
as the author's voice.

The known Chapter 13 Ending 95 and Final Test 14.29 deviations are migrated to
this register. Newly discovered apparent source errors follow the same process.

## Chapter 13 Required Repairs

The first release includes, at minimum:

- add Positions 13.1, 13.2, and 13.3 with their printed captions and markers;
- repair the corrupted Step 8 reference to Position 13.3;
- reproduce the knight route and caption ownership in Analysis diagram 13.5;
- attach the Lolli headings to Positions 13.9 and 13.10 rather than 13.8 and
  13.9;
- restore the Garcia Gonzalez - Balashov game attribution;
- restore `g8` in the Position 13.19 explanation;
- restore both `Kb8` moves in Ending 100;
- restore proper-name diacritics, including Müller;
- reconcile the stale Analysis diagram 13.20 extraction-report FEN;
- require the complete 13.1-13.30 diagram sequence and the correct board count.

This list is a minimum, not a substitute for the complete page-by-page pass.

## Automated Gates

Add or strengthen checks for:

- zero pending ledger entries in completed releases;
- one-to-one mapping between expected and displayed diagrams;
- complete numbered diagram sequences;
- equality between ledger diagram data, final source JSON, and runtime payload;
- no unresolved extraction warnings or falsely clean entries;
- all inventoried move strings accounted for, including parser skips;
- correct proper names and known source anchors;
- explicit registration of every displayed deviation;
- unchanged protected UI behavior.

Existing test, content-audit, strict/advisory SAN, lint, and production-build
commands remain required but are not sufficient by themselves.

## Visual Verification

For every completed release, inspect:

- the beginning and end of each source page transition;
- every diagram, marker, route, caption, and game attribution;
- representative main lines and nested variations after interaction;
- the linkable contents and deep links for repaired material;
- desktop and existing mobile presentation without redesigning protected areas.

The final pass compares every part from Introduction through Bibliography and
confirms that no chapter begins or ends with dropped or duplicated source text.

## Replacement Audit Report

The existing audit remains a correction-in-progress document. Replace its
coverage claims only after all releases pass their gates. The final report must
state:

- exact verified page and source-unit coverage;
- every repaired mismatch;
- every accepted deviation;
- the protected areas intentionally left unchanged;
- remaining external approvals, if any;
- commands and visual evidence used for final verification.

It must not infer fidelity from aggregate counts, a passing build, or parser
statistics.

## Completion Criteria

The work is complete only when:

- every PDF source unit has a non-pending ledger disposition;
- every unexplained app-to-PDF mismatch is repaired;
- all diagrams and instructional overlays are present and verified;
- every printed move is accounted for and every corrected playback deviation
  is governed;
- extraction provenance agrees with the final app data;
- all automated and visual gates pass;
- the replacement audit accurately distinguishes verified work, accepted
  product decisions, and any approval still required from the author or
  publisher.
