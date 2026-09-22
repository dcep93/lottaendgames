# Supported-position continuation audit

Policy implementation: `e08b985`. The audit started with those uncommitted rule changes on base `bafc0f5`. Fingerprint: `78cdceacf6905a7f98ca4f38880a2ba0cd738247fa5811a6ffc6027c61546094`.

The full placement census classified 13,660,584 positions and selected **134,144 7-diagonal post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 16 | 0.0119% |
| Not directly on a loop | 134,128 | 99.9881% |
| Can reach a loop | 120 | 0.0895% |
| Cannot reach a loop | 134,024 | 99.9105% |
| Can reach mate | 131,344 | 97.9127% |
| Can reach capture or stalemate | 2,736 | 2.0396% |

3 cyclic components; 21,847 history states and 22,377 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 2 | 104 | [Bb4 Kb3 Bc5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2B5/5N2/3K4/1k6/8_w_-_-_0_1&moves=Bb4,Kb3,Bc5,Kb2&cursor=0) |
| 1 | 8 | [Bc6 Kc7 Bd5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/8/2KB4/8/3N4/8/8_w_-_-_0_1&moves=Bc6,Kc7,Bd5,Kb8&cursor=0) |
| 3 | 8 | [Bb5 Kc7 Bd7 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/3BN3/4K3/8/8/8/8/8_w_-_-_0_1&moves=Bb5,Kc7,Bd7,Kd8&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| 7-diagonal; interior king; central bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 8 |

## Change and comparison

With Nd3, Bd7 no longer requires bishop–White king adjacency. Among supported five-diagonal candidates, r2.5 prefers Bb5, then Bd7, then other bishop squares. Other support requirements and r1.5 ordering remain unchanged. The canceled Nd3 b4 king target was not restored.

The previous seven-stage audit found 128,208 loop-reachable starts and 8 directly on a loop. This audit finds 120 loop-reachable starts and 16 directly on a loop. Capture/stalemate-reachable starts remain 2,736. Tests: 208 passing, including all eight symmetries of the requested position. Aligned witnesses verified for three repetitions with Black return history.
