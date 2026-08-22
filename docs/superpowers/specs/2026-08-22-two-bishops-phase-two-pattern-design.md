# Two Bishops Phase 2 Pattern

## Goal

Replace the active `prepare mate` priority with a deterministic `play mate in 8` pattern. Phase 2 becomes the canonical mating pattern and its rotations and reflections, rather than the existing forced-edge geometry.

## Canonical pattern

The canonical start is:

`8/8/8/8/8/5K2/7k/3BB3 w - - 0 1`

The canonical demonstration line is:

`Bh4 Kh3 Bf6 Kh2 Kf2 Kh3 Be2 Kh2 Bg4 Kh1 Be7 Kh2 Bd6+ Kh1 Bf3#`

The eight White stages are:

1. Play the transformed equivalent of `Bh4`.
2. Play a non-checking bishop waiting move along the transformed `d8-h4` diagonal.
3. Play the transformed equivalent of `Kf2`.
4. Play a non-checking bishop waiting move along the transformed `d1-h5` diagonal.
5. Play the transformed equivalent of `Bg4`.
6. Move a bishop along the transformed `d8-h4` diagonal.
7. Give a bishop check with one legal Black reply, leaving a bishop mate on the next move.
8. Checkmate.

The canonical line supplies the displayed SAN for stages 1, 3, and 5. Stages 2, 4, and 6 accept the stated diagonal move family. Stages 7 and 8 accept the forcing check and mate that complete the pattern.

## Phase 2 classification

Build a finite pattern graph from the canonical start. Generate legal White moves satisfying the current stage predicate and follow only the canonical transformed Black reply at each stage. A position is Phase 2 exactly when its structural position key is a node in this graph under any board rotation or reflection.

This includes the canonical line and legal waiting-move variants. A position reached through a Black alternative that is not represented in the graph is Phase 1 for now. Both White-to-move and Black-to-move nodes on accepted paths are Phase 2.

## White priority

Replace the rendered and active `prepare mate` rule with:

**play mate in 8** — In phase 2 (see diagram).

At a Phase 2 White node, the priority accepts only graph edges that advance the pattern. At Phase 1 nodes, it is inactive. Existing higher correctness priorities (`mate`, piece safety, and stalemate avoidance) remain ahead of it.

## Training Wheels

The Two Bishops Training Wheels start set is the unique rotations and reflections of the canonical starting FEN. Preserve the side to move and normalize move counters.

## Training diagram

Add a looping animation to the `play mate in 8` guide. It uses graphical chess pieces, not letters, and plays the canonical demonstration line. The initial position is visible for three seconds on first display and for three seconds whenever the animation loops. Other plies advance at a short readable interval, and the final mate pauses briefly before restarting.

## Verification

Test the canonical eight-stage line, diagonal waiting-move variants, all rotations and reflections, graph membership for White and Black turns, rejection of unmodeled Black branches, the active rule text and order, Training Wheels seeds, generated animation freshness, and browser rendering. After implementation, independently validate and load a production loop at `cursor=0`.
