# Two Bishops Supported-Corner Waiting Move

## Goal

Select a useful waiting move instead of the reversible check in
`Be5+ Kh7 Bf4 Kh8`, while keeping the modal rule concise, accurate, and usable
without knowing the implementation.

## Rule

Keep the existing **waiting move** title and use this explanation:

> Use a non-checking bishop move that keeps phase 2. When the kings are a
> knight's move apart and the bishops are together, move one bishop one square
> toward the center. When Black is cornered and White's king supports it, bring
> the bishops together.

The two sentences describe the evaluator's two observable waiting geometries.
They avoid unexplained terms such as “improve” or “advance the setup.”

## Supported-Corner Geometry

The new geometry activates when:

- Black is literally on a corner;
- White's king is a knight's move from that corner;
- the bishops are not adjacent; and
- at least one legal bishop move can bring the bishops onto adjacent squares,
  give no check, and leave phase 2 intact after every legal Black reply.

Every qualifying move survives the waiting priority. Existing later visible
rules break ties. In the known loop, `Bf3` and `Bd6` qualify; the opposition
priority selects `Bf3`. The checking move `Be5+` is rejected by **waiting move**.

## Existing Geometry

The line-pattern waiting move remains the most specific case. The
adjacent-bishops/knight-distance rule remains unchanged and continues to select
`Bf3` in the former `Kb3 Kc1 Kc3 Kb1` loop. Supported-corner waiting is used
only when those cases do not apply.

## Verification

Tests cover exact candidates and reasons, non-checking and all-replies phase-two
requirements, all eight board symmetries, and the existing waiting fixtures.
The exhaustive verifier then searches every legal KBBK start and every legal
Black response. If another loop remains, report its shortest cycle as a
validated localhost replay.
