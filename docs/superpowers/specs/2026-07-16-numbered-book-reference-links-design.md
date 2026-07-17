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

Parse and validate references at build time. The chapter-payload builder first
constructs a global destination index from every source chapter, then emits
precomputed reference spans alongside each runtime chapter. Browsers apply
those spans while rendering but do not scan prose or decide whether a phrase is
a reference.

This keeps recognition deterministic, makes unresolved references a payload
build failure, and follows the project’s existing pattern of moving authored
content analysis out of the browser. The runtime payload schema advances from
version 2 to version 3 and remains cache-busted by its content hash.

The rejected alternatives are:

- parsing references at render time, which would make each browser repeat
  content recognition and defer broken-reference detection until runtime;
- manually annotating all affected prose in `book.json`, which would make the
  source harder to curate and require repeated editorial maintenance.

## Reference index and parser

Add a focused build-time module that:

1. Scans all validated source chapter definitions once and indexes all ending,
   position, diagram, and problem destinations.
2. Maps endings to `bookEndingAnchorId(number)` and boards to
   `bookPositionAnchorId(number)` in their owning chapter route.
3. Scans text-section content, panel text, and problem solutions for explicit,
   case-insensitive labels:
   `Ending`, `Endings`, `Position`, `Positions`, `Diagram`, and `Diagrams`,
   followed by their supported number or list syntax.
4. Preserves the source text exactly while emitting offset-based reference
   spans for the relevant section field.

Every printed target number becomes its own link. Thus `Endings 34 and 35`
links both `34` and `35`; in a printed range such as `positions 13.1-13.3`, the
two printed endpoints link independently while the punctuation remains plain
text. Range validation also confirms that intermediate numbered targets exist.

Matching is keyword-anchored so chess move numbers, years, percentages, and
other prose numbers are not promoted accidentally. A reference to the board or
ending that owns the current prose remains plain text instead of becoming a
self-link.

Each serialized span identifies the source field, start and end offsets of the
printed target number, canonical destination href, target kind, and target
number. Offsets refer to the untouched source string and use JavaScript string
index semantics at both build and render time.

The parser returns unresolved-reference information for diagnostics, and the
payload build fails if any explicit target or any intermediate member of a
printed range is missing. No unresolved reference is serialized for production
rendering.

## Payload generation and schema

The payload script builds the global index before mapping source chapters
through `buildRuntimeChapter`. Each chapter build receives that read-only index
and serializes a `referencesBySectionIndex` collection. Entries exist only for
sections with at least one linkable reference and identify whether offsets
belong to text content, panel text, or a problem solution.

Reference data is separate from SAN playback data. It does not change
`TextPlaybackToken`, move-tree construction, playable-position detection, or
navigation. Runtime hydration converts the serialized section collection to a
map just as it already does for playback tokens.

Adding the collection advances the runtime payload schema to version 3. The
normal payload build writes a new cache-busted runtime JSON file, removes the
old generated payload, and updates `chapterPayloadManifest.ts`. No generated
reference data is written back to `book.json`.

## Rendering and navigation

The browser receives only precomputed reference spans. Pass the hydrated spans
for the current section to the existing prose, panel, and problem-solution
rendering paths.

Reference rendering applies spans and composes with move playback instead of
replacing it:

- plain prose is divided at the precomputed offsets;
- for playable prose and panels, a source-offset cursor aligns the precomputed
  spans with existing playback `text` tokens, which are then subdivided into
  text/reference output;
- existing move tokens remain buttons with unchanged behavior and identity;
- paragraph boundaries and all visible source wording remain unchanged;
- a development assertion reports a span that does not align with the expected
  source substring, while production safely leaves that substring as text.

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

Add focused build-time unit coverage for:

- singular and plural ending references;
- position and diagram aliases targeting the board namespace;
- comma, `and`, `or`, and printed-range syntax;
- source-text preservation and keyword anchoring;
- current-target self-reference suppression;
- unresolved-target build failure and full-book zero-unresolved validation;
- same-chapter and cross-chapter href construction.

Add runtime coverage showing that rendering consumes supplied spans without
performing keyword recognition, including safe behavior for a malformed or
misaligned span.

Extend presentation coverage for plain prose, panel prose, problem solutions,
and prose containing existing move buttons. Verify that each reference link and
move button retains the correct destination or action, and that modifier clicks
are not intercepted.

Run the repository’s required content gates because the work changes the
derived runtime payload and composes with playback rendering: rebuild the
derived payload with `python3 scripts/build_chapter_payload.py`, then run
`npm test`, `npm run test:content`, `npm run test:audit-san`, and
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
- Do not perform reference recognition or target lookup in the browser.
- Do not merge reference spans into SAN playback tokens.
- Do not introduce manually authored link markup.
