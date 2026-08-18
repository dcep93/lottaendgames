# Rule Y: Retreat the Threatened Bishop

## Design

Replace Rule Y with: “If an undefended bishop can be attacked on the next move, retreat it along a diagonal that does not separate the kings.”

Retain the legal-next-move threat detector. A successful candidate moves the threatened bishop itself, increases its Chebyshev distance from Black's king, and leaves no legal Black reply capturing or becoming adjacent to it.

Determine the movement diagonal from the move's invariant projection (`file - rank` or `file + rank`). It separates the kings only when their projections lie strictly on opposite sides of that line. A king on the line does not count as separated.

For the supplied position, `c3-f6` keeps both kings on the same side of the difference-0 diagonal, while `c3-b4` puts the kings on opposite sides of the sum-4 diagonal.

## Verification

Assert `Bf6` satisfies Rule Y, `Bb4` fails specifically on diagonal separation, and the result is invariant under rotations and reflections.
