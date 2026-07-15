# Reader Front Matter and Board Controls Design

## Goal

Make the Book module open on intentional digital front matter that credits the
book and explains the project, gives readers a linkable contents view, and
discloses the known source inconsistency. Improve position interaction with
explicit playback controls, a dedicated Lichess action, fullscreen boards,
coordinates, and PDF-matched orientation.

This change does not address the audit items P1.1, P1.2, P1.7, P1.8, or P1.9.

## Routes and Book Navigation

Add a Book-only front-matter destination:

- `/book/about` renders the new first section.
- `/` and `/book` canonicalize to `/book/about` with `replaceState`.
- Unknown routes continue to canonicalize to the Book landing destination.
- `/book/intro`, Chapters 1-15, and `/book/bibliography` retain their current
  URLs and behavior.
- The global Book module link points to `/book/about`.

The chapter selector prepends a synthetic `About this edition` destination
before `Introduction`. This entry is navigation metadata, not a part added to
the curated book source.

The front matter contains a table of contents generated from the loaded runtime
book data. It links to:

- the Introduction;
- Chapters 1-15;
- all 100 numbered endings nested under their chapters;
- the Basic Test, Final Test, Appendix, and Bibliography.

Chapter and part links use their existing real routes. Ending links use the
existing `#e<number>` anchors, such as `/book/chapter1#e1`. Normal modified-link
behavior remains available, while ordinary clicks use the app's History API
navigation.

## Component Boundary

Add a focused `BookFrontMatter` component inside `app/src/app_x`. It owns only
project/editorial content and receives the runtime chapters needed to build the
contents.

`ChapterViewer` continues to fetch the single runtime payload. When the active
Book destination is `about`, it renders `BookFrontMatter`; otherwise it renders
the existing source chapter. Project commentary must not be inserted into
`book.json`, because that file remains the curated source of the authored book.

## Front-Matter Presentation

Use the approved editorial, single-column presentation. The order is:

1. Book identity
2. Project purpose and study advice
3. Features
4. Edition deviations
5. Thanks and contact
6. Linkable table of contents

The design should feel like intentional digital front matter rather than an app
dashboard. It uses the existing Lotta Endgames visual tokens and typography;
this work does not implement audit item P1.8.

### Book identity and copyright

Display:

- *100 Endgames You Must Know*
- Jesús de la Villa
- New In Chess, 2008
- ISBN-13: 978-90-5691-244-4
- `© 2008 New In Chess`
- `Published by New In Chess, Alkmaar, The Netherlands`
- `www.newinchess.com`
- `All photos: New In Chess Archives`

The edition's rights-reservation paragraph is intentionally not displayed, per
the later approved About-page rights-notice design. The copyright, publisher
link, and photo credit remain visible.

The front matter describes Lotta Endgames as an unofficial interactive
companion; it must not imply endorsement or permission from the author or
publisher.

### Project-purpose copy

Use this meaning and tone:

> Lotta Endgames is an unofficial interactive companion to Jesús de la Villa's
> *100 Endgames You Must Know*.

> It is probably better to study the book in its original form. Following the
> notation, visualizing the moves, and moving between text and diagrams takes
> more work, and that extra effort can lead to stronger retention.

> For lazier readers - or anyone who does not want to keep flipping between
> pages or visualizing every move from notation alone - this app offers a
> lower-friction way to follow the same material with synchronized boards and
> direct navigation.

Use ASCII hyphens in source text, consistent with the PDF skill requirements.

### Feature list

List the reader's actual features:

- clickable move notation with synchronized boards;
- Previous, Next, and Reset controls;
- Left/Right Arrow keyboard navigation;
- visible coordinates and PDF-matched board orientation;
- click-to-fullscreen boards;
- Lichess analysis/editor links;
- direct chapter, ending, and position links;
- revealable test solutions;
- a linkable table of contents.

### Edition deviation

Explain the known Final Test 14.29 inconsistency only on the front matter, per
the approved choice. Do not add inline erratum badges inside the chapters. The
printed prompt says `Black to move. Can he draw?`, but the solution analyzes
White's 69th move. The app uses `White to move` and a White-to-move FEN.

The existing corrected chapter content remains unchanged.

### Thanks and contact

Thank Jesús de la Villa directly for creating the book and for making essential
endgame knowledge approachable. Invite concerns, corrections, rights questions,
or removal requests at a `mailto:dcep93@gmail.com` link.

## Chapter Summary Metadata

Remove `sectionCount` from `ReaderMeta`. The UI must never display `X sections`.

For a chapter with numbered endings, derive the first and last ending numbers
from its source sections and display:

- `Endings X-Y`
- `Z boards`

