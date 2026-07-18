# Mate timer visibility preference

## Goal

Remember whether the Mate elapsed timer is shown so the same choice is restored
after a page reload. This is a presentation preference only: Mate positions,
move history, elapsed time, outcomes, and training progress remain ephemeral.

## Confirmed behavior

- The timer is visible when no saved preference exists.
- Clicking `Hide timer` stores the hidden state immediately.
- Clicking `Show timer` stores the visible state immediately.
- A newly mounted Mate workspace reads the saved state once and uses it as the
  initial timer visibility.
- The preference applies to every Mate material and mode.
- Changes in another tab or window do not update the current page live. A reload
  picks up the latest stored value.

## Storage contract

Use one origin-scoped local-storage entry:

- key: `lottaendgames.mate.showTimer`
- visible value: `true`
- hidden value: `false`

Only those two exact string values are valid. A missing or malformed value
defaults to visible. Reads and writes must be guarded because browser privacy
settings, origin policy, or storage limits can make local storage unavailable.
A storage failure must not affect the timer toggle or the training session; the
preference simply remains in memory until the page reloads.

## Architecture

A focused timer-preference module owns the key, parsing, and guarded browser
access. It exposes one read operation and one write operation. This isolates the
only permitted Mate storage from `MateWorkspace` and keeps it distinct from
session or progress persistence.

`MateWorkspace` initializes `showTimer` from the preference reader. Its timer
toggle computes the next visibility, updates React state, and asks the helper to
save that same value. `MateControls` remains controlled and requires no storage
knowledge.

No generic persistent-state hook and no `storage` event listener are added.

## Error handling

- Server-side or test rendering without `window` uses the visible default.
- A storage getter that throws uses the visible default.
- An invalid stored value uses the visible default.
- A storage setter that throws is ignored after the in-memory UI state changes.
- Storage failures are not shown to the user because the primary toggle action
  still succeeds and no recovery action is available.

## Regression coverage

Focused tests must prove:

- absent, invalid, and unavailable storage default to visible;
- exact `true` and `false` values restore the corresponding visibility;
- toggling updates the UI and writes the corresponding value;
- a failed write does not block the UI state change;
- the storage integration remains limited to the timer-preference module and
  does not permit Mate progress persistence.

Verification finishes with the complete Mate test suite, production build, and
lint. A targeted browser check hides the timer, reloads the page, confirms it
remains hidden, shows it again, reloads, and confirms it remains visible.

## Alternatives rejected

- **Direct storage access in `MateWorkspace`:** smaller in line count but mixes
  parsing and browser failure handling into the workspace component.
- **Generic persistent-state hook:** unnecessary abstraction for one preference.
- **Live cross-tab synchronization:** explicitly outside the requested reload-
  only behavior.

## Constraints

- Do not store Mate positions, history, elapsed time, outcomes, or progress.
- Do not change timer formatting, ticking, session timing, routes, or sharing.
- Preserve unrelated user changes in the current worktree.
