# Two Bishops Rule R7: Unscreen the Bishops

## Goal

Before rule R, prefer White-king positions that do not screen either bishop when the double-diagonal wall has not been built.

## Behavior

Evaluate each candidate after White's move. A valid double-diagonal wall is any wall returned by the existing `getTwoBishopsWalls` geometry. When no such wall exists, count bishops sharing a diagonal with White's king; fewer screened bishops is better. When a wall exists, R7 is inactive because the established wall geometry already validates useful bishop control.

R7 compares all candidate moves by their resulting position, so a king move that steps onto a bishop diagonal is disfavored and a bishop move that removes a screen can also improve the score. Rule R continues afterward to prefer White-king proximity to Black.

## Verification

Add regression coverage for a no-wall position where a king move screens a bishop, plus a built-wall position where R7 is inactive. Run the focused Two Bishops tests, production build, and development verifier, then load a verified exact loop at `cursor=0` with Black's nearest corner oriented toward h1 when possible.
