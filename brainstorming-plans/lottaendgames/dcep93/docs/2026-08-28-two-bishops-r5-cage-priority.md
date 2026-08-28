# Two Bishops r5 Cage Priority Plan

1. Add a cage-presence penalty to the r5 score.
2. Evaluate cage geometry and its nearer-edge target from each candidate result.
3. Compare r5 lexicographically: cage presence first, king distance second.
4. Update the exact help text and focused create, preserve, reject, and symmetry tests.
5. Run the focused checks, search exhaustively until the first loop, orient it with Black closest to a7, and load it at cursor 0.
