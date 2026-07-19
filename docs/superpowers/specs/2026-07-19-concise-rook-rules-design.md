# Concise Rook Rules Design

## Goal

Make the Rook guide understandable and memorable for a low-attention reader without changing evaluator behavior or priority order.

## Copy strategy

Keep every evaluator priority visible, but present it as a short command. Each non-universal White priority gets at most two brief sentences. Rare activation geometry and implementation exceptions remain in code and tests rather than competing with the core technique in the modal.

## White best moves

The visible labels, in evaluator order, are:

1. `mate`
2. `pieces safe`
3. `no stalemate`
4. `shortest mate` — “When active, follow the shortest forced mate.”
5. `waiting move` — “When the kings are set, play a safe Rook waiting move that keeps the box.”
6. `smaller box` — “Make Black's box smaller. If it cannot shrink, keep the same wall and keep the Rook back.”
7. `push with check` — “Check only when every reply pushes Black farther from your King.”
8. `king closer` — “Bring your King closer to Black.”
9. `rook farther` — “Keep your Rook farther from Black.”

## Black resistance

The introduction becomes “Black chooses the toughest reply.” The priorities remain in evaluator order:

1. “Repeat the position.”
2. “Take a loose Rook.”
3. “Move toward the nearest box wall.”
4. “If the Rook is diagonally beside White's King, chase it.”
5. “Avoid creating opposition.”
6. “Move toward the Rook.”

## Note

The Rook phase note becomes: “Phase 2: the Rook cuts between the kings. Shown only on White's turn.”

## Verification

Literal presentation tests will pin the new labels, descriptions, Black introduction, Black priorities, and phase note. Evaluator tests continue to prove the unchanged scoring behavior, including its technical edge cases. Run the focused Rook and presentation suites, the full repository suite, lint, and the production build.
