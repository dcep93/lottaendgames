# Remove Two Bishops Rule r12

## Goal

Remove Rule r12 from the Two Bishops policy so Rule r follows Rule r9 directly again.

## Scope

- Remove Rule r12 score fields and neutral defaults.
- Remove Rule r12 scoring from both White-move scorer paths.
- Remove its priority-guide entry and active-rule ID.
- Remove its dedicated regression tests and restore the active-order expectation.
- Preserve the shared distant-bishop helper because compatibility scoring still uses it elsewhere.

## Verification

- Run the focused Two Bishops policy tests, production build, and diff checks.
- Run the development verifier, reject structural witnesses containing non-ideal moves, and validate a strict loop directly.
- Replay the strict loop in the sidebar and reset it to `cursor=0`.
