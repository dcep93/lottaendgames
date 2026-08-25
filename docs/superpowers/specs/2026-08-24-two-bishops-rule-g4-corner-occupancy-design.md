# Two Bishops Rule G4: Avoid Corner Occupancy

## Goal

Keep G4 immediately after G2, but narrow it to prefer bishops not occupying board corners.

## Behavior

Evaluate each candidate after White's move. Count white bishops physically occupying a1, a8, h1, or h8. Fewer occupied corners are better. Bishops adjacent to a corner or otherwise close to one receive no G4 penalty.

G2 continues to decide how many bishops should control long diagonals. G4 then breaks ties by preferring that those bishops control corners from elsewhere rather than sitting on the corner squares.

## Verification

Update focused coverage so a bishop adjacent to a corner ties a bishop two steps away, while a bishop on a corner remains worse. Run the focused Two Bishops tests, production build, and development verifier. Then find and load an exact all-ideal loop at `cursor=0`, with Black nearest h1 when possible.
