# Two Bishops Rules Z and B Design

## Goal

Add two Phase 1 priorities around the existing flank-square Rule A.

## Priority order and rendered rules

The relevant order is:

1. **rule z** — Phase 1: When the kings are in opposition, use a bishop to control the inward flank square.
2. **rule a** — Phase 1: When the kings are a knight's move apart, use a bishop to control the flank square. The flank square is the square adjacent to Black's king and also a knight's move from White's king.
3. **rule b** — Phase 1: Prefer bishops further from White's king.
4. **king closer** — unchanged.

## Rule Z geometry

- Rule Z applies only in Phase 1 when the kings are in direct orthogonal opposition with one square between them.
- Candidate flank squares are adjacent to Black's king and a knight's move from White's king.
- The inward flank square is the candidate with the smallest existing board-center distance.
- Prefer bishop moves whose resulting position gives a bishop a clear diagonal line to every tied inward flank square.
- Occupying an inward flank square does not count as controlling it.

## Rule B scoring

- Rule B applies only in Phase 1.
- Score a resulting position by summing each bishop's Chebyshev (king-step) distance from White's resulting king square.
- Prefer the larger sum.
- King moves and bishop moves are compared by the resulting board position alike.

## Verification

- Cover Rule Z with direct opposition, non-opposition, Phase 2, and all D4 board symmetries.
- Cover Rule B with bishop moves, a king move, Phase 2 inactivity, and all D4 board symmetries.
- Verify the exact visible order and rendered English.
- Run the Two Bishops and presentation suites, typecheck, lint, and diagram consistency check.
- Find and open a post-change Phase 1 loop, treating Phase 2 entry as termination.
