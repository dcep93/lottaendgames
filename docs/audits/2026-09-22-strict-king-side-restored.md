# Supported-position continuation audit

Policy implementation: `e5c14d0`. The audit ran those uncommitted rule changes on base `1ca0f19`. Fingerprint: `005615c60d15cc64a86594232a640eab46c6c89a50f585050da7f2a875df655b`.

The full placement census classified 13,660,584 positions and selected **134,144 7-diagonal post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 8 | 0.0060% |
| Not directly on a loop | 134,136 | 99.9940% |
| Can reach a loop | 112 | 0.0835% |
| Cannot reach a loop | 134,032 | 99.9165% |
| Can reach mate | 131,352 | 97.9187% |
| Can reach capture or stalemate | 2,736 | 2.0396% |

2 cyclic components; 21,843 history states and 22,373 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 104 | [Bb4 Kb3 Bc5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2B5/5N2/3K4/1k6/8_w_-_-_0_1&moves=Bb4,Kb3,Bc5,Kb2&cursor=0) |
| 2 | 8 | [Bb5 Kc7 Bd7 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/3BN3/4K3/8/8/8/8/8_w_-_-_0_1&moves=Bb5,Kc7,Bd7,Kd8&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| 7-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 8 |

## Change and comparison

Restored the strict Nd3 king-side condition: White must be to the right of Black; equal files fail. In the loaded Kc5/Bd7/Nd3 versus Kc7 position, Ba4 is unsupported. Bd7 adjacency exemption, Bc6 prohibition, and Bb5-then-Bd7 preferences remain intact. No b4 preference was added.

Compared with the prior audit, loop-reachable seven-diagonal starts remain 112 (two downstream components), while directly-on-loop starts rise from 0 to 8. The largest loop is now Bd7 Kc7 Be6 Kb7, reachable from 104 starts. All paths continue through changes in support. Validation: 210 tests pass, build and deployment passed, and aligned witnesses were verified over three repetitions with Black return history.
