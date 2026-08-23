# Two Bishops Rule W2 Inner-Wall Retreat

## Goal

Reorder the Phase 2 wall priorities and add:

> **rule w2** — Phase 2: With the kings in opposition, move the inner wall bishop to the square furthest from Black along inner wall.

The relevant order is `rule w1`, `rule w2`, then `rule ww`.

## Wall Selection

Use the tightest functional Phase 2 wall containing Black. This excludes looser complementary interpretations of the same bishop pair. The inner wall is the qualifying wall diagonal nearer its corner; the inner-wall bishop is the bishop controlling that diagonal.

## Rule W2

Rule W2 applies only when:

- the starting position is Phase 2;
- the kings are in opposition; and
- a legal move by the current inner-wall bishop can remain on the same inner-wall diagonal while preserving the same functional wall.

Only those preserving bishop moves qualify. Compare their resulting bishop squares by squared Euclidean distance from Black's king and prefer the maximum. Ties remain available to later priorities.

Rule W2 evaluates the resulting position so a White-king screen or any other loss of the functional wall disqualifies the move.

## Priority Order

Move Rule W1 from immediately before `king closer` to immediately before Rule W2. Place Rule W2 immediately before Rule WW. Existing higher priorities remain unchanged.

## Verification

- Verify the rendered and active priority order is Rule W1, Rule W2, Rule WW.
- Verify Rule W2 does not apply outside Phase 2 or without king opposition.
- Verify only the current inner-wall bishop may move and it remains on the same diagonal.
- Verify a move that loses the functional wall is rejected.
- Verify the farthest safe destination from Black is preferred.
- Verify rotations and reflections preserve the decision.
- Run the focused policy tests, build, lint, and diff checks.
- Generate, validate, and load a fresh loop at `cursor=0`, identifying every White rule and whether each Black reply is ideal or merely legal.
