# Support for the checking Bb7 placement

User declaration: 2. Bb7+ is supported because White's king is on b6, the move checks, and the knight is one move from its support square.

Recognize Kb6/Bb7 versus Ka8, including all eight symmetries, when the knight is within one move of an available current three-diagonal target (c6/d7 in this orientation). This check-specific declaration precedes the edge-knight restriction. It leaves r1 unchanged: its requirement that the resulting check be supported is now satisfied. Other placements retain their existing support classification.

Regression coverage verifies the loaded 1. Na7 Ka8 2. Bb7+ position and every symmetry with varied move counters. Na7 is one move from c6; Bb7+ receives r1 score zero and is uniquely preferred over Nb5. Negative cases cover a remote knight, a nonchecking bishop, and a different White-king placement.

## Verification and outcome

All 217 bishop-knight rule tests pass and the production build passes. The exhaustive four-worker audit scanned 13,660,584 placements, following all tied best moves through any loss of support.

Compared with the previous audit, supported starts increased from 18,720 to 18,760; directly looping starts fell from 48 to 32 (0.1706%), and loop-reachable starts fell from 64 to 32. Cyclic components fell from four to three. Capture/stalemate reachability increased from 864 to 872. Outcomes remain policy-relative and may overlap between branches; this does not establish forced mate against every legal defense.

Loaded the largest remaining component, normalized with a light bishop nearer a8: [1. Bd7 Kb6 2. Be6 Kb7](http://localhost:5173/mate/bishop-knight#fen=3K4/1k6/4B3/8/8/3N4/8/8_w_-_-_0_1&moves=Bd7,Kb6,Be6,Kb7&cursor=0). Verified every move over two laps against the production policy with Black return history, successful replay decoding, and enabled Redo in the browser.

The loop gate still fails because three components remain. The report lists the parent commit; its fingerprint includes this commit's production changes.

---

# Supported-position continuation audit

Policy commit: `45403209c51062e5642967ba0afeadfb40c6947d`. Fingerprint: `2c334d7cfcfc090ae83818eda4736815dc5cc81fdc5a4b9629c9fdd4bb5fa8d4`.

The full placement census classified 13,660,584 positions and selected **18,760 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 32 | 0.1706% |
| Not directly on a loop | 18,728 | 99.8294% |
| Can reach a loop | 32 | 0.1706% |
| Cannot reach a loop | 18,728 | 99.8294% |
| Can reach mate | 17,872 | 95.2665% |
| Can reach capture or stalemate | 872 | 4.6482% |

3 cyclic components; 3,069 history states and 3,103 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |
| 2 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/6NB/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 3 | 8 | [Kg4 Kg1 Kf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K1B/5N1k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf3,Kh2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight king-protected | 8 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight not king-protected | 8 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
