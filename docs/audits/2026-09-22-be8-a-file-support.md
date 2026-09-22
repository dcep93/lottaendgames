# Be8 support with Nd3 against the a-file

With Be8 and Nd3, Black on the a-file permits five-diagonal support without bishop adjacency or the fixed White-king placement list. All rotations and reflections use the same geometry. Other checks remain in force, including the three-step king-distance limit, king-side requirement, races, boundary containment and bishop attack responses. The unconditional Bc6 exclusion remains intact.

The loaded resulting placement `4B3/8/k7/2K5/8/3N4/8/8 b - - 4 3` is supported, with knight distance two to d5. From Kc5/Ba4/Nd3 against Ka5, Be8 now replaces Bb3 as the best move, breaking the previous dominant witness.

All 212 bishop-and-knight tests and the production build passed. Regression coverage includes the loaded placement, Black on a5/a6/a7, all eight transformations, and rejection with Black off the a-file, a different knight square, distant kings, or Bc6.

The fresh audit's fingerprint below includes the uncommitted rule changes on parent commit 798ddfb. Reachable-loop starts fell from 11,416 to 176; 40 supported placements still lie directly on cycles. The loop gate still fails. No additional preferences were changed.

Loaded [1. Be8 Kd8 2. Bc6 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/1K1N4/8/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Bc6,Kc8&cursor=0), a minimal four-ply witness from a component reachable from 80 supported starts. Every move was verified for two laps using production policy and Black's return history. Replay decoding passed and Redo is enabled. Bc6 remains unsupported; continuations through lost support are included.

## Supported-position continuation audit

Policy commit: `798ddfb83c7cf3eaede618e66c7518d71c01b11e`. Fingerprint: `508a792231244f34892cba10f2b31a13bb861dc79d92ad18037e6f397cb093af`.

The full placement census classified 13,660,584 positions and selected **21,604 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 40 | 0.1852% |
| Not directly on a loop | 21,564 | 99.8148% |
| Can reach a loop | 176 | 0.8147% |
| Cannot reach a loop | 21,428 | 99.1853% |
| Can reach mate | 20,340 | 94.1492% |
| Can reach capture or stalemate | 1,120 | 5.1842% |

4 cyclic components; 3,593 history states and 3,647 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 2 | 80 | [Be8 Kd8 Bc6 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/1K1N4/8/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Bc6,Kc8&cursor=0) |
| 4 | 80 | [Be8 Kd8 Ba4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/3K1N2/B7/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Ba4,Kc7&cursor=0) |
| 1 | 8 | [Ng3 Kg5 Ne4+ Kh4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N1Bk/5K2/8/8_w_-_-_0_1&moves=Ng3,Kg5,Ne4%2B,Kh4&cursor=0) |
| 3 | 8 | [Ba4 Kc7 Bb3 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/4K3/5N2/8/1B6/8/8_w_-_-_0_1&moves=Ba4,Kc7,Bb3,Kd8&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; central king; edge bishop; bishop not king-protected; knight not king-protected | 16 |
| unsupported; interior king; interior bishop; bishop king-protected; knight king-protected | 16 |
| 5-diagonal; interior king; edge bishop; bishop not king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 7-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| unsupported; interior king; interior bishop; bishop king-protected; knight not king-protected | 8 |
