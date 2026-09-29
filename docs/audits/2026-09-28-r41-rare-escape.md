# r4.1 rare escapes

Visible rule: “Escape rare degenerate positions.” It sits after r4 and before r4.5.

(a) Geometry: White king and bishop are on the edge, orthogonally adjacent. Black is an interior square in direct opposition to the bishop, two squares away. The knight is exactly three diagonal steps from the bishop, in the direction away from White king along the edge. Move the bishop two steps down that diagonal, becoming adjacent to the knight. Both supplied examples are shown as diagrams. This condition generalizes by geometry; it is not a pair of exact FEN exceptions.

(b) Exact Ka1/Bb1/Nd4/Black Kc4 placement: Nf5.

(c) Exact Kf1/Bh1/Nf2/Black Ke3 placement: Ke1.

The exact arrangements ignore move counters and support all eight D4 rotations/reflections, without translations. All preferred escape moves must be legal; the universal priorities and r4 retain their precedence. No audit degeneracy exclusions changed.

Four note-board diagrams were added to the rule help. Nine focused tests passed, including every supplied move across D4, a further instance of the general (a) geometry, near-match rejections, diagram arrows and rule ordering. TypeScript project check passed.

Rechecked only the current 99 known four-ply cycles: 93 survive and 6 are broken. Survivors are 83 fully-satisfied-r4 bishop shuffles, 7 middle-16 king/knight shuffles, 1 other king-protected knight shuffle and 2 opposition/attacked-knight alternations. They remain deferred for ordinary examples. No new-loop search or full audit; no commit or push.
