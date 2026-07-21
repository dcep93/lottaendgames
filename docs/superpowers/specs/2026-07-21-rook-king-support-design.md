# Rook King Support Design

## Goal

Preserve the non-expanding phase-two box rule while preventing White's king
from chasing Black sideways when it is too far from the Rook to support it.

## Visible rule

Add this Rook priority after `waiting move` and before `king closer`:

> **king supports rook** — When White's king is more than two king moves from
> the Rook, move it closer to the Rook.

## Evaluator behavior

The rule is active only when the starting Chebyshev distance between White's
king and Rook is greater than two.

While active:

1. A White king move that reduces this distance is preferred.
2. A Rook move is neutral.
3. A White king move that does not reduce this distance is least preferred.

Earlier priorities still reject unsafe material, stalemate, unproductive
checks, phase-two loss or enlargement, and required waiting-move violations.
Later priorities break ties between qualifying support moves.

## Required positions

- `8/4k3/8/8/8/R7/3K4/8 w - - 0 1` selects `Kc2`, preventing the former
  `Ke2 Kd6 Kd2 Ke7` cycle.
- `8/2K5/R7/4k3/8/8/8/8 w - - 6 4` keeps the support rule inactive and
  selects `Kd7` under `king closer`.

## Verification

- Pin the exact visible copy and rule order.
- Assert the support score tiers and both required moves.
- Verify all affected fixtures under all board symmetries.
- Run focused Rook tests and update only consequences of the approved rule.
- Run the exhaustive identity-keyed Rook verifier; no loop or 50-move result
  is acceptable.
- Run the complete mate suite, lint, build, and a diff check.
