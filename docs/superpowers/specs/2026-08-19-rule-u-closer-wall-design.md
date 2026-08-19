# Rule U Closer-Wall Opposition

## Rule

Render Rule U as:

> When the kings are a knight's move apart, a bishop controls the secondary squeeze diagonal, and a bishop can move to control the primary squeeze diagonal, take opposition towards the closer wall.

## Behavior

Rule U credits an opposition-taking king move only when its one-square step heads toward the nearer board edge on the move's file or rank axis. Determine the nearer edge from White's starting king square, before White moves.

This is an eligibility condition, not a tiebreak. If the only prepared opposition move heads toward the farther wall, Rule U has no preferred move and later rules decide.

In `8/4B3/8/4k2B/2K5/8/8/8 w - - 0 1`, rank 1 is closer to the White king on c4 than rank 8. Therefore `Kc5` must not satisfy Rule U. Apply the behavior under rotations and reflections and in both phases.

## Alternatives Rejected

- Scoring both wall directions would continue to label a farther-wall move as satisfying Rule U.
- Inferring the wall from a squeeze diagonal is less direct than the king step named by the rule and misreads this supplied position.
