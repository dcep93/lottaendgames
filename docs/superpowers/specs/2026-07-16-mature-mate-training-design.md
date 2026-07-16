# Mature Mate Training Design

## Goal

Replace the `/mate` placeholder with a polished Lotta Endgames edition of
chess420's Endgames mode. Preserve the existing trainer's human-readable,
rule-based move selection and detailed practice tools while separating it from
chess420's unrelated opening and Lichess features, organizing the code, and
bringing the interface into Lotta Endgames' house style.

This is a cleanup and integration project, not a new training model. The first
release does not add accounts, long-term progress, streaks, aggregate accuracy,
engine or tablebase queries, result-card scoring, or a new difficulty system.

## Product Principles

- Train simple human mating procedures rather than engine-perfect tablebase
  lines.
- Make every preferred move traceable to an explicit, visible priority rule.
- Preserve free play: an incorrect move is explained and recorded, but play
  continues.
- Work entirely offline after the application has loaded.
- Preserve the useful behavior of chess420 Endgames before refactoring its
  internals.

## Mating Sets and Modes

Mate supports five mating sets:

1. Queen
2. Rook
3. Two Bishops
4. Bishop and Knight
5. Two Knights vs Pawn

Each set supports the two modes already established by chess420:

- **Standard** uses randomized legal starting positions with White holding the
  mating material.
- **Train** is the renamed `+` mode. It uses curated close-to-mate positions and
  safe board-symmetry transformations as training wheels.

Random selection does not suppress repeats. White is always the player's side.
There is no Easy, Medium, or Hard classification.

The first four sets preserve chess420's existing generators, Train seeds,
transformations, phase logic, White priorities, and Black defensive priorities.
Two Knights vs Pawn is completed rather than carried over as disabled:

- Standard samples from a locally bundled, verified collection of winning
  constructions and applies only transformations that preserve the position's
  result. It does not generate arbitrary legal KNN-vs-pawn positions, because
  many are theoretical draws.
- Train uses a smaller curated collection of verified close-to-mate
  constructions with the same safe transformations.
- Both modes receive explicit ordered White and Black rules, explanations, and
  the same hint and logging behavior as the other sets.

The bundled Two Knights vs Pawn collections are prepared once against an
offline five-piece Syzygy tablebase. Only unconditional White wins (not cursed
wins that fail the fifty-move rule) are admitted. The committed position
manifest records each source FEN and its tablebase classification; an audit
script can reproduce that verification when the tablebase files are available.
The shipped browser application never loads or queries a tablebase. Runtime
validation still rejects a malformed position, the wrong material, an illegal
position, or a position not present in the supported winning construction data.

## Rule-Based Training Model

The ordered rule sets are the core domain model. Each mating set defines:

- how candidate White moves are scored and compared;
- the ordered White priorities used to eliminate inferior candidates;
- how candidate Black replies are scored and compared;
- the ordered Black priorities used to choose stubborn resistance;
- phase detection and any explanatory diagrams or notes; and
- terminal and unsupported-position conditions specific to the material.

A White move is **correct** when it ties for the best result after applying that
set's ordered rules. Multiple moves can therefore be correct. An incorrect
move's reason is the first priority that prefers a best candidate over the
played move. This replaces the proposed "material degradation" abstraction;
correctness is not inferred from a generic evaluation delta.

The same rule definitions must drive candidate comparison, short reason labels,
the current-position hint, and the full priority guide. Computation and user
explanation must not be maintained as separate, potentially divergent lists.

Black automatically chooses among its best defensive replies. Where several
replies tie, the existing randomized choice remains. The move log continues to
allow the user to cycle a historical Black reply through other ideal replies or
through arbitrary legal replies. It also allows cycling among alternative ideal
White moves. Replacing a historical move truncates and rebuilds the later line
as chess420 does today.

## Interaction Design

The selected desktop structure is a persistent sidebar beside the practice
workspace. The sidebar contains the five mating sets and the Standard/Train
choice. On narrow screens it collapses into a compact selector above the board.

The practice workspace preserves the useful chess420 controls and information:

- interactive board with legal drag-and-drop play, last-move treatment, and
  automatic Black reply;
- phase indication;
- timer with show/hide control;
- Start Over, Undo, Redo, and Play Best actions;
- keyboard equivalents for the preserved actions;
- current starting FEN and shareable exact-position link;
- per-move log with phase, White SAN, Black SAN, ideal/legal Black reply counts,
  White correctness, number of correct White choices, move duration, and reason;
- control to cycle alternative ideal White moves, ideal Black replies, and legal
  Black replies; and
- complete priority help for both sides, including the existing explanatory
  diagrams and notes.

"Show reason hints" remains opt-in. In a position where White can move, it shows
the short label for the currently relevant priority rule. It never reveals the
recommended move, source square, or destination square. Clicking the reason or
its header opens the complete ordered rule guide.

Incorrect moves receive the existing negative correctness marker and reason in
the log. They do not interrupt the session, force a retry, or offer an automatic
undo. Start Over deals another random position and is never counted. Random
positions may repeat.

Terminal outcomes remain checkmate, stalemate, and lost required mating
material. For Two Knights vs Pawn, leaving its supported winning construction
also ends the attempt unsuccessfully. The existing timer, terminal label, and
share action remain; there is no new result card or Next Position workflow.

Session history lasts only for the current drill. The release adds no persistent
progress history. Route and share state can restore a selected drill or exact
starting position, but local storage does not accumulate results.

## Application Structure

