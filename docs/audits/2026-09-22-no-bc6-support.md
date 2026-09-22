# Supported-position continuation audit

Policy implementation: `bc62ed8`. The audit ran those uncommitted rule changes on base `418cd73`. Fingerprint: `c9ba936c7711c4761092d5461e33c5767cea648a10df29d08696a162165718ff`.

The full placement census classified 13,660,584 positions and selected **134,144 7-diagonal post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 0 | 0.0000% |
| Not directly on a loop | 134,144 | 100.0000% |
| Can reach a loop | 112 | 0.0835% |
| Cannot reach a loop | 134,032 | 99.9165% |
| Can reach mate | 131,352 | 97.9187% |
| Can reach capture or stalemate | 2,736 | 2.0396% |

2 cyclic components; 21,846 history states and 22,376 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 104 | [Ba4 Kb7 Bd7 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2kB4/8/2K5/8/3N4/8/8_w_-_-_0_1&moves=Ba4,Kb7,Bd7,Kc7&cursor=0) |
| 2 | 8 | [Bb5 Kc7 Bd7 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/3BN3/4K3/8/8/8/8/8_w_-_-_0_1&moves=Bb5,Kc7,Bd7,Kd8&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; interior king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 8 |

## Change and comparison

Bc6 and all reflected placements are unconditionally unsupported, checked before older support declarations and independently of the kings or knight. Other support requirements and preferences remain unchanged. The canceled b4 preference remains absent.

Loop-reachable seven-diagonal starts fell from 320 to 112 (0.0835% of 134,144 starts), across two downstream cyclic components rather than three. No seven-diagonal starts lie directly on a loop. Capture/stalemate reachability remains 2,736 starts. The largest remaining loop is Ba4 Kb7 Bd7 Kc7, reachable from 104 starts.

Validation: 209 existing tests plus a new regression covering every available knight square in four historical Bc6 placements across all eight transforms; build passed. Both aligned minimal loops verified over three repetitions, including Black return history.
