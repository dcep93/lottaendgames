# Two Bishops Phase 1 Knight-Step Result Control

## Goal

Correct `knight-step control` so it evaluates the bishop control present after
White's move, rather than requiring the moved bishop itself to control the
target square.

In `8/6k1/4K3/8/5B2/5B2/8/8 w - - 4 3`, `Be4` must survive this priority
because the resulting bishop on f4 still controls h6. The later Martian
conclave priority must then select `Be4`.

## Rule semantics

The existing Phase 1 gate and target geometry remain unchanged:

- the kings start a knight's move apart;
- the target is diagonally adjacent to Black's king;
- the target is in two-square orthogonal opposition to White's king; and
- the rule is inactive in Phase 2.

Only bishop moves qualify. After a bishop move, the rule accepts the candidate
when either resulting White bishop has a clear diagonal ray to any target.
King moves remain rejected even when a bishop already controls the target.
The priority remains binary and has no internal tie-break.

## Alternatives considered

Disabling the priority whenever the starting position already has the control
would admit unrelated moves and prevent the rule from preserving its intended
constraint. Adding a special case for a stationary controlling bishop would
duplicate the result-state definition. Testing the resulting bishop set is the
smallest direct implementation.

## Presentation

The visible label, help text, priority order, and exact-position diagram remain
unchanged. The diagram's `Bf4` move is still a valid example of establishing the
required control.

## Verification

Add a regression test for the supplied FEN proving that `Be4` receives zero
knight-step penalty and is selected by Martian conclave. Retain the original
`Bf4` establishment, blocked-ray, Phase 2, translation, and D4 tests. Run the
focused Two Bishops and presentation tests, diagram reproducibility, lint, and
build. Then find a fresh strict Phase 1 loop, treating entry into Phase 2 as
termination, and open the replay on the isolated port 5174 server.
