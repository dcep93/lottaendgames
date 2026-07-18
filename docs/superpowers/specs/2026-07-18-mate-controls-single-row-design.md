# Mate controls single-row toolbar

## Goal

Place the timer and terminal sharing controls on the same desktop row as Start
Over, Undo, Redo, and Play Best. The action group stays left-aligned and the
timer/checkmate/share group aligns to the right without compromising narrow
layouts.

## Confirmed layout

`MateControls` remains one semantic control group containing two internal
groups in the existing DOM and keyboard order:

1. Start Over, Undo, Redo, and Play Best;
2. the terminal status, Share button, timer toggle, and elapsed timer.

The outer controls panel becomes a wrapping horizontal flex toolbar. On desktop
and other widths where both groups fit, they share one row. The action group is
at the left edge and the summary group uses automatic leading margin to sit at
the right edge.

The summary group loses its current top border, top padding, and separate-row
treatment. Its controls remain vertically centered and may wrap internally only
when their own content requires it.

Within the right-aligned summary group, terminal sharing precedes timer control:
the terminal label appears first, followed by Share, then the timer visibility
toggle and elapsed timer. Share feedback is a separate fixed notification and
does not participate in toolbar layout. During an active session, the absent
terminal-only controls leave the timer controls as the visible right-aligned
content.

At the existing narrow breakpoint, the action group keeps its current two-by-two
button layout. The action group occupies the full first line, while the complete
summary group wraps beneath it and remains right-aligned. The page must not gain
horizontal overflow.

## Component boundaries and behavior

This is a presentation-only change in the existing `MateControls` structure and
Mate stylesheet. No props, callbacks, state ownership, or timer logic change.

- The timer toggle retains its saved local-storage preference.
- The elapsed timer retains its formatting and update interval.
- Checkmate or another terminal label and Share remain terminal-only.
- Share feedback retains its polite live-region behavior in a separate fixed
  notification.
- Busy and disabled behavior remains unchanged.
- DOM order remains action group first and summary group second. Within the
  summary group, keyboard navigation follows terminal Share before the timer
  visibility toggle when terminal controls are present.

## Responsive and accessibility requirements

- Desktop controls render as one toolbar row whenever their intrinsic contents
  fit the available panel width.
- Automatic wrapping occurs between the two groups rather than splitting the
  primary action sequence unpredictably.
- At widths up to `32rem`, the action group occupies the full line and retains
  two equal button columns; the summary group occupies the next line and aligns
  right.
- Focus-visible treatment, target sizes, roles, live regions, and timer label
  relationships remain unchanged.
- Hidden timer output and empty share feedback must not create visible phantom
  spacing.

## Regression coverage

Presentation and stylesheet tests must prove:

- the action group precedes the summary group in the control panel;
- terminal status and Share precede the timer toggle and timer in the summary
  group;
- the controls panel is a wrapping flex container;
- the summary group uses automatic leading margin and has no top divider;
- the narrow breakpoint gives the action group a full line while preserving its
  two-column button layout;
- the summary group remains right-aligned after wrapping;
- active and terminal rendering, disabled states, timer visibility, and Share
  feedback remain unchanged.

Verification finishes with the complete Mate test suite, production build, and
lint. Targeted desktop and mobile browser checks confirm the requested row
alignment, narrow wrapping, keyboard order, lack of horizontal overflow, and
clean console output.

## Alternatives rejected

- **Two-column grid:** requires a more rigid breakpoint and handles variable
  terminal text less naturally than intrinsic flex wrapping.
- **One flattened list of controls:** removes the meaningful action and summary
  grouping and makes controlled wrapping less predictable.
- **Forced single line at every width:** creates cramped controls or horizontal
  overflow on phones.

## Constraints

- Preserve all existing Mate behavior and unrelated worktree changes.
- Do not change control labels, timer persistence, session logic, sharing, or
  terminal outcomes.
- Keep CSS sizing in `rem` or content-relative units.
