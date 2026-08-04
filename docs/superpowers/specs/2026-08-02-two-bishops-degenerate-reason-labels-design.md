# Two Bishops Degenerate Reason Labels

## Goal

When Degenerate is the decisive White priority, show the particular Degenerate family in the current hint and move-log Reason column instead of the generic `degenerate` label.

## Labels

The canonical labels match the existing diagram titles:

- `degenerate — edge repair`
- `degenerate — unmask edge bishop`
- `degenerate — diagonal king step`
- `degenerate — free bishop`
- `degenerate — waiting move`
- `degenerate — king sidestep`
- `degenerate — reform wall`

## Architecture

Keep one ordered `degenerate` priority and keep its rule ID unchanged. Each matched repair carries its canonical subtype label. The rule-analysis layer may refine a selected rule's reason label for the current board while requiring the refined description to retain the selected rule ID.

Session logs persist an optional refined reason label when it differs from the registered priority label. The move log displays that persisted label, while reason clicks continue targeting the `degenerate` priority through the unchanged rule ID. Current reason hints use the same refined description directly.

This is explanatory metadata only. It does not alter scoring, survivor order, phase classification, or recommended moves.

## Verification

- Cover all seven Degenerate matchers and their canonical labels.
- Confirm the diagonal repair displays `degenerate — diagonal king step`.
- Confirm a played move persists and renders its subtype label.
- Confirm clicking the reason still targets the generic Degenerate priority.
- Run focused Two Bishops, session, and presentation tests; targeted TypeScript and diff checks; then the fail-fast Two Bishops loop gate.

