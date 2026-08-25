# Two Bishops Rule R7: Unscreen the Bishops

## Goal

Before rule R, prefer White-king positions that do not screen either bishop when the double-diagonal wall has not been built.

## Behavior

Evaluate each candidate after White's move. A double-diagonal wall is a bishop-only geometric structure: one bishop occupies a long corner diagonal and the other occupies a parallel diagonal exactly one step inward. Its existence does not depend on Phase 2, either king's placement, or whether White's king currently screens a bishop. Merely controlling any two adjacent diagonals does not qualify. When this geometric wall is absent, count bishops sharing a diagonal with White's king; fewer screened bishops is better. When this geometric wall is present, R7 is inactive.

R7 compares all candidate moves by their resulting position, so a king move that steps onto a bishop diagonal is disfavored and a bishop move that removes a screen can also improve the score. Rule R continues afterward to prefer White-king proximity to Black.

## Verification

Add regression coverage for a no-wall position where a king move screens a bishop, plus a built-wall position where R7 is inactive. Specifically, f6 and b1 must count as a wall on a1–h8 and b1–h7, allowing `Ke5` through R7 even though the resulting position is not Phase 2. Run the focused Two Bishops tests, production build, and development verifier, then load a verified exact loop at `cursor=0` with Black's nearest corner oriented toward h1 when possible.
