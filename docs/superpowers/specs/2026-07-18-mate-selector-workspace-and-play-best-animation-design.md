# Mate selector, workspace order, and Play Best animation

## Goal

Make the Mate workspace faster to scan and make automated moves visually
legible:

- remove the redundant visible `Mate training` label;
- replace mating-set names with material icons;
- keep Standard and Train horizontal;
- place training guidance beside position details;
- place the complete controls panel above the move log;
- animate Play Best as a White move followed by a Black move, each lasting
  approximately 100 milliseconds.

The mating rules, generated positions, route format, session history, timing,
move selection, and share output remain unchanged.

## Selector design

The desktop links and mobile dropdown are replaced by one responsive selector
used at every viewport. It contains five icon-only mating-set links in catalog
order:

1. White queen;
2. White rook;
3. two white bishops;
4. white bishop and white knight;
5. two white knights and a black pawn.

Every multi-piece icon depicts the full material group; counts, abbreviations,
and visible names are not used. The icons reuse the board's piece artwork so
they match the exercise surface. Each link retains its catalog name through an
accessible label and a hover/focus title. The selected set keeps the existing
active treatment and `aria-current` state.

The visible `Mate training` heading is removed. The selector remains inside an
`aside` labelled `Mate training`, so the region keeps an accessible name without
repeating the page title visually.

Standard and Train remain ordinary route links and render as a horizontal pair
at every width. Their active and `aria-current` states remain unchanged. On a
landing route without a selected set, the mode pair is absent while all five
material icons remain available.

## Workspace order

The selected workspace keeps its set name and mode badge at the top. Below that,
the two main columns are organized as follows.

The board column contains:

1. board;
2. an information group containing `How training works` and `Position details`.

The two native disclosures sit side by side when the board column has enough
space and stack at narrow widths. They keep their current collapsed-by-default
behavior, keyboard semantics, contents, and FEN copy behavior.

The log column contains:

1. the complete Mate controls panel;
2. the move log.

Start Over, Undo, Redo, Play Best, timer controls, terminal status, Share, and
their live regions move together as one unit. No control is duplicated or split
between columns. When the workspace itself stacks, the reading order is board,
information disclosures, controls, then log.

## Play Best animation sequence

The existing session transition remains atomic. Invoking Play Best, whether by
button or Arrow Up, computes the same complete next session immediately but
stages its presentation:

1. derive the position after only the selected White move;
2. display that intermediate position with a 100 millisecond board animation;
3. commit the precomputed complete session;
4. animate the automatic Black reply for 100 milliseconds.

The move choice, Black reply, log entry, history snapshot, elapsed duration, and
terminal timestamp are determined when Play Best is invoked. The visual delay
must not rerun random selection, scoring, clocks, or session logic.

While the White stage is pending, board moves and session-changing controls are
disabled and keyboard move/history shortcuts are ignored. Timer visibility may
remain interactive because it does not mutate the session. A route change,
Start Over replacement, or unmount cancels any pending timer and prevents a
stale session commit.

If Play Best has no preferred move or produces no session change, no animation
starts. Manual click and drag continue to use the existing optimistic move flow;
their automatic Black reply uses the shared 100 millisecond board duration.

## Component boundaries

- `MateSidebar` owns responsive material-icon links and the horizontal mode
  pair. A focused material-icon component maps catalog IDs to board pieces.
- `MateWorkspace` owns the temporary Play Best presentation stage because it
  already owns the session and commits atomic session transitions.
- `MateBoard` remains controlled. It receives the position selected by the
  workspace and uses a shared 100 millisecond animation constant.
- `MateControls` receives the temporary busy state needed to disable
  session-changing buttons during the White stage.
- `session.ts` remains the canonical source for choosing and completing a best
  move; its public Play Best transition stays synchronous and atomic.

No persisted state, new route field, network call, or rule-engine dependency is
added.

## Accessibility and responsive behavior

- Icon-only links expose the full mating-set names to assistive technology and
  provide hover/focus titles for sighted users who need confirmation.
- Each material group is decorative inside its labelled link, so individual
  piece SVGs do not create repeated accessible names.
- The selector remains keyboard-operable and preserves visible focus states.
- Standard and Train remain horizontal without causing page-level overflow.
- The disclosure and column reorder follows DOM reading order, not CSS-only
  visual reordering.
- Busy controls use native `disabled` states where available; the existing board
  disabled semantics remain intact.

## Regression coverage and verification

Tests must confirm:

- all five icon links render in catalog order with accessible names and no
  visible catalog-name text;
- the redundant visible selector heading and mobile native dropdown are absent;
- Standard and Train remain links in a horizontal mode group;
- the two disclosures render together after the board;
- the full controls group renders before the move log;
- Play Best first exposes the White-only FEN, then commits the already-computed
  complete session after 100 milliseconds;
- White and Black stages use the 100 millisecond animation duration;
- input is blocked while the White stage is pending;
- route replacement and unmount cancel stale commits;
- manual move behavior, session history, sharing, timer behavior, and all mating
  rule suites remain green.

Verification finishes with the Mate test suite, production build, and targeted
desktop and narrow-width checks for icon clarity, horizontal modes, disclosure
placement, controls/log order, sequential animation, overflow, and console
errors.

## Alternatives rejected

- **Compact counts or material notation:** visually uniform but requires users
  to decode symbols instead of directly recognizing the pieces.
- **Keeping the mobile dropdown:** preserves native selection but conflicts with
  the requested icon-only selector and creates two different interfaces.
- **Splitting White and Black into reducer commits:** makes the animation visible
  but risks partial history, timing, terminal, and sharing states.
- **CSS-only animation delay:** cannot reliably expose two distinct chess
  positions or guarantee their order.

## Constraints

- Preserve unrelated and in-progress user changes.
- Do not alter mating choices, generated positions, rule scoring, session
  history semantics, routes, or share text.
- Keep CSS sizing in `rem` or `em` except where existing board-library APIs
  require milliseconds as numeric values.
- Do not broaden verification into a full visual end-to-end pass.
