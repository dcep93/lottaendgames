# Two Bishops Degenerate Knight-Step Control Design

## Goal

Repair the supplied Phase 2 loop position by moving the bishop to establish the missing control geometry.

## Pattern

Canonical position:

`6B1/6B1/8/8/5K2/7k/8/8 w - - 0 1`

Match this exact arrangement under every D4 rotation and reflection. Ignore FEN counters, but reject translations and nearby arrangements. Require Phase 2, the canonical knight-move relationship between the kings, and no bishop control of canonical `h5` under the matched transform.

## Rule

Reason label: `degenerate — knight-step control`

Allow legal bishop moves whose resulting bishops control canonical `g2`, transformed with the matched D4 orientation. In the canonical position, this uniquely selects `Bd5`. Do not hard-code SAN; derive the move from the result-board control postcondition.

Place this pattern first in the Degenerate priority and diagram order. Universal mate, bishop-safety, and stalemate priorities remain authoritative.

## Diagram

Use the canonical position, highlight `h5` and `g2`, and show the arrow from `g8` to `d5`. Caption: `With h5 uncontrolled, move the bishop to control g2.`

## Verification

- Assert `Bd5` is uniquely recommended with the specific Degenerate reason.
- Assert the resulting bishop controls `g2`.
- Assert all D4 transforms select the transformed move.
- Reject translations, altered king geometry, and positions where the required missing-control condition does not hold.
- Assert Degenerate reason and diagram ordering stay aligned.
- Run focused Two Bishops rules, directly affected presentation checks, TypeScript, generated-diagram consistency, diff hygiene, and the root-local fail-fast loop finder.

## Non-goals

Do not change global `king closer`, Phase 2 classification, Black policy, or other Degenerate matchers. Do not run the full mate suite, browser validation, SCC census, commit, push, or deploy.
