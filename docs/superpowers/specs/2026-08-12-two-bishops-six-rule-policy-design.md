# Two Bishops Six-Rule Policy Design

## Goal

Replace every Two Bishops priority after the three universal safeguards with this exact sequence:

4. **rule pp** — When the kings are in opposition, use a bishop to control the inward flank square.
5. **rule p** — If Rule pp is satisfied, check the king, only from the same side of White's king as the other bishop.
6. **rule q** — When the kings are a knight's move apart, and a bishop controls the square in opposition to White's king, take opposition.
7. **rule r** — When the kings are a knight's move apart, and a bishop controls the square a knight's move from White's king and 2 squares from Black's king, and a bishop can control the diagonal containing the squares adjacent to the kings and also edge adjacent to that first bishop-controlled square, take opposition.
8. **rule s** — When the kings are a knight's move apart, use a bishop to control the flank square. The flank square is the square adjacent to Black's king and also a knight's move from White's king.
9. **king closer** — Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.

## Geometry

- Opposition means the kings share a file or rank with one square between them.
- Rule PP reuses the existing inward-flank calculation without a phase gate.
- Rule P applies when the current position satisfies Rule PP. A bishop check qualifies when the checking bishop and the other bishop share a file-side or rank-side relative to White's king.
- For Rules Q and R, `take opposition` means moving White's king to the unique adjacent square that puts the kings in opposition.
- Rule Q's prerequisite square is adjacent to Black's king and in opposition to White's king.
- Rule R uses exact Chebyshev distance 2 for `2 squares`. `Edge adjacent` means orthogonally adjacent. Its supporting diagonal must contain a square adjacent to each king and a square orthogonally adjacent to the first controlled square.
- Rule S reuses the former Rule Q flank-square calculation.

## Policy surface

- Remove the old mate-in-three, degenerate, Phase 2, unclutter, Rule B, and check priorities from the registered evaluator.
- Keep the phase display and Black's existing resistance priorities.
- Hide all old strategy notes and diagrams. Retain the former flank-square diagram as the Rule S diagram.
- Old internal geometry may remain temporarily when it is no longer reachable from the registered priority sequence.

## Verification

- Pin the exact visible priority list and rendered English.
- Add focused canonical and D4-symmetry tests for Rules PP through S.
- Confirm removed priorities are absent from the guide.
- Run focused Two Bishops and presentation tests, typecheck, lint, and diagram validation.
