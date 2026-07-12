# Native Scroll Chaining Design

## Goal

Keep each board's adjacent text column independently scrollable while allowing
continued scrolling at either boundary to move the main page.

## Design

Remove `overscroll-behavior: contain` from `.leg-position-study-content` and
rely on the browser's default scroll chaining. The text column retains its
existing height, `overflow-y: auto`, scrollbar, and native touch behavior.

When the text column can scroll, wheel and touch input scroll it. Once it is at
its top or bottom boundary, continued input propagates to the document. Native
overscroll effects, including bounce where supported, remain browser-managed.

No JavaScript event forwarding, layout changes, or custom gesture handling are
needed.

## Verification

- Confirm the stylesheet no longer contains an overscroll containment rule for
  the position-study text column.
- Run the app's build, unit tests, and lint checks.
- Do not perform a visual end-to-end pass, per the project instructions.
