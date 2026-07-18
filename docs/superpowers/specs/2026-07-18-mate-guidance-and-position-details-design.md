# Mate guidance and position details

> Superseded for training guidance and position-details placement by
> `2026-07-18-mate-training-info-dialog-design.md`. Terminal badge and Rook help
> requirements in this document remain applicable.

## Goal

Resolve four quality-audit findings in the Mate workspace without changing the
mate engines, position generation, move selection, session history, or route
format:

- terminal boards must not display a misleading phase;
- Standard and Train must be explained where a drill is being used;
- the Rook `rook waiting distance` priority must have useful help text;
- raw starting FEN must be available without occupying primary workspace space.

## Confirmed interaction design

The workspace uses native, collapsed disclosures rather than a new modal,
drawer, tooltip system, or navigation surface.

### Terminal board badge

While a session is active, the existing board badge continues to render
`Phase <label>`. Once the session has any terminal outcome, the same badge reads
`Complete`. The actual rule-derived phase remains unchanged for move logs and
internal state. The terminal outcome in the controls continues to identify the
specific result, such as Checkmate or Stalemate.

### How training works

A collapsed `How training works` disclosure appears in every selected Mate
workspace beneath the set and mode heading. It contains:

- mode-specific copy:
  - Standard generates a new legal starting position for the selected material;
  - Train uses curated positions transformed to vary the board while preserving
    the exercise;
- shared instructions that White moves and Black replies automatically;
- a concise explanation of Play Best, reason hints, and the priority guide;
- the existing keyboard shortcuts: Enter starts over, Left Arrow undoes, Right
  Arrow redoes, and Up Arrow plays a best move.

The disclosure is collapsed by default on every route and does not persist open
state across route changes.

### Rook waiting-distance help

The empty help text for `rook waiting distance` is replaced with an explanation
derived from its actual score semantics: `When a rook waiting move is required
and the earlier priorities tie, place the rook as far as possible from Black's
king.` This matches the ascending comparison of the negated king distance and
does not alter the priority calculation.

### Position details and FEN copying

The always-visible `Starting FEN` block becomes a collapsed `Position details`
disclosure in the board column. Inside it:

- the label `Starting FEN` and exact starting FEN remain visible when expanded;
- `Copy FEN` copies only the FEN, not the terminal share message or route;
- a polite live region reports `Copied` or `Copy unavailable`;
- copy requests are guarded against stale async results when a session or route
  changes, following the terminal sharing pattern already used by the workspace.

The disclosure is collapsed by default and is recreated with the drill when the
exact route changes.

## Architecture and component boundaries

- `MateWorkspace` owns terminal state, mode, starting FEN, and copy request
  lifecycle. It composes both disclosures and passes a terminal flag to the
  board.
- `MateBoard` remains a controlled board. A narrow terminal/complete prop changes
  only the badge presentation; `phase` retains its existing rule-derived value.
- A small workspace guidance component or focused local rendering helper owns
  the static mode and instruction copy. It has no rule-engine dependency.
- The Position details disclosure reuses the existing clipboard helper rather
  than introducing another browser-copy implementation.
- `majorPieces.ts` remains the canonical source for the Rook priority help text.

No catalog schema, routing, session reducer, persisted storage, or network call
is added.

## Accessibility and responsive behavior

- Both disclosures use native `details` and `summary` semantics and remain
  keyboard-operable without custom focus management.
- Summary and copy controls use the existing focus-visible treatment and must
  meet the current responsive width constraints.
- Copy feedback uses `aria-live="polite"` and is not conveyed by color alone.
- `Complete` remains associated with the board through the existing phase/badge
  description relationship.
- Expanded content wraps on narrow screens and must not create page-level
  horizontal overflow. The FEN may wrap or scroll within its own bounded area.

## Error handling

- Clipboard failure does not throw or disrupt the session. The UI reports
  `Copy unavailable`.
- Stale clipboard completions do not update a replacement drill.
- An unknown mode cannot occur through the typed route contract; no fallback
  product copy is required.
- Terminal phase presentation depends only on the existing session outcome, so
  it cannot alter or delay terminal classification.

## Regression coverage

Component and integration tests must prove:

- an active board still displays its phase;
- every terminal outcome switches the board badge to `Complete` without changing
  the rule-derived phase passed to logs;
- Standard and Train render their distinct descriptions and the shared guidance;
- the guidance and Position details disclosures are collapsed by default;
- Position details exposes the exact starting FEN when expanded;
- Copy FEN sends the exact FEN and reports success or unavailability;
- stale copy completions cannot update a replacement drill;
- `rook waiting distance` has non-empty, score-accurate help;
- existing terminal Share behavior remains unchanged.

Verification finishes with the complete Mate test suite, production build, and
live desktop/mobile checks covering both modes, terminal completion, disclosure
keyboard operation, FEN copying, wrapping, horizontal overflow, and console
warnings/errors.

## Alternatives rejected

- **One combined information drawer:** adds custom state and focus behavior for
  two small, independent information surfaces.
- **Tooltips or popovers:** fragment essential instructions and are less
  discoverable for keyboard and touch users.
- **Landing-page-only guidance:** disappears precisely when a learner needs it
  during an exercise.
- **Changing the phase engine at checkmate:** risks rule and log behavior when
  the problem is only the terminal badge presentation.
- **Removing FEN entirely:** makes exact-position diagnosis and sharing harder
  for advanced users.

## Constraints

- Preserve unrelated user changes.
- Keep the patch limited to audit items 4, 5, 7, and 8.
- Do not change mating choices, generated positions, share-text format, route
  hashes, or progress-storage policy.
