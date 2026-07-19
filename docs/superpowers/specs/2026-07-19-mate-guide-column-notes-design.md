# Mate Guide Column Notes Design

## Goal

Every Mate training-info modal must begin its Notes section by explaining the move log's **Correctness** and **Black replies** columns.

## Presentation

The first two notes are shared across every material type and appear in this order:

1. “Correctness: 👍 means White chose a best move; 👎 means White did not. /N is the number of best White moves.”
2. “Black replies: X / Y means X best-resistance replies out of Y legal replies.”

Material-specific notes follow these shared notes without changing their existing order. Note diagrams remain after all text notes.

## Architecture

The shared explanations belong to the modal presentation, not to individual chess evaluators. `MatePriorityGuideDialog` will prepend an immutable shared note list to `ruleSet.help.notes`. This avoids duplicating interface copy across all rule sets and guarantees that the Notes section exists even when a rule set has no custom notes or diagrams.

## Verification

Presentation tests will assert the exact shared wording, its ordering before every material-specific note, and the continued presence and ordering of note diagrams. The complete Mate test suite, lint, and production build will then be run.
