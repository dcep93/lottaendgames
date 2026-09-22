# Bd7 with Black on the a-file

With the five-diagonal bishop on d7 and the previous-stage knight on d3, Black's king on the a-file now waives the bishop's adjacency requirement to White's king. Apply all eight symmetries, with orientation fixed by the knight. The other support checks remain, including White being to Black's right, the three-step king-distance limit, same-color/off-support exclusion, applicable king placements and safety/race checks. This follows the user's clarification of why 2. Kc5 should reach the two-files-right target.

In `8/3B4/3K4/k7/8/3N4/8/8 w - - 2 2`, Kc5 now produces supported five-diagonal placement and is uniquely selected by the existing r2.5 preference. No preference or rule ordering changed. Regression coverage includes a5/a6/a7/a8, all reflections, rejection of off-file Black positions without adjacency, same-color White kings, and excessive king distance. Existing explicit support exceptions remain.

All 213 bishop-and-knight tests and the production build passed.

# Supported-position continuation audit

Policy commit: `bfc6a3a2c78e0a2bc5bb3066ff20bb0a0f4dddc0`. Fingerprint: `208ba3cc6e8bdd62306921c52487bf56175d437e4be6f9d5976b47bf0327ecd1`.

The full placement census classified 13,660,584 positions and selected **17,792 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 32 | 0.1799% |
| Not directly on a loop | 17,760 | 99.8201% |
| Can reach a loop | 40 | 0.2248% |
| Cannot reach a loop | 17,752 | 99.7752% |
| Can reach mate | 16,944 | 95.2338% |
| Can reach capture or stalemate | 824 | 4.6313% |

2 cyclic components; 2,837 history states and 2,866 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 24 | [Ba6 Ka7 Bc8 Kb8](http://localhost:5173/mate/bishop-knight#fen=1kB5/8/8/K2N4/8/8/8/8_w_-_-_0_1&moves=Ba6,Ka7,Bc8,Kb8&cursor=0) |
| 2 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 3-diagonal; edge king; edge bishop; bishop king-protected; knight not king-protected | 8 |
| 3-diagonal; edge king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |

## Comparison and loaded witness

Compared with the previous audit, supported starts increase from 17,736 to 17,792, directly cyclic starts decrease from 48 to 32, and starts able to reach a loop fall from 184 to 40. Two cyclic components remain; the loop gate still fails. The fingerprint includes this change on top of the parent commit shown above.

Loaded `1kB5/8/8/K2N4/8/8/8/8 w - - 0 1`, `1. Ba6 Ka7 2. Bc8 Kb8`. Verified two laps against production White and Black best-move sets with return history, checked replay encoding/decoding, and confirmed the initial board and enabled Redo in the sidebar.
