# Numbered book reference links

## Goal

Turn explicit numbered references in the curated book prose into ordinary deep
links. The first pass covers references such as `Ending 56`, `Endings 34 and
35`, `Position 10.2`, and `diagrams 13.1 and 13.3`. It leaves relative wording
such as “the previous ending,” “the next position,” and source-page references
unchanged.

The current source audit finds 96 explicit target mentions in 77 reference
phrases: 63 ending targets and 33 board targets. Every target resolves in the
current `book.json`; positions 13.1–13.3 are structured `diagram` sections and
use the same board-anchor namespace as ordinary positions.

## Approved approach

Parse references at render time with a small, dedicated book-reference module.
The chapter payload already contains every chapter and target needed to build a
global reference index, and reference matching is inexpensive compared with
chess playback parsing. This avoids changing the curated source format or the
derived runtime-payload schema.

The rejected alternatives are:

- precomputing reference tokens in the derived runtime payload, which would add
  schema and cache-building work without a meaningful performance benefit;
- manually annotating all affected prose in `book.json`, which would make the
  source harder to curate and require repeated editorial maintenance.

## Reference index and parser

Add a focused module that:

1. Scans the loaded chapter definitions once and indexes all ending, position,
   diagram, and problem destinations.
2. Maps endings to `bookEndingAnchorId(number)` and boards to
   `bookPositionAnchorId(number)` in their owning chapter route.
3. Scans rendered authored text only for explicit, case-insensitive labels:
   `Ending`, `Endings`, `Position`, `Positions`, `Diagram`, and `Diagrams`,
   followed by their supported number or list syntax.
4. Preserves the source text exactly while emitting text and reference tokens.

Every printed target number becomes its own link. Thus `Endings 34 and 35`
links both `34` and `35`; in a printed range such as `positions 13.1-13.3`, the
two printed endpoints link independently while the punctuation remains plain
text. Range validation also confirms that intermediate numbered targets exist.

Matching is keyword-anchored so chess move numbers, years, percentages, and
other prose numbers are not promoted accidentally. A reference to the board or
ending that owns the current prose remains plain text instead of becoming a
self-link.

The parser returns unresolved-reference information for validation. Production
rendering leaves an unresolved target as unchanged text; automated source
audits must fail if the curated book contains one.

## Rendering and navigation

Build the global destination index from the loaded runtime chapter payload and
derive the current board/ending context for each section. Pass those inputs to
the existing prose, panel, and problem-solution rendering paths.

Reference rendering composes with move playback instead of replacing it:

- plain prose is tokenized directly;
- for playable prose and panels, only existing playback `text` tokens are
  subdivided into text/reference tokens;
- existing move tokens remain buttons with unchanged behavior and identity;
- paragraph boundaries and all visible source wording remain unchanged.

Each generated anchor has a canonical `bookPathForChapterId(...)#anchor`
destination. An unmodified primary click uses the existing client-side book
navigation callback, preserving history and the reader’s hash-scroll behavior.
Modified clicks, context-menu actions, and opening in a new tab retain normal
browser anchor behavior.

Same-chapter and cross-chapter references use the same component and URL form.
Back navigation returns to the source chapter because link activation pushes a
normal application history entry.

## Presentation and accessibility

Reference links are subtle inline links within the current night/brown/pink
reader palette. They must be distinguishable without relying on color alone,
use a restrained underline treatment, and expose a clearly visible keyboard
focus state. They must not resemble clickable SAN move buttons or alter line
height and paragraph flow.

Anchors retain their source number as their accessible name. Optional `title`
text may identify the destination as an ending or position, but no custom ARIA
role or keyboard handler is needed because the element remains a native link.

## Verification

Add focused unit coverage for:

- singular and plural ending references;
- position and diagram aliases targeting the board namespace;
- comma, `and`, `or`, and printed-range syntax;
- source-text preservation and keyword anchoring;
- current-target self-reference suppression;
- unresolved-target reporting and full-book zero-unresolved validation;
- same-chapter and cross-chapter href construction.

Extend presentation coverage for plain prose, panel prose, problem solutions,
and prose containing existing move buttons. Verify that each reference link and
move button retains the correct destination or action, and that modifier clicks
are not intercepted.

Run the repository’s required content gates because the work touches book
rendering and playback composition: rebuild the derived payload only if a
source or playback file ultimately changes, then run `npm test`,
`npm run test:content`, `npm run test:audit-san`, and
`npm run test:audit-san:advisory -- --all` from `app/`. Also run lint, the
production build, and `git diff --check`. A narrow browser check should confirm
one same-chapter link, one cross-chapter link, back navigation, focus styling,
and coexistence with a clickable move token.

## Scope constraints

- Do not change `book.json` wording, structure, diagrams, FENs, or numbering.
- Do not link relative references or page language in this pass.
- Do not convert generic chess terminology such as “the Lucena Position” into
  a link unless it includes an explicit numbered reference.
- Do not change board playback, chapter selection, destination anchor IDs, or
  route syntax.
- Do not introduce a new runtime-payload schema or manually authored link
  markup.
