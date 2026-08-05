# Two Bishops Shepherd Rule Design

## Goal

Break the Phase 2 cycle from `3k4/6BB/4K3/8/8/8/8/8 w - - 0 1` with a visible geometric rule that teaches White to use an existing bishop cutoff before continuing the corner drive.

## Rule

Insert immediately before `sequester`:

**shepherd** — Phase 2: When a bishop controls the edge square 2 away from Black's king and further from the target square, take opposition, moving towards the target corner.

The rule is current-position-only and D4-symmetric. For every legal White king move, calculate the target corner from the resulting board using the existing target-corner selector. The move satisfies `shepherd` only when:

1. a bishop already controls the edge square two steps from Black's king on the side farther from that target corner;
2. the resulting kings are in direct opposition, with one square between them; and
3. White's king is closer to the target corner after the move.

If no legal move satisfies all three conditions, the rule ties all moves and changes nothing. It does not search Black replies.

## Diagram

Use `3k4/6BB/4K3/8/8/8/8/8 w - - 0 1`. Highlight `a8` as the target corner and `f8` as the controlled edge square. Draw the king arrow `e6` to `d6`.

## Alternatives Considered

- Use the target corner from the starting position: simpler, but wrong for this witness because the target is intentionally recalculated after White's move.
- Search for a forced Black reply: stronger tactically, but violates the desired pattern-based teaching architecture.
- Recommended: match the post-move target and opposition geometry directly, with no reply search.

## Verification

- The witness uniquely recommends `Kd6` for `shepherd`.
- Every D4 transform recommends the transformed king move.
- A bishop cutoff on the target-corner side does not activate the rule.
- A king move that takes opposition but does not approach the target corner does not satisfy it.
- Focused Two Bishops rules, affected presentation, TypeScript, generated diagrams, and diff checks pass.

