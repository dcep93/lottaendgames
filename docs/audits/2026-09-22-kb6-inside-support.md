# Ba6/Kb6 requires Black inside the diagonal

The user clarified the previous unconditional declaration: Ba6 with Kb6 is supported regardless of the knight only while Black is inside the a6–b7–c8 diagonal. Use the existing strict corner-triangle predicate, including all eight symmetries. Black on the wall or outside the triangle does not qualify for this declaration. Other independent support rules remain in place.

The declaration retains the c6/d7 knight targets and bypasses the other support restrictions only after the inside condition passes. Support is still classified after White moves. Exhaustive regression coverage checks every legal Black-king square and every nonoverlapping knight placement across all symmetries; outside positions no longer receive three-diagonal support. The previous loop's 2. Kb6 remains uniquely preferred. The screened five-diagonal regression returns to its prior expected behavior.

## Verification and outcome

All 216 bishop-knight tests and the production build pass. The exhaustive audit scanned all 13,660,584 placements with four workers, following every tied best-move continuation through loss of support. The loop gate still fails because four cyclic components remain.

There are 18,720 supported starts; 48 directly lie on loops (0.2564%) and 64 can reach a loop (0.3419%). The previous overly broad declaration had 960 directly looping starts and 110 components. Before either Ba6/Kb6 change, there were 216 directly looping starts and 26 components. Outcomes are policy-relative, not a forced-mate proof against every legal Black move.

Loaded [1. Na7 Ka8 2. Nb5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/BK6/1N6/8/8/8/8_w_-_-_0_1&moves=Na7,Ka8,Nb5,Kb8&cursor=0), the largest remaining component (32 starts can reach it). Verified two laps against the production best-move policy, including Black return history, replay decoding and enabled browser Redo.

The report fingerprint includes this change; its policy commit is the parent commit.

---

# Supported-position continuation audit

Policy commit: `3a425b3d62a448d64fbff9f475caa406372e69e0`. Fingerprint: `8068a03480c034001b2dd13bb8944759b1b16625baa2e37681dfdd09a7da0e38`.

The full placement census classified 13,660,584 positions and selected **18,720 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 48 | 0.2564% |
| Not directly on a loop | 18,672 | 99.7436% |
| Can reach a loop | 64 | 0.3419% |
| Cannot reach a loop | 18,656 | 99.6581% |
| Can reach mate | 17,808 | 95.1282% |
| Can reach capture or stalemate | 864 | 4.6154% |

4 cyclic components; 3,065 history states and 3,107 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 2 | 32 | [Na7 Ka8 Nb5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/BK6/1N6/8/8/8/8_w_-_-_0_1&moves=Na7,Ka8,Nb5,Kb8&cursor=0) |
| 1 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |
| 3 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/6NB/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 4 | 8 | [Kg4 Kg1 Kf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K1B/5N1k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf3,Kh2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight king-protected | 24 |
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight not king-protected | 8 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
