# Attacked-piece preferences

Replace r9 with the user's r9.1 and r9.2, ahead of r10. An attack means adjacency to Black's king, measured before White moves, preserving the previous rule's timing.

- r9.1: an attacked bishop maximizes Euclidean distance after White moves unless White's king on d4/e4/d5/e5 already defends it.
- r9.2: an attacked knight prefers being defended after White moves by either White's king or bishop. Defended outcomes tie. Among undefended outcomes, maximize Euclidean distance from Black.

Remove the old two-step trigger and summed escape score. Keep earlier priorities and r10 unchanged. Update modal descriptions and notes. Verify both rules across board symmetries, central-king exemption, pre-move activation, and defense versus escape. Run the Mate tests and build, then verify and load a minimal unsupported best-move loop.
