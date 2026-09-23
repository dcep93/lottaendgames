# Edge kings are exempt from same-color support restrictions

User clarification: sharing the bishop's color is acceptable if White's king is on the board edge.

Both support-color guards now apply only to interior White kings: the general off-current-support guard and the five-bishop/five-knight same-color guard. This is a color exemption only; all independent geometry, race, king-distance, knight-edge and declared-placement checks remain in force. Symmetry follows the existing board-edge predicate.

From Kd8/Bd7/Nd3 versus Kb6, 2. Kc8 now produces a supported five-diagonal and is uniquely preferred by the existing rules. Regression coverage checks this result and selection under all eight symmetries and varied counters, an edge king with an actual five-support knight, and an edge knight that remains disqualified. Two earlier tests now incorporate the edge-color exemption.

## Verification and outcome

All 218 bishop-knight rule tests and the production build pass. The exhaustive four-worker audit scanned all 13,660,584 placements, following all tied best-move continuations through loss of support.

Supported starts increased from 18,760 to 19,720. Directly looping and loop-reachable starts both fell from 32 to 16 (0.0811% of supported starts). Cyclic components fell from three to two. Capture/stalemate reachability increased from 872 to 928. These are policy-relative outcomes, not a forced-mate proof against all legal Black defenses.

Loaded [1. Kb5 Kb8 2. Kc5 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/BN6/2K5/8/8/8/8_w_-_-_0_1&moves=Kb5,Kb8,Kc5,Ka7&cursor=0), with Ba6/Nb6/Kc5 versus Ka7. This is one of the two remaining components, each reachable from eight supported starts. Verified two complete laps against the production best-move policy with Black return history, successful replay decoding, and enabled browser Redo.

The loop gate remains failing because two components remain. The report identifies the parent commit; its fingerprint includes the production changes in this commit.

---

# Supported-position continuation audit

Policy commit: `29fcf017be6e7c2f9448813ebbb38b4d7e189316`. Fingerprint: `98f7c05144b6a37dc73e770e21e296b9d3996f29338a82ac24a9f6eb8e0c1707`.

The full placement census classified 13,660,584 positions and selected **19,720 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 16 | 0.0811% |
| Not directly on a loop | 19,704 | 99.9189% |
| Can reach a loop | 16 | 0.0811% |
| Cannot reach a loop | 19,704 | 99.9189% |
| Can reach mate | 18,792 | 95.2941% |
| Can reach capture or stalemate | 928 | 4.7059% |

2 cyclic components; 3,294 history states and 3,329 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/6NB/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 2 | 8 | [Kg4 Kg1 Kf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K1B/5N1k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf3,Kh2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight king-protected | 8 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight not king-protected | 8 |
