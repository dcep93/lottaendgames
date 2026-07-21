# Mate Guide Legend Layout

## Goal

Give every mate priority-guide modal a distinct Legend section for the move-log explanations, and place the shortcuts and legend after the mate-specific notes.

## Shared Structure

All mate variants continue to use `MatePriorityGuideDialog`. Its content order becomes:

1. White best moves and Black resistance;
2. Notes, containing only the active rule set's notes and note-board diagrams; and
3. a shared footer containing Keyboard Shortcuts and Legend.

The Legend contains these two explanations in order:

- `Correctness: 👍 means White chose a best move; 👎 means White did not. /N is the number of best White moves.`
- `Black replies: X / Y means X best-resistance replies out of Y legal replies.`

## Layout

On wider screens, the footer is a two-column grid with Keyboard Shortcuts on the left and Legend on the right. On narrow screens, it becomes one column with Keyboard Shortcuts above Legend. Both sections retain the existing modal section treatment.

## Scope

This change only reorganizes explanatory content in the shared modal. It does not change rule priorities, mate-specific notes, diagrams, keyboard behavior, move-log calculations, or dialog accessibility behavior.

## Verification

Presentation tests will verify that every rule set receives the shared structure, the two legend lines appear under the Legend heading rather than Notes, Notes precedes the footer, Keyboard Shortcuts precedes Legend, and the footer changes from two columns to one at the narrow-screen breakpoint.
