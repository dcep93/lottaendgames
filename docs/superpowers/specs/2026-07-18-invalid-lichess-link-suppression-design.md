# Invalid Lichess link suppression

## Goal

Do not offer Lichess links for instructional schematics or for any board state
that cannot be loaded as a legal FEN by the app's chess engine. Preserve Lichess
links for genuine legal positions, playable problems, and revealed legal
solutions.

## Confirmed behavior boundary

- Every `diagram` section is an instructional or schematic object rather than a
  playable chess position. It must render without a Lichess link or an otherwise
  empty position-control row, even when its placement happens to contain both
  kings.
- `position` and `problem` sections retain their current Lichess behavior only
  when the exported FEN is accepted by `chess.js`.
- Problem 14.13 has an intentionally incomplete hidden starting diagram and a
  legal `solutionFen`. It must have no Lichess link while hidden and regain its
  Lichess/playback controls after the legal solution is revealed.
- Existing move playback, Previous/Reset/Next controls, board expansion, and
  Lichess analysis links for legal positions remain unchanged.

## Architecture and data flow

Two narrow guards enforce the rule at the correct boundaries:

1. `InstructionalDiagram` passes no Lichess URL to `PositionControls`. This
   enforces the repository's existing type contract that diagrams are
   non-playable schematics.
2. `buildLichessEditorUrl` normalizes the supplied FEN and attempts to load it
   with `chess.js` before constructing a URL. It returns `null` on missing kings,
   malformed fields, or any other FEN rejection. This protects all editor-link
   callers, including the fallback used when a problem has no analysis line.

`PositionControls` already returns `null` when there is neither playback nor a
Lichess URL, so it needs no behavioral change. No new data flag or per-diagram
allowlist is introduced.

## Error handling

Invalid FEN is expected for schematic diagrams and for a small number of hidden
problem states. URL generation fails closed by returning `null`; the UI shows no
error message and simply omits the external-link control. Unexpected exceptions
from FEN loading follow the same fail-closed path.

## Regression coverage

- `lichess.test.ts`
  - keeps a legal two-king editor URL case;
  - rejects empty, missing-white-king, missing-black-king, and malformed FENs.
- `viewerPresentation.test.tsx`
  - proves an instructional diagram has no Lichess link or control row;
  - proves even a syntactically legal instructional diagram remains unlinked;
  - proves Problem 14.13's hidden invalid state has no Lichess link and its
    revealed legal solution restores the link and playback controls.
- Existing generated-link, source-fidelity, content, lint, and build gates must
  remain green.
- Targeted desktop and mobile browser checks verify the reported rook-mobility
  surface, a second schematic, Problem 14.13 hidden/revealed behavior, and a
  normal legal position that must retain its link. Browser console output and
  horizontal overflow must remain clean.

## Audit reconciliation

The completed release audit currently claims that all objective link behavior is
clean, so this newly observed defect must be recorded rather than silently
patched:

- add one app-defect finding covering all 12 `diagram` units plus the invalid
  hidden state of Problem 14.13;
- add the finding to already-app-defect diagram units and reclassify the five
  currently matched affected units as repaired app defects;
- regenerate the fidelity ledger;
- update the release report's unit/finding totals, command results, objective
  findings, changed-file list, and final diff statement after verification.

The source book data and generated chapter runtime do not change.

## Alternatives rejected

- **Diagram-only suppression:** fixes the screenshot but leaves invalid editor
  fallbacks such as hidden Problem 14.13 linkable.
- **FEN validation only:** removes invalid links but retains a link on the one
  diagram whose placement happens to be legal, contradicting the established
  `diagram` contract.
- **Per-diagram metadata flag:** duplicates information already expressed by the
  section type and creates avoidable curation drift.

## Constraints

- Preserve the user's current working tree and unrelated audit repairs.
- Do not commit or push.
- Do not regenerate curated book data or the chapter runtime for a presentation-
  only control change.
