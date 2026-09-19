# r9: move nearby minor pieces away from Black

The user requests r9: if a piece is within two steps of Black’s king, maximize its distance unless White’s central king defends it.

Interpret “piece” as each bishop and knight. Evaluate eligibility before White moves: Chebyshev distance at most two from Black, excluding pieces protected by White’s king on d4/e4/d5/e5. This preserves credit for moving beyond the trigger range. The timing clarification was offered; proceed with this stated default in the absence of a reply.

Place r9 between r8 and r10. Score the sum of eligible pieces’ Euclidean distances after the move, maximizing it. Other pieces contribute nothing. Earlier mate, safety, support and declared-move rules retain precedence. Update the shared modal description and add an explicit timing/metric note.

Test trigger boundaries, central-king versus other protection, both eligible pieces, movement beyond two steps, and board symmetries. Verify the mate tests and build, then load a minimal unsupported loop chosen by the updated rules.
