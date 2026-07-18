# Mate share notification toast

## Goal

Replace the persistent inline Share copy status with a temporary notification
that never changes the controls toolbar or surrounding layout.

## Confirmed behavior

- A successful Share copy shows `Copied` for two seconds.
- A failed copy shows `Copy unavailable` for two seconds.
- Repeating Share clears the prior message before the new copy resolves, so the
  same result can be announced again and receives a fresh two-second lifetime.
- Starting over, replacing the exact route, or unmounting clears the message and
  its timer.
- Stale clipboard completions remain unable to notify a replacement session.

## Presentation and accessibility

The notification remains a polite atomic status live region, but moves outside
the summary flex group. When non-empty it is a fixed toast in the lower-right of
the viewport with the existing warm dark palette and a bounded maximum width.
When empty it is not displayed.

Because the toast is fixed-positioned and removed from flex layout, appearing
or disappearing cannot move Share, the timer, the log, or any other rendered
item. The Share button text and terminal/timer order remain unchanged. The toast
uses no required motion, so reduced-motion handling is unnecessary.

## Lifecycle

`MateWorkspace` continues to own clipboard requests and status state. A focused
effect schedules the status reset for 2,000 milliseconds and cleans up whenever
the status changes or the workspace unmounts. The Share handler clears an old
status when a new request begins.

`MateControls` renders the status live region as a sibling of the action and
summary groups rather than a summary item. CSS owns the fixed toast appearance;
no portal or global notification framework is added.

## Regression coverage

Tests must prove:

- Share status is outside the summary flex group;
- the status is fixed-positioned and empty status is hidden;
- success and failure messages still render and are politely announced;
- a message clears after its timeout and timers clean up on replacement;
- the terminal, Share, timer toggle, and elapsed timer keep their order.

Verification includes focused presentation tests, the complete Mate suite,
build, lint, and desktop/mobile browser checks that compare toolbar geometry
before, during, and after the notification.

## Alternatives rejected

- **Changing Share to Copied:** temporarily changes the control label and width,
  and conflates action with feedback.
- **Absolute badge inside the panel:** avoids reflow but can cover controls or the
  log at narrow widths.
- **Inline status with reserved width:** permanently consumes toolbar space and
  does not satisfy the request to notify outside the Share row.

## Constraints

- Do not alter clipboard text, terminal outcomes, timer persistence, or toolbar
  ordering.
- Preserve the existing stale-request guards and unrelated worktree changes.
