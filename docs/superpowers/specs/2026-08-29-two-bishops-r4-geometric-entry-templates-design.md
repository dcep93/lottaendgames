# Two Bishops r4 Geometric Entry Templates Design

## Goal

Generalize the recently added r4 entries so they depend on the kings and the requested move destination, not the bishops' starting squares.

Canonical templates:

- White king d8, Black king b7: move a bishop to c5.
- White king d8, Black king b8: move a bishop to c6.
- White king d8, Black king b6: move the king to c8.
- White king a5, Black king b7: move a bishop to b5.

All templates apply under rotation and reflection.

## Design

Replace the exact-FEN r4 entry map with position-derived result matching. For every transformed canonical template whose two king squares match the current position, enumerate legal White moves and accept results whose moved piece has the required type and destination. Bishop locations matter only insofar as a legal bishop move can reach the requested destination.

Cache accepted result keys by the current structural position. Rule r4 activation checks whether this derived result set is nonempty, and r4 scoring accepts exactly those results. The certified mating-kernel map and its audit remain unchanged.

## Verification

Retain the original entry tests and add the supplied `Bb5` template. Test all D4 symmetries, run the focused suite, then run the cached loop search and load a valid loop at cursor 0.
