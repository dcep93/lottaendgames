# Two Bishops Rule NN

## Goal

Add Rule NN immediately after Rule N:

> If moving a bishop along a wall diagonal, prefer maximum distance from Black's king.

## Qualification and scoring

Use the tightest bishop walls in the position before White moves. A candidate qualifies when it moves one of that wall's bishops along its corresponding wall diagonal and the resulting position preserves the same corner, nearer-diagonal index, and farther-diagonal index.

Rule NN compares only qualifying candidates. Nonqualifying king moves and bishop moves remain untouched for later priorities, so Rule NN does not force a wall-diagonal move.

Among qualifying moves, maximize the moved bishop's squared Euclidean distance from Black's current king square. The other bishop is not included in this distance.

## Integration and verification

Add Rule NN score fields and insert it immediately after Rule N in the active teaching order. Test maximum-distance selection, nonqualifying-candidate preservation, wall preservation, and all rotations and reflections. Run the focused policy suite, build, lint, and validate an h1-oriented loop before loading it at `cursor=0`.
