# Remove Mate Starting Position Design

## Goal

Remove the entire Starting position section from the Mate training-info modal.

## Scope

The modal will no longer render the Starting position heading, FEN, Copy game URL button, or copy-status notification. The now-unused modal and log props, workspace copy state, callback, request invalidation, and modal-copy tests will be removed rather than retained as dead code.

Keyboard shortcuts will occupy the full available row so removing the adjacent section does not leave an empty half-column. CSS used only by the starting-position FEN and copy row/status will also be removed.

Terminal result sharing, the terminal share notification, and live-FEN URL synchronization are outside this change and remain intact.

## Verification

Presentation tests will assert that the modal still contains Keyboard shortcuts and Notes while omitting Starting position, the FEN, Copy game URL, and its status region. Workspace sharing tests will continue to cover the unaffected terminal share flow. Run the focused presentation suite, the full repository suite, lint, and the production build.
