# Two Bishops Phase 1 Check Priority

## Goal

Add a final Phase 1 White-move priority named `check` with the visible description `Play a check`.

## Behavior

- Place `check` immediately after `king closer` in the ordered White priorities.
- Apply it only when the position being scored starts in Phase 1.
- Among the moves that survive every higher priority, prefer moves whose resulting position checks Black's king.
- If no surviving move gives check, leave the surviving set unchanged.
- Do not rank checking moves by the number or quality of Black replies.
- Do not change Phase 2 move selection.

## Scoring

Extend `TwoBishopsWhiteMoveScore` with a check penalty derived from the resulting chess position:

- `0` when `chess.isCheck()` is true after White's move;
- `1` otherwise.

Use the chess position state rather than parsing `+` or `#` from SAN. This keeps the rule independent of notation formatting and naturally treats checkmate as check, though the existing `mate` priority already handles checkmate first.

## Presentation

Expose the rule in the training priority guide as:

- Label: `check`
- Help text: `Play a check`

No diagram or geometry changes are required.

## Testing

Update the ordered-rule and score-shape expectations, then add focused coverage proving that:

- `check` appears immediately after `king closer`;
- it selects a checking move only after all higher priorities tie;
- it leaves all survivors when no checking move exists;
- it does not apply to Phase 2;
- the visible priority guide contains `check — Play a check`.

Run the focused Two Bishops and presentation tests, lint, and TypeScript checks. After implementation, generate a new strict loop whose White moves are all current Phase 1 ideal moves, whose repeated board is exact, and whose entry into Phase 2 would count as termination. Open that loop in the Phase 1 Codex browser on port 5174.
