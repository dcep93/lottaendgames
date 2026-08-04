# Two Bishops Degenerate Diagonal Repair

## Goal

Break the Phase 2 `Be8–Kh6–Bf7–Kh7` loop with a visible, stateless Degenerate repair matching the underlying piece geometry.

## Geometry

In the canonical orientation:

- Black's king is on `h6`.
- White's king is on `f5`.
- One White bishop is on `f6`.
- The other White bishop is anywhere on the `e8–h5` diagonal: `e8`, `f7`, `g6`, or `h5`, when the resulting chess position is legal.

Recognize every rotation and reflection of this arrangement using the existing D4 transforms.

## Repair

When the geometry matches and the move is legal, Degenerate selects the equivalent of `Kf5–e6`. This rule precedes Unmask, so Unmask's general preference for adjacent bishops remains unchanged elsewhere.

## Presentation

Add a Degenerate diagram showing the canonical arrangement, highlighting `e8–h5`, and arrowing `Kf5–e6`.

## Verification

- Assert the original post-`Be8 Kh6` position uniquely recommends `Ke6` for Degenerate.
- Cover every legal placement on the approved diagonal.
- Cover every D4 transform.
- Reject nearby nonmatching geometry.
- Run only focused Two Bishops rule and directly affected presentation tests, targeted TypeScript, and the fail-fast local loop check.

