# Two Bishops Rule d7 and d18 Design

## Goal

Add a global preference for retaining at least one bishop on a long diagonal and clarify that rule d18 applies specifically to White's king.

## Behavior

- Rule d7 is evaluated after White's candidate move.
- Rule d7 scores a move best when either bishop occupies `a1-h8` or `a8-h1`.
- Rule d7 is ordered immediately before rule d10.
- Rule d18 remains ordered after rule d10 and scores a move worse when White's king occupies a long diagonal controlled by either bishop.
- The displayed rule d18 text is: “Prefer the king not occupying a controlled long diagonal.”

## Verification

Add focused score and ordering assertions for d7, retain the existing d18 geometry regression, run the focused policy tests, and replay a structural loop with unique ideal moves.
