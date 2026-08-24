# Two Bishops Rule W2 King Distance Design

## Goal

Add **rule w2** immediately before **rule w3** in the active Two Bishops policy. Rule W2 prefers White's king closer to Black's king using Euclidean distance.

## Behavior

- Evaluate every legal White move from its resulting position.
- Measure the squared Euclidean distance between the resulting White-king square and Black's king.
- Prefer the smaller value. Squared distance preserves exactly the same ordering as Euclidean distance while avoiding a square root.
- Bishop moves leave the distance unchanged, so a legal king move wins only when it produces a smaller distance than the surviving alternatives.
- Apply Rule W2 in both phases because the requested text has no phase restriction.
- Keep the active priority order `rule n`, `rule o`, `rule w2`, `rule w3`, `rule w`.

## Presentation

Training Info shows **rule w2 — Prefer White's king closer to Black's king.** immediately before Rule W3. No diagram is added.

## Verification

- Assert the active rule order and exact help text.
- Assert squared Euclidean ordering on a position with distinct legal king distances.
- Run the focused Two Bishops policy and geometry tests, build, lint, and diff checks.
- Generate and independently validate a repeating loop, orient it toward h1, and load it at `cursor=0`.
