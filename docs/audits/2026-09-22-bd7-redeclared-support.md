# Renewed support after 2. Bd7

The loaded move log is `1. Ba4 Ka5 2. Bd7 Kb6`, starting from `8/8/1k6/3K4/8/1B1N4/8/8 w - - 0 1`. Support is evaluated immediately after White moves, so the declared placement is Kd5/Bd7/Nd3 against Ka5, before Black's Kb6 reply.

This placement was already recorded as a supported-five exception, but the later Nd3 bishop-adjacency requirement rejected it. The user's renewed declaration explicitly waives that adjacency requirement for this exact placement and all eight symmetries. It still obeys the existing universal exclusions and White-king-side requirement. As an explicit declaration, it remains exempt from the newly added same-colored king/off-support-knight restriction. No move preference or rule order changed.

Regression coverage replays the actual two-move line, varies counters, checks all eight symmetries, verifies support and unique best selection of Bd7, and rejects nearby placements including Black's later b6 square. The earlier Kc5 preference still cannot override its unsupported result.

All 212 bishop-and-knight rule tests and the production build passed.

# Supported-position continuation audit

Policy commit: `c9becd7c099e601831f2a416327aef3785d0fcef`. Fingerprint: `80c5e140a1d676e657aca570614d77d10fb3f4b005ebaba894e37e5923c45def`.

The full placement census classified 13,660,584 positions and selected **17,736 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 48 | 0.2706% |
| Not directly on a loop | 17,688 | 99.7294% |
| Can reach a loop | 184 | 1.0374% |
| Cannot reach a loop | 17,552 | 98.9626% |
| Can reach mate | 16,752 | 94.4520% |
| Can reach capture or stalemate | 824 | 4.6459% |

3 cyclic components; 2,825 history states and 2,854 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 3 | 144 | [Kc5 Kd8 Kd5 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/1B1K1N2/8/8/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd5,Kc7&cursor=0) |
| 1 | 24 | [Ba6 Ka7 Bc8 Kb8](http://localhost:5173/mate/bishop-knight#fen=1kB5/8/8/K2N4/8/8/8/8_w_-_-_0_1&moves=Ba6,Ka7,Bc8,Kb8&cursor=0) |
| 2 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 3-diagonal; edge king; edge bishop; bishop king-protected; knight not king-protected | 8 |
| 3-diagonal; edge king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; central king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |

## Comparison and verified replay

The declaration adds eight reflected supported starts (17,728 to 17,736). Direct loop membership remains 48; starts able to reach a loop increase from 104 to 184. Three cyclic components remain, and the loop gate still fails. The fingerprint includes this rule change on top of the parent commit above.

Loaded the largest component reflected across a8–h1: `8/3B4/1k6/3K4/8/3N4/8/8 w - - 0 1`, `1. Kd6 Ka5 2. Kd5 Kb6`. Verified two full laps against production best-move sets with Black return history, checked replay round-trip, and confirmed the initial board with Redo enabled in the sidebar.
