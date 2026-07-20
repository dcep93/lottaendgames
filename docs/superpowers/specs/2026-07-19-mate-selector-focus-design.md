# Mate selector focus release

## Goal

Keep Mate keyboard shortcuts available after a pointer click on a material or mode selector.

## Cause

The material and mode selectors are links outside the workspace click handler that releases button focus. A clicked selector link therefore remains focused, and the shortcut handler correctly ignores key events from focused links.

## Design

- After an unmodified primary pointer click is accepted for in-app Mate navigation, blur that selector link before navigating.
- Do not blur keyboard-activated links, represented by a click with `detail === 0`; keyboard users retain normal link focus.
- Do not alter modified or non-primary clicks, which keep native link behavior.
- Apply the behavior in the shared material/mode navigation handler so every Mate selector receives the same fix.
- Keep the shortcut exclusion for links unchanged.

## Verification

- Component tests verify pointer activation blurs the selector and navigates.
- Component tests verify keyboard activation navigates without blurring.
- Existing modified/non-primary click tests continue to pass.
- Browser verification confirms the active element is no longer the Rook link after a pointer click and an arrow shortcut executes.
