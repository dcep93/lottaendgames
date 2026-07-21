# Two Bishops One-Way Screening Design

## Goal

Make the Two Bishops screening rule describe and score only White's king
screening a bishop from Black's king.

## Visible rule

Replace the rule with:

> **avoid bishop screening** — Keep White's king from screening the bishops
> from Black's king.

The rule ID and short label both become `avoid bishop screening`, so the guide,
hints, logs, explanations, and highlighted reason use the same name.

## Evaluator behavior

For each White bishop, add one screening penalty exactly when White's king lies
between Black's king and that bishop under the existing screening geometry.

A bishop lying between Black's king and White's king no longer adds a penalty.
All other Two Bishops priorities and their order remain unchanged.

## Verification

- Pin the exact rule ID, short label, and help text.
- Add direct geometry cases proving King-between counts and
  bishop-between does not.
- Update affected literal move fixtures to the new evaluator output.
- Run focused Two Bishops and presentation tests, lint, build, and a diff check.
- Report any broader-suite issue separately from this rule when it belongs to
  the pending Rook policy work.
