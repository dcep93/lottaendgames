# Queen Box Side Ordering Design

## Goal

Make the Queen box-size priority prefer the narrowest board-edge rectangle around Black before considering its other dimension. The supplied position must select `Qg4`, and the changed Queen policy must remain free of loops under exhaustive verification.

## Rule

For each candidate White move, construct the existing board-edge rectangle bounded by the Queen's rank and file and containing Black's king. Sort its two side lengths, then compare candidates lexicographically:

1. Minimize the shorter side length.
2. If tied, minimize the longer side length.

This replaces area as the Queen box score. It does not change how the rectangle is constructed or the ordering of any other Queen priority. Sorting the dimensions preserves rotation and reflection symmetry.

The rendered explanation will say: “Minimize the shorter side of the board-edge rectangle bounded by the Queen's rank and file containing Black's king, then minimize its longer side.”

## Regression

For `8/8/3K4/5Q2/8/4k3/8/8 w - - 14 8`, the ideal White move must be `Qg4`.

Focused tests will cover the geometry dimensions, lexicographic comparison, the rendered rule text, and the supplied position.

## Exhaustive safety proof

After the change, run the Queen verifier both with symmetry reduction and with identity-only state keys. Every tied optimal White move and every legal Black response must terminate without revisiting a position. Also derive the independent identity-keyed policy rank; a complete finite ranking independently proves that the resulting policy graph is acyclic.

The full test suite, lint, build, and a local browser check of the supplied URL complete validation.
