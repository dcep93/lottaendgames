# Two Bishops Degenerate–Unmask Tie-Break Design

## Goal

Let later visible priorities, especially `unmask`, break ties among moves that all satisfy the `degenerate` repair.

## Architecture

Remove the `degenerate` rule's early-stop condition. Keep its position matcher, applicability, penalty, order, and rendered copy unchanged.

The normal ordered selector then behaves as follows:

1. `degenerate` eliminates every move that does not perform the required repair.
2. If one repair move remains, later rules cannot change it.
3. If several repair moves remain, later visible priorities evaluate only those survivors in their displayed order.

No eliminated move can return. There is no hidden handoff, duplicate Unmask comparison, or history-dependent behavior.

## Supplied Position

For `8/8/8/8/8/8/3B1K2/5B1k w - - 0 1`, the Waiting Move Degenerate keeps moves by the `d2` bishop. Universal stalemate safety removes `Bf4`. `unmask` then removes `Be1` and `Be3`, where White's king blocks the moved bishop's diagonal ray.

The resulting correct set is `Bc3`, `Bb4`, `Ba5`, `Bg5`, `Bh6`, and `Bc1`, with displayed reason `unmask`.

## Verification

- Update architecture tests to assert Degenerate no longer defines `stopWhenBest`.
- Update Waiting Move tests to calculate Degenerate survivors and then apply the normal later priorities.
- Add an exact regression for the supplied position, including the six-move set, rejected masked moves, and `unmask` reason.
- Preserve unique-repair Degenerate fixtures and their `degenerate` reason.
- Run focused Degenerate, Unmask, rule-order, presentation, TypeScript, and diff checks.
- Run the small fail-fast gate and return one verified localhost loop.

## Non-goals

- Do not reorder any visible rule.
- Do not embed Unmask mechanics inside Degenerate.
- Do not change Degenerate pattern geometry, diagrams, phase classification, or Black priorities.
- Do not run the full mate suite, commit, push, or deploy.
