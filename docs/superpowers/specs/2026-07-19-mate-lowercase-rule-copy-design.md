# Mate Lowercase Rule Copy Design

## Goal

Make every rendered Mate rule header lowercase and tighten the Queen priority descriptions without changing evaluator behavior.

## Canonical labels

- Lowercase each production rule's registered `shortLabel` at the source.
- Do not lowercase through CSS or only at the presentation boundary; reason hints, modal headings, accessibility names, and tests should all receive the same canonical label.
- Leave internal rule IDs unchanged.

## Queen copy

- Keep the stable two-square corner cage description unchanged.
- Remove the explicit distance tie-break sentence from White king toward cage support.
- Describe white pieces off edge without the parenthetical King-and-Queen phrase.
- Describe Queen box size as the board-edge rectangle containing Black's king.
- Remove the row-plus-file tie-break clause from both Queen and Rook white king closer descriptions.
- Remove the King-move exclusion sentence from shorter Queen move.

These copy cuts hide implementation detail only; scoring and priority order remain unchanged.

## Testing

- Assert every built-in Mate rule `shortLabel` is lowercase.
- Update exact Queen and Rook label snapshots.
- Assert the shortened Queen descriptions are registered exactly as rendered.
- Run the focused major-piece, presentation, and full Mate suites.
