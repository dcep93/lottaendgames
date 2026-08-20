# Prepare Mate from the Corner L

## Design

Replace Prepare Mate's waiting-move behavior. For each corner, its corner region is the three-square L consisting of the corner and its two orthogonally adjacent edge-squares. When Black occupies that region, White's king is a knight's move from the corner, and at least one legal move forces mate within three White moves, Prepare Mate accepts every such forced-mate move and stops later priorities. Once that line reaches its recognized mate-in-two continuation, Prepare Mate remains active even if White's king has moved away from the initial knight square.

Rendered text: "With the black king in the corner 2 squares and the white king a knight's move from the corner, play mate in 3 or less."

## Verification

Require `Bc5+` in the supplied position and all rotations and reflections, preserve recognized mate-in-two continuations, reject positions outside the three-square L, run focused tests, and verify a local loop at `cursor=0`.
