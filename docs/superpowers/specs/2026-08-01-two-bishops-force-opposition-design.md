# Two Bishops Force Opposition Rule

## Goal

Add a visible Phase 2 priority immediately after `sequester` that prefers White moves forcing Black's king to take one-square opposition against White's king.

## Mechanics

- Render: **force opposition** — Phase 2: force Black's king to take opposition against White's king.
- Activate only in Phase 2.
- Evaluate the board after each candidate White move and every legal Black reply.
- A candidate satisfies the rule only when there is at least one legal Black reply and every reply leaves the kings on the same rank or file with exactly one square between them.
- Use all legal Black replies, not only Black's preferred reply.
- Use a binary penalty. If no surviving candidate forces opposition, all candidates tie and the next visible priority decides.
- Derive everything from the current board. The geometry must remain D4-symmetric.

## Rule Order

`force opposition` appears immediately after `sequester` and before `force phase 2`. Universal safety, degenerate repair, the mate pattern, and sequestering therefore remain higher priorities.

## Verification

- Add a focused fixture where exactly one or a small set of White moves forces every Black reply into opposition.
- Assert every recommended move satisfies the all-replies condition.
- Assert a move with only partial opposition fails.
- Check every D4 transform.
- Preserve rule-order/copy alignment, prepared-batch equivalence, statelessness, and symmetry tests.
- Find a current local loop after the policy change.

## Scope

No history, lookahead beyond the immediate legal Black replies already scored, hidden selector, unrelated rule change, full mate suite, exhaustive census, commit, push, deployment, or archive synchronization.
