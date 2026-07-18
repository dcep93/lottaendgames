# Mate training information in the reasons dialog

## Goal

Remove the separate `How training works` and `Position details` panels. Replace
them with one `Training info` button beside `Show reason hints` that opens the
existing Mate priority/reasons dialog with all training, position, and rule
information.

## Entry point and dialog behavior

The Mate log toolbar groups `Show reason hints` and a visible `Training info`
button together. The button uses the same dialog state, focus trap, Escape and
backdrop closing behavior, and focus restoration as every existing Reason entry
point. Table-header Reason buttons, row reasons, and current hints continue to
open the same dialog.

No second modal, nested dialog, or disclosure remains in the board column.

## Dialog content

The reasons dialog keeps its material-specific title and all existing sections
for White best moves, Black resistance, notes, and diagrams. Before those rule
sections it adds:

### How training works

- `Standard` generates a new legal starting position for the selected material.
- `Train` selects a curated position and applies a board transformation to vary
  the exercise while preserving it.
- The current mode is identified explicitly.
- White moves and Black replies automatically.
- Play Best makes one recommended White move.
- Reason hints and the priority guide explain recommendations.
- Keyboard shortcuts are listed: Enter starts over, Left Arrow undoes, Right
  Arrow redoes, and Up Arrow plays a best move.

### Starting position

- The exact starting FEN is shown in a wrapping code block.
- `Copy game URL` copies the exact material, mode, and starting-FEN route.
- In the browser the copied value is an absolute URL; server/test rendering may
  use the existing relative exact-position format.
- Success or failure uses a temporary fixed toast so dialog content and controls
  never move.

## Architecture and data flow

`MateWorkspace` remains the source of the current mode, starting FEN, exact URL,
clipboard request lifecycle, and stale-request protection. It passes the mode,
FEN, copy callback, and copy status through `MateLog` to
`MatePriorityGuideDialog`.

`MateLog` continues to own dialog open/close state and opener focus restoration.
All dialog entry points render identical full content because they share one
dialog instance.

The former training-guide component, Position details markup, and their board-
column wrapper are removed. The old Copy FEN action is replaced, not retained.

## Error handling and accessibility

- Clipboard failure shows `Copy unavailable` without closing the dialog.
- A new copy clears the prior message before resolving.
- Stale copy results cannot update a new session or exact route.
- Copy status is a polite atomic live region inside the active dialog and clears
  after two seconds.
- The starting FEN wraps within the dialog and never creates page-level overflow.
- `Training info` is a normal keyboard-focusable button next to the reason-hints
  checkbox.
- Modal focus trapping includes `Copy game URL`; closing restores focus to the
  exact button or reason that opened it.

## Regression coverage

Tests must prove:

- the two board-column disclosures and old Copy FEN control are absent;
- `Training info` is adjacent to Show reason hints and opens the existing dialog;
- every dialog entry point receives the current mode and starting FEN;
- the dialog explains both modes, identifies the current mode, lists all four
  shortcuts, shows the exact FEN, and retains all rule sections;
- Copy game URL copies the exact current route for Standard and Train;
- copy success, failure, timeout, and stale-result handling remain safe;
- focus trap and opener restoration still work with the added button;
- desktop and mobile dialog content wraps without horizontal overflow.

Verification includes focused presentation tests, the complete Mate suite,
build, lint, and desktop/mobile browser checks of the toolbar, dialog, URL copy,
focus behavior, and console output.

## Alternatives rejected

- **A separate training-info modal:** duplicates focus and dialog state and
  separates closely related rule information.
- **Keeping the disclosures and adding a modal link:** leaves redundant panels
  and does not satisfy the requested consolidation.
- **Copying only the FEN:** requires manual reconstruction and does not produce a
  link that opens the same exercise.

## Constraints

- Preserve mating rules, session behavior, route format, timer persistence,
  Share behavior, and unrelated worktree changes.
- This design supersedes the disclosure placement and Copy FEN interaction from
  the earlier Mate guidance and position-details design.
