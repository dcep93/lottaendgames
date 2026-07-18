# Mate Pointer Button Focus Release

## Goal

Keep Mate keyboard shortcuts available after a user clicks a button with a
mouse, trackpad, or touch pointer. A pointer-clicked button must not retain focus
and cause the existing shortcut guard to ignore later key presses.

## Interaction

The Mate workspace handles bubbled click events after individual button actions.
For a real pointer click (`MouseEvent.detail > 0`), it finds the clicked button
from the event target and calls `blur()` once. Nested button content such as an
icon or span resolves through `closest('button')`. Missing DOM methods and
non-button targets are harmless no-ops.

Synthetic or keyboard activation (`detail === 0`) does not blur. Keyboard users
retain normal button focus, visible focus treatment, and activation semantics.
The shortcut exclusion rules remain unchanged, preventing Enter from both
activating a focused control and starting over.

When a pointer click opens the training-information dialog, `MateLog` does not
retain that button as the focus-restoration target. Closing the dialog therefore
does not refocus a pointer-clicked opener. Keyboard activation continues to
retain and restore the exact opener, preserving the existing accessible modal
flow.

## Scope

The behavior applies to buttons inside the selected Mate training workspace,
including controls, log controls, reason buttons, modal actions, and modal close.
It does not change Book controls, links, form fields, board interaction, or
shortcut mappings.

## Verification

Tests cover a direct button target, nested button content, non-button targets,
keyboard activation, malformed targets, pointer-opened dialogs not restoring
opener focus, and keyboard-opened dialogs retaining restoration. Run the focused
presentation and workspace-support suites, complete Mate tests, lint, and the
production build.
