# Supported-position continuation audit

Policy implementation: `dbf1ad4`. The audit ran the uncommitted policy changes on base `41ecf80`. Fingerprint: `d384c295c28c576b6dbc357b005542eb676bf3daab0b89ba58ebaadb38450397`.

The full placement census classified 13,660,584 positions and selected **134,144 7-diagonal post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 0 | 0.0000% |
| Not directly on a loop | 134,144 | 100.0000% |
| Can reach a loop | 320 | 0.2385% |
| Cannot reach a loop | 133,824 | 99.7615% |
| Can reach mate | 131,152 | 97.7696% |
| Can reach capture or stalemate | 2,736 | 2.0396% |

3 cyclic components; 21,852 history states and 22,382 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 200 | [Ke3 Kh4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NK4/5Bk1/8/8_w_-_-_0_1&moves=Ke3,Kh4,Kd4,Kg3&cursor=0) |
| 2 | 112 | [Ba4 Kb7 Bd7 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2kB4/8/2K5/8/3N4/8/8_w_-_-_0_1&moves=Ba4,Kb7,Bd7,Kc7&cursor=0) |
| 3 | 8 | [Bb5 Kc7 Bd7 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/3BN3/4K3/8/8/8/8/8_w_-_-_0_1&moves=Bb5,Kc7,Bd7,Kd8&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; interior king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| unsupported; central king; interior bishop; bishop not king-protected; knight king-protected | 8 |

## Change and comparison

Nd3 five-diagonal support now permits White’s king on the same file as Black’s king, while retaining the rejection for White to the left and all other support checks. In the loaded Kc5/Bd7/Nd3 against Kc7 position, Ba4 is supported and uniquely preferred; Bb5 still fails other support requirements. The canceled b4 preference remains absent.

Compared with the previous audit: directly-on-loop seven-diagonal starts fell from 16 to 0, but loop-reachable starts increased from 120 to 320. Three downstream cyclic components remain, including smaller-diagonal and unsupported placements. The largest component is reachable from 200 selected starts. Build passed; all 209 test cases pass across the full run and corrected targeted rerun. Aligned minimal witnesses verified over three repetitions.