The feature is integrated beneath `app/src/mate` and remains isolated from the
Book reader's playback and content state. Existing generic dependencies such as
`chess.js` and `react-chessboard` may be shared, but Book-specific components are
not made dependencies of Mate merely to avoid duplication.

The port includes only endgame behavior needed by Mate:

- catalog and position generation;
- the ordered White and Black rule engines;
- opponent reply selection;
- session state, history, timing, and navigation;
- board interaction;
- move log and priority help;
- share-state parsing and formatting; and
- the endgame-specific tests and build-time verification data.

It excludes chess420's openings, Lichess imports, traps, cram, manual traversal,
novelty storage, general mode controls, Bootstrap shell, and developer-only loop
finder UI.

The original monolithic `Brain` is not copied wholesale. Behavior is first
captured by regression tests, then moved along narrow boundaries:

- `catalog/positions`: mating-set metadata, Standard generators, Train seeds,
  transformations, and position validation;
- `rules`: per-set ordered White and Black rule definitions, phase logic,
  candidate comparison, reason selection, and help content;
- `session`: current position, move application, automatic replies, history,
  timing, terminal outcomes, and historical-line replacement;
- `routing`: route and exact-position hash parsing/formatting; and
- `ui`: selector, board workspace, controls, summary, move log, and priority
  guide.

These names describe responsibility rather than requiring one file per bullet.
Files should remain focused and consistent with the repository's modularity
rule. Refactoring must not intentionally change the first four mating sets'
move choices or explanations.

## Routes and Share State

- `/mate` opens Mate with no selected mating set.
- `/mate/queen`
- `/mate/rook`
- `/mate/two-bishops`
- `/mate/bishop-knight`
- `/mate/two-knights-pawn`

Those routes select Standard mode. Appending `/train` selects Train mode, for
example `/mate/rook/train`.

An optional hash carries an exact starting FEN using a documented encoding
adapted from chess420. It must round-trip the side, board, move counters, and any
other FEN fields required by `chess.js`. Loading an exact-position hash restores
that starting position only after the route's mating set and mode validate it.
The share action copies a terminal label, elapsed time, and this exact URL.

Real links and the native History API preserve refresh, modified-click,
back/forward, and direct-load behavior. Invalid mate types, extra path segments,
unsupported modes, malformed hashes, illegal FENs, wrong material, and exact
positions unsupported by the selected drill canonicalize to `/mate`.

If a Standard generator exhausts its bounded attempt limit, the session uses
that mating set's known-valid fallback. Train always has a known-valid seed. If
a legal position produces no preferred rule because of an internal evaluation
gap, the board remains playable and the log reports that no preferred rule was
identified rather than crashing or inventing a reason.

## Visual Direction and Accessibility

Mate uses the Lotta Endgames house style: dark night background, warm brown
surfaces and borders, pink title/accent moments, and restrained playful display
type. It should feel like the mature sibling of the Book reader rather than an
embedded chess420 page. App-level spacing and geometry use `rem`; element-local
type-relative sizing uses `em`.

Controls use semantic buttons, links, labels, tables or table-like accessible
structures, dialogs, and status announcements. Every drag action has a click or
keyboard-capable equivalent where the board library permits it. Focus is
visible, priority help traps and restores focus correctly, and correctness is
communicated with text or accessible labels rather than emoji or color alone.
The board and log remain usable at a 320-pixel viewport without a persistent
side-by-side layout.

## Verification

Before restructuring, port the relevant chess420 Endgames regression tests and
record existing outputs for the first four mating sets. Verification then
covers:

- legal Standard starts, Train seeds, safe symmetry transformations, material
  constraints, and bounded fallbacks;
- the exact ordered rules and candidate ties for every mating set;
- agreement among move selection, correctness, short reasons, current hints,
  and full priority-guide text;
- strongest Black replies and cycling ideal or arbitrary historical replies;
- alternative ideal White moves and historical-line truncation/rebuild;
- phase transitions, timer semantics, undo/redo, start over, new position,
  keyboard actions, and terminal outcomes;
- sampled and targeted self-play paths that catch loops or non-terminating
  strategy regressions in all five sets;
- Two Knights vs Pawn winning-construction verification, transformation
  validity, drawn/unsupported-position rejection, and Standard/Train coverage;
- route parsing and formatting for every Standard and `/train` route;
- exact-position hash round trips, validation failures, canonicalization,
  browser history, and share links; and
- focused component tests for the selector, board controls, reason hint,
  priority guide, move log, timer, terminal summary, and narrow layout.

Run the existing Lotta Endgames unit, content, SAN audit, lint, and production
build gates after integration. Visual checking remains targeted to Mate's
desktop workspace, collapsed narrow selector, priority guide, and move log; the
repository explicitly excludes a full visual end-to-end pass.

## Acceptance Criteria

- `/mate` is no longer a placeholder and exposes all five mating sets.
- Every set offers Standard and `/train` modes, including Two Knights vs Pawn.
- The first four sets preserve chess420's rule-selected moves, explanations,
  phases, Black resistance, history controls, timer, and sharing behavior.
- Two Knights vs Pawn uses verified offline winning constructions and exposes
  explicit rule explanations consistent with the other sets.
- A hint reveals the applicable rule only; an incorrect move is explained by
  the first rule that prefers a best move and never stops play.
- Random positions may repeat, and reset/start-over use is not counted.
- No persistent progress, new difficulty tiers, online analysis, or unrelated
  chess420 modes are introduced.
- Routes, exact-position sharing, browser history, invalid-state recovery,
  keyboard access, and the narrow layout behave as specified.
- The complete repository verification suite passes.
