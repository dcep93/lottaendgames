# Bc6 always unsupported

A bishop on c6, including every rotation and reflection (c3, f3 and f6), now immediately fails the post-White support classifier. This check precedes all exact support declarations. The four old Bc6 placement exceptions and the occupied d5 king-defense exception were removed, as were their contradictory help notes and Bc6 entries in the Nd3 placement list. Existing move declarations remain subordinate to r1.5; none can restore support.

All 211 bishop-and-knight tests passed, including former support exceptions now rejected in all eight orientations. The production build and diff checks passed. Tests using Bc6 to exercise unrelated preferences were adjusted to preserve those checks with eligible placements or to assert the new rejection.

The audit below follows all tied best continuations through loss of support. Its fingerprint includes the uncommitted classifier change on top of d56293c; two subsequent note wording cleanups do not alter policy. The loop gate fails: reachable loops increase from 32 to 11,416 supported starts. No further preferences were changed to conceal this consequence.

Loaded and verified for two laps against production policy, preserving Black return history: [1. Ba4 Ka5 2. Bb3 Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k7/2K5/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Ka6&cursor=0). This is the dominant component's rotated witness, reachable from 11,280 supported starts. The replay decodes successfully and is loaded with Redo enabled.

## Supported-position continuation audit

Policy commit: `d56293ccb53135747ee61b88730a49c99d2c7372`. Fingerprint: `53f1cb2763ee14343ebb01e9101c17ceb7d471127378addaaf1537fa0d3a18a0`.

The full placement census classified 13,660,584 positions and selected **21,284 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 40 | 0.1879% |
| Not directly on a loop | 21,244 | 99.8121% |
| Can reach a loop | 11,416 | 53.6365% |
| Cannot reach a loop | 9,868 | 46.3635% |
| Can reach mate | 8,884 | 41.7403% |
| Can reach capture or stalemate | 1,112 | 5.2246% |

4 cyclic components; 3,521 history states and 3,575 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 3 | 11,280 | [Bh5 Kh4 Bg6 Kh3](http://localhost:5173/mate/bishop-knight#fen=8/8/4N1B1/8/5K2/7k/8/8_w_-_-_0_1&moves=Bh5,Kh4,Bg6,Kh3&cursor=0) |
| 1 | 80 | [Be8 Kd8 Bc6 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/1K1N4/8/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Bc6,Kc8&cursor=0) |
| 4 | 64 | [Bh5 Kh4 Bg6 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/4N1B1/8/4K3/6k1/8/8_w_-_-_0_1&moves=Bh5,Kh4,Bg6,Kg3&cursor=0) |
| 2 | 8 | [Ng3 Kg5 Ne4+ Kh4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N1Bk/5K2/8/8_w_-_-_0_1&moves=Ng3,Kg5,Ne4%2B,Kh4&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; interior king; edge bishop; bishop not king-protected; knight not king-protected | 16 |
| unsupported; interior king; interior bishop; bishop king-protected; knight king-protected | 16 |
| 5-diagonal; central king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 7-diagonal; central king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| 7-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| unsupported; interior king; interior bishop; bishop king-protected; knight not king-protected | 8 |
