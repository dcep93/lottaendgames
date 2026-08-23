# Two Bishops Rule WWW

## Rule

**rule www** — Phase 2: With the White king in non-edge opposition with Black's edge king, move the king back one square from Black.

Rule WWW is evaluated immediately before King Closer.

## Geometry

The rule applies when the current position is Phase 2, Black's king is on an edge, White's king is not on an edge, and the kings share a rank or file with exactly one square between them.

The preferred move is the legal White king move one square directly away from Black along the kings' shared axis. In the supplied orientation, White moves `Kf3-e3` while Black is on `h3`.

The implementation derives the direction from the king coordinates so translations, rotations, and reflections use the same rule.

## Verification

- Prove `Ke3` is uniquely selected in the supplied position.
- Test all rotations and reflections.
- Reject edge White kings, non-edge Black kings, non-opposition king geometry, and positions outside Phase 2.
- Run focused Two Bishops tests and the loop verifier.
- Load a verifier-produced loop at `cursor=0` and provide its link.
