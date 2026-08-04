# Two Bishops Degenerate Wall Waiting Move Design

## Goal

Recognize the supplied Phase 2 arrangement as a Degenerate position and permit bishop waiting moves that preserve the corner wall.

## Pattern

Canonical position:

`8/5B1k/5B2/5K2/8/8/8/8 w - - 0 1`

Match this exact board arrangement under every D4 rotation and reflection. Ignore FEN counters. Do not add translations or a broader edge-pair matcher.

## Rule

Reason label: `degenerate — wall waiting move`

For the canonical orientation, allow every legal bishop move whose resulting bishops retain clear control of both `g8` and `h8`. Transform both required control squares with the matched D4 orientation. Do not allow king moves through this Degenerate priority.

Place this pattern first in the Degenerate priority and diagram order. The Degenerate comparison selects the valid bishop waits; later visible rules may resolve any remaining tie. Universal mate, bishop-safety, and stalemate priorities remain authoritative.

## Diagram

Use the canonical position, highlight `g8` and `h8`, and show `f6` to `e5` as the example arrow. Caption: `Keep bishop control of both highlighted squares.`

## Verification

- Assert `Be5` is recommended with the new specific reason.
- Assert every allowed move is a bishop move and preserves control of both required squares.
- Assert D4 symmetry and rejection of nearby arrangements.
- Assert the new diagram and reason-label ordering agree.
- Run focused Two Bishops rules, directly affected presentation checks, TypeScript, generated-diagram consistency, diff hygiene, and the root-local fail-fast loop finder.

## Non-goals

Do not change `king closer`, other Degenerate patterns, Phase 2 classification, Black policy, or unrelated code. Do not run the full mate suite, browser validation, SCC census, commit, push, or deploy.
