# Rule V Prospective Matched Bundle

## Scope

Correct Rule V so matched squeeze bundles remain mandatory without requiring both diagonals to be occupied before a matched setup can begin.

## Behavior

Rule V selects its applicable bundle in two tiers:

1. If a bishop already controls a secondary squeeze diagonal, that secondary anchors the bundle. A preferred setup move must use the other bishop to control the matching primary. Other merely reachable secondary diagonals cannot compete. This preserves `Bf5` over `Bb5` in `8/8/3k4/6B1/3K4/3B4/8/8 w - - 0 1`.
2. If no secondary is currently controlled, Rule V may prepare a bundle prospectively. One bishop must be able to reach the secondary in one legal move, while the other bishop's current move controls the matching primary. This activates Rule V in `8/4k3/8/4K3/8/3BB3/8/8 w - - 0 1`.

The primary and secondary roles must use distinct bishops. When a primary is already controlled, the checking branch remains stricter: the other bishop must check from that same bundle's exact secondary diagonal.

## Presentation

Rendered Rule V text remains unchanged because it already describes a secondary reachable in one move followed by control of the primary.

## Verification

Test both supplied positions across all rotations and reflections, retain the existing Rule R/S/U/V suite, run lint and build, then find and open a fresh Phase 1 loop while treating entry into Phase 2 as termination.
