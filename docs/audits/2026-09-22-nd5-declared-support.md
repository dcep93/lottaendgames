# Declared support and preference for 2. Nd5

The live move log confirms `1. Kb5 Kb8 2. Nd5`, from `8/k7/BN6/2K5/8/8/8/8 w - - 0 1`. The declared result is White Kb5/Ba6/Nd5 versus Black Kb8, before Black replies. The ambient Ka5 position is a later position and does not define this move's result.

Added the exact result to the corner-support exceptions, including all eight symmetries and independent of counters. Support is three-diagonal with knight score 99: the declaration does not create a new target at Kb5. Also prescribed Nb6–d5 from the exact starting placement under r2.5; r1.5 remains higher priority.

Regression coverage checks post-White support, the explicit preference and unique best-move selection for every symmetry with varied counters. Nearby positions with a different Black square, White square or unmoved knight do not receive this exception.

## Verification and outcome

All 219 bishop-knight rule tests and the production build pass. The exhaustive audit scanned 13,660,584 placements with four workers and continued every tied best-move branch through loss of support, stopping only at mate, capture or stalemate.

The loop gate passes: **zero supported starts directly on or able to reach a loop, and zero cyclic components**. There are 19,728 supported post-White starts (eight more than the previous audit). The previous two components and 16 looping starts are eliminated. Capture/stalemate reachability remains 928 starts (4.7040%); 18,816 can reach mate (95.3771%). Outcomes can overlap across branches, so zero loops does not mean forced mate. Black follows the app's policy, not arbitrary legal defense; clocks and repetition claims are excluded.

There is no remaining supported-start loop to load. Instead loaded the corrected current line: [1. Kb5 Kb8 2. Nd5 Ka7 3. Ka5 Kb8 4. Kb6 Ka8 5. Nf6 Kb8 6. Nd7+ Ka8 7. Bb7#](http://localhost:5173/mate/bishop-knight#fen=8/k7/BN6/2K5/8/8/8/8_w_-_-_0_1&moves=Kb5,Kb8,Nd5,Ka7,Ka5,Kb8,Kb6,Ka8,Nf6,Kb8,Nd7%2B,Ka8,Bb7%23&cursor=0). Every move was selected from the production best-move policy with Black return history; the line reaches checkmate without losing post-White support. Replay decoding and enabled browser Redo were verified.

The report identifies the parent commit; the fingerprint includes this commit's production changes.

---

# Supported-position continuation audit

Policy commit: `871d9b3f63ac1a0c01332ceff1e8ee397fb55992`. Fingerprint: `14666e56df3de73648d7c5ad8ebf38ff215da0db20bed818c983b6ae2a9d02b2`.

The full placement census classified 13,660,584 positions and selected **19,728 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 0 | 0.0000% |
| Not directly on a loop | 19,728 | 100.0000% |
| Can reach a loop | 0 | 0.0000% |
| Cannot reach a loop | 19,728 | 100.0000% |
| Can reach mate | 18,816 | 95.3771% |
| Can reach capture or stalemate | 928 | 4.7040% |

0 cyclic components; 3,294 history states and 3,329 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
