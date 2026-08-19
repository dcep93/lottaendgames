# Prepare Mate Bishop-Distance Tiebreak

## Scope

Keep the existing `prepare mate` eligibility and rendered rule text unchanged.

Among moves that qualify as prepare-mate bishop waiting moves, prefer the move that maximizes the sum of both bishops' king-step distances from Black's king. Apply the tiebreak before `prepare mate` stops rule evaluation.

For `8/8/2B5/2B5/8/8/2K5/k7 w - - 20 11`, `Bf8` must be the unique ideal move. The behavior must remain invariant under board rotations and reflections.

## Assumption

“Bishop distance” means the existing summed king-step distance metric for both bishops.