For a part with boards but no numbered endings, display only `Z boards`. If a
part has neither, render no empty summary container. The ending range reflects
the actual source entries rather than assuming chapter numbering.

## Position Control Row

Add a focused `PositionControls` component above the position/problem label in
each position card.

For a playable position, show:

- Lichess
- Previous as an arrow-only control (`←`)
- Reset
- Next as an arrow-only control (`→`)

The arrow-only controls retain descriptive Previous/Next labels for assistive
technology and tooltips.

Previous and Next use the existing branch-aware navigation graph and the same
preferred-continuation behavior as keyboard navigation. Previous is disabled at
the initial position. Next is disabled at the selected line's leaf. Reset returns
to the source starting FEN, clears the selected continuation for that board, and
keeps the existing position anchor behavior.

For a board without playback, omit Previous, Next, and Reset; show only the
applicable Lichess/editor action. Instructional diagrams use a Lichess editor
link constructed from their displayed FEN.

For a test problem whose solution is hidden, the controls and Lichess URL expose
only the problem's starting position. Revealing the solution enables its
playback controls and complete selected-line Lichess URL. Hiding the solution
restores the starting-position-only state.

The Lichess action is a normal external link with new-tab behavior. The current
line-selection and URL-length safeguards remain unchanged.

## Board Expansion Behavior

The chessboard is no longer wrapped in a Lichess link. Render it as a dedicated
button-like expansion toggle:

- clicking the board expands its wrapper over the application viewport;
- clicking the expanded board restores its normal card layout;
- Escape also restores an expanded board;
- the expanded wrapper styling centers the board and sizes it to the
  available viewport without distorting its square aspect ratio;
- coordinates, markers, current FEN, and move animation remain visible;
- a pointer cursor, title, and control label communicate the expansion action.

The implementation does not use the browser Fullscreen API. While a board is
expanded, background scrolling is locked and the browser chrome remains visible.

## Coordinates and PDF Orientation

Enable chessboard notation on every rendered board.

The printed PDF diagrams use White at the bottom, including Black-to-move test
positions. Encode this source fact explicitly rather than deriving orientation
from the FEN side-to-move field.

Add required `orientation: "white"` metadata to every existing `position`,
`problem`, and `diagram` content object in `book.json`. Patch the 333 existing
objects in place; do not recreate, normalize, or reserialize the source file.
The diff must consist only of the added orientation fields plus separately
approved edits.

Extend the section types and source validator to require `white` or `black`.
Pass the value through the runtime payload and through `PositionCard`,
`ProblemStudyGroup`, and `InstructionalDiagram` into `ChessBoard`. The renderer
must use the source value rather than a hard-coded orientation.

After the narrow source patch, rebuild the derived cache-busted runtime payload
and manifest using the repository's supported builder. Rebuilding this derived
artifact is not regeneration of `book.json`.

## Error Handling

- A front-matter payload failure uses the existing visible payload error state.
- An empty or malformed chapter list must not crash the contents; validation
  remains authoritative.
- Invalid Book paths resolve to `/book/about`.
- Fullscreen rejection leaves the board usable in place.
- Unavailable or oversized Lichess URLs omit the external action rather than
  opening an incomplete line.

## Verification

Add or update focused tests for:

- `/` and `/book` canonicalizing to `/book/about`;
- `/book/about` route formatting and the Book module link;
- the synthetic first selector entry;
- front-matter identity, purpose, deviations, thanks/contact, and copyright;
- all chapter and ending contents links;
- `Endings X-Y` plus board counts and the complete absence of section counts;
- Lichess, arrow-only Previous, Reset, and arrow-only Next markup in that order;
- disabled navigation states and branch-aware button navigation;
- hidden/revealed test-solution control behavior;
- board expansion and Escape-restoration behavior where testable without
  coupling to a specific browser implementation;
- visible coordinates and source-driven orientation;
- validation that all 333 source board objects contain a valid orientation.

Run:

- `python3 scripts/build_chapter_payload.py`
- `npm test`
- `npm run test:content`
- `npm run test:audit-san`
- `npm run test:audit-san:advisory -- --all`
- `npm run lint`
- `npm run build`

Complete a live browser pass for `/book/about`, representative playable and
static positions, hidden and revealed problems, Lichess actions, fullscreen
entry/exit, coordinates, direct contents links, browser back/forward, desktop,
and a narrow mobile viewport. Confirm the browser console has no warnings or
errors.

## Out of Scope

Do not change:

- P1.1 nested analysis scrolling;
- P1.2 responsive board sizing;
- P1.7 screen-reader position descriptions;
- P1.8 typography or overall visual direction;
- P1.9 payload splitting or lazy rendering;
- the printed Chapter 13 text and corrected Final Test 14.29 prompt;
- the visible Mate module or any other audit item not requested in this change.
