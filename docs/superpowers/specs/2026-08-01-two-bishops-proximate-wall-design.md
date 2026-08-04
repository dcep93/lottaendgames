# Two Bishops Proximate Wall

## Goal

Define one exact proximate bishop-wall geometry shared by Finish Wall, Support Wall, and a new teaching diagram.

## Geometry

A bishop wall consists of two orthogonally adjacent bishops. For either perpendicular side of the wall, Black's king is proximate when it is:

- two squares from the wall and aligned with either bishop; or
- three squares from the wall and longitudinally between one square before the first bishop and one square after the second bishop.

For bishops on `d6/d7`, the right-side zone is `f6`, `f7`, and `g5` through `g8`. The mirrored left-side zone is `b6`, `b7`, and `a5` through `a8`. The definition is translation-invariant and D4-symmetric; squares outside the board are simply absent.

The wall's moat is the rank or file one square beyond the bishop wall toward Black's proximate zone. For the `d6/d7` right-side zone, the moat is the `e`-file; for the left-side zone, it is the `c`-file.

## Rules

Render and order the rules as:

1. **finish wall** — When possible, create the closest proximate bishop wall.
2. **support wall** — When the bishop wall is proximate, bring White's king closer to Black's king, or towards the wall's moat.

Finish Wall precedes Support Wall. It accepts a bishop move when the resulting bishop pair and unchanged Black king form a proximate wall, preferring the wall with the smaller distance to Black. In the supplied position, `Be6` and `Bc6` both survive while the farther `Be7` and `Bc7` do not.

Support Wall applies only when the starting position contains a proximate wall. It accepts a White-king move that reduces either Chebyshev distance to Black's king or orthogonal distance to the wall's moat.

Keep universal priorities and all earlier strategic priorities unchanged.

## Diagram

Add a `proximate bishop wall` note board containing only bishops on `d6/d7`. Highlight all twelve valid Black-king squares as zone squares. Use the caption: “Highlighted squares show where Black's king makes the bishop wall proximate.”

## Verification

- Test the exact twelve-square zone and nearby rejected squares.
- Test translations and all D4 orientations.
- Test that the supplied position recommends exactly `Be6` and `Bc6` for Finish Wall.
- Preserve the existing `Be5` Finish Wall example.
- Test Support Wall against the shared matcher and moat calculation.
- Test rendered order, copy, diagram pieces, and highlights.
- Run focused wall, ordering, symmetry, presentation, diagram-generator, TypeScript, and diff checks only.
- Find and verify a current localhost loop after the policy change.

## Scope

No lookup, history dependency, hidden selector, new visible priority, full mate suite, global SCC census, exhaustive search, unrelated endgame tests, commit, archive synchronization, push, or deployment.
