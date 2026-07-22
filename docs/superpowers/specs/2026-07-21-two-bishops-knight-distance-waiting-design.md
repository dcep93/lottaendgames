# Two Bishops Knight-Distance Waiting Move

## Goal

Remove two-bishop mating loops with a simple position-based rule that applies
from any legal start. The evaluator must not inspect repetition history or add a
generic draw-avoidance exception.

## Rule

Replace the narrow phase-two waiting-move explanation with:

**waiting move** — When the kings are a knight's move apart and the bishops are
together, move a bishop one square toward the center without losing phase 2.

The rule activates only in phase 2 when the kings' file and rank differences are
one and two and the bishops occupy adjacent squares. A qualifying move must:

- move a bishop exactly one diagonal square;
- reduce that bishop square's distance from the center; and
- leave phase 2 intact after every legal Black reply.

If no move qualifies, this geometric waiting rule is inactive and the existing
phase-two priorities continue normally. Existing line-pattern and corner
waiting moves remain available outside this geometry.

## Selection

The waiting-move priority remains ahead of the opposition priorities. All
qualifying waiting moves survive this priority; later visible rules, including
keeping the bishops together, break any tie. In the known loop position this
makes `Bf3` the sole best move and rejects the looping `Kb3`.

## Verification

Focused tests cover activation, fallback, all legal Black replies, and all eight
board symmetries. The exhaustive two-bishop verifier must then search every
legal KBBK starting placement and every legal Black response. If a loop remains,
report its shortest cycle as a localhost replay; do not hide it with history or
a position-specific exception.
