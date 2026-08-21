# Rule T Origin-Square Design

## Goal

Align Rule T with its rendered wording: “use a bishop from behind the king.”

## Behavior

For Rule T, test whether the moving bishop's origin square is behind White's
king from Black's perspective. Do not require its destination to remain behind
White's king. Keep the existing knight-step king geometry and moat-opposition
reply test unchanged.

For `4k3/2B5/5K2/8/8/8/8/7B w - - 22 12`, `Bc6+` moves the bishop from
`h1`, which is behind White's king on `f6`, and forces `Kf8`, which takes moat
opposition. Rule T must therefore make `Bc6+` uniquely ideal.

## Scope and verification

Do not change rendered text, rule order, or other behind/onsides geometry. Add
a focused regression for the supplied position, run the focused Rule T test,
and validate a fresh exact loop plus a mating escape before loading it at
`cursor=0`.
