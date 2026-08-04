# Two Bishops Martian Conclave Step Design

## Goal

Add a named Phase 1 pattern rule, `martian conclave step`, for the supplied position:

`8/8/3K1k2/8/4BB2/8/8/8 w - - 2 2`

The rule selects `Be5+`, replacing the current fallback recommendation and reason.

## Pattern

Use White's king as the relative origin. In the canonical orientation:

- White's king is at `(0, 0)` (`d6`).
- Black's king is at `(+2, 0)` (`f6`).
- White's bishops are at `(+1, -2)` and `(+2, -2)` (`e4`, `f4`).
- The bishop at `(+1, -2)` moves to `(+1, -1)` (`e5`).

Match this relative arrangement under translation and all eight D4 rotations and reflections. Board-edge clipping and any other arrangement do not match.

## Rule Order and Scope

Add `martian conclave step` immediately after `reverse conclave step` and before `finish wall` in the visible White priority cascade. It applies only when the starting position is Phase 1. Mandatory mate, bishop-safety, stalemate, and earlier strategic rules continue to outrank it.

The rule owns the reason whenever its move is the first surviving discriminator. Its visible help text is:

`Phase 1: When the pieces are in the position shown, make the martian conclave step.`

## Diagram

Add a generated note-board entry titled `martian conclave step` using the exact supplied FEN, with no highlights and an arrow from `e4` to `e5`. The caption describes playing the arrowed bishop move.

## Implementation

- Add a `martianConclaveStepPenalty` score field.
- Compute matching bishop steps once in the prepared position context.
- Score the matching bishop move as `0` and all other candidates as `1`.
- Register the new Phase 1 comparison after `reverse conclave step`.
- Extend generated diagram data, presentation ordering, and the manual-cascade parity fixture.

## Verification

Tests must prove:

- The canonical position uniquely recommends `Be5+` with reason `martian conclave step`.
- The rule follows translation and every D4 transform.
- The exact diagram uses the supplied position and arrow `e4 -> e5`.
- The rule is inactive in Phase 2 and rejects nearby geometry.
- The full Two Bishops rule and presentation suites, diagram generation check, TypeScript build, and diff check pass.
- A fresh seeded cycle remains entirely in Phase 1; entering Phase 2 terminates loop search.
