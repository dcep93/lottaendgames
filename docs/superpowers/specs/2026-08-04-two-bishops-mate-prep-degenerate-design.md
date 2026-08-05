# Two Bishops `mate prep` Degenerate

## Goal

Add an exact Phase 2 repair for `6k1/8/5K2/8/3B4/5B2/8/8 w - - 0 1` that takes opposition with `Kg6`.

## Recognition

- Require Phase 2.
- Match the exact locations of Black's king, White's king, and both bishops from the supplied FEN.
- Match all eight D4 rotations/reflections.
- Do not match translations or nearby arrangements.
- Place this repair first in the degenerate priority order.

## Move Selection

- In the canonical position, uniquely allow `Kg6`.
- Under a D4 transform, uniquely allow the transformed `f6-g6` king move.
- Continue applying universal mate, bishop-safety, and stalemate priorities first.

## Presentation

Render:

> **degenerate — mate prep** — Take opposition with the king.

Add a Phase 2 diagram for the supplied FEN with an arrow from f6 to g6. The diagram order must match the degenerate selector order.

## Verification

- Test the canonical move and all D4 equivalents.
- Reject a translation, Phase 1 near miss, and altered bishop arrangement.
- Assert diagram title, caption, phase, FEN, and arrow alignment.
- Run focused Two Bishops tests, affected presentation tests, targeted TypeScript, diagram consistency, and `git diff --check`.
- Find one all-Phase 2 loop and navigate the Codex sidebar browser to its replay URL.

## Scope

No changes to other degenerate mechanics, phases, target-corner scoring, Black policy, or verifier architecture.
