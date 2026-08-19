# Remove Rule WW

## Scope

Remove Rule WW from the Two Bishops evaluator and guide completely.

Delete its ordered priority, rendered help text, note-board diagram, score fields, position context, cage-geometry helpers, generated diagram fixture, and dedicated tests. Preserve every other rule's behavior and relative order; Rule W follows Rule V after removal.

Do not replace Rule WW with a fallback or retain disabled implementation code.

## Verification

The Two Bishops rule-order and presentation tests must contain no Rule WW references. The focused rules and presentation suites must pass, and a current Phase 1 loop must be found with Phase 2 treated as terminal.
