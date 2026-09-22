# Same-colored king requires the knight on current support

When White's king shares the bishop's square color, ordinary diagonal support now requires the knight to occupy an actual support target for that diagonal in the qualifying orientation. Being one knight move away or occupying a previous-stage support square does not suffice. Three-diagonal targets still depend on White's king placement. The check runs after White moves and applies to all rotations and reflections.

Existing explicitly declared support placements return before this new check. In particular, the exact Kd7/Bb5/Nd5 versus Kb7 declaration and Kd5/Ba4/Nd3 versus Kb6 declaration remain supported. Earlier universal exclusions (such as Bc6 and edge knights) still apply; this change does not restore previously removed declarations. Move preferences alone do not declare a position supported. The older restriction on same-color five-bishop/five-knight positions remains in force except for its explicit Kd7 exception.

The loaded `Ba4 Ka5 Bb5 Kb6` shuttle has a same-colored Kc4 and Nb4 off the current d5 support square; both post-White positions are now unsupported. Updated historical support tests to account for this new restriction without adding new exceptions. Tests cover all eight symmetries, previous-stage knights, on-square seven support, and retained explicit declarations.

Validation: all 211 bishop-and-knight rule tests passed. Production build passed. The exhaustive continuation audit below uses every supported post-White placement as a start and follows paths through loss of support.

# Supported-position continuation audit

Policy commit: `c42244dd1bf0d0ff5dc9b3f393269d78036a7a03`. Fingerprint: `10c99876e66e3213bed06b4a36bdde7583cfd55b9528c417409557ea399d091e`.

The full placement census classified 13,660,584 positions and selected **17,728 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 48 | 0.2708% |
| Not directly on a loop | 17,680 | 99.7292% |
| Can reach a loop | 104 | 0.5866% |
| Cannot reach a loop | 17,624 | 99.4134% |
| Can reach mate | 16,824 | 94.9007% |
| Can reach capture or stalemate | 824 | 4.6480% |

3 cyclic components; 2,824 history states and 2,853 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 3 | 64 | [Bh5 Kh4 Bg6 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/4N1B1/8/4K3/6k1/8/8_w_-_-_0_1&moves=Bh5,Kh4,Bg6,Kg3&cursor=0) |
| 1 | 24 | [Ba6 Ka7 Bc8 Kb8](http://localhost:5173/mate/bishop-knight#fen=1kB5/8/8/K2N4/8/8/8/8_w_-_-_0_1&moves=Ba6,Ka7,Bc8,Kb8&cursor=0) |
| 2 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 3-diagonal; edge king; edge bishop; bishop king-protected; knight not king-protected | 8 |
| 3-diagonal; edge king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; central king; edge bishop; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; central king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |

## Comparison and replay

The previous census had 20,980 supported starts, 64 directly on loops and 224 able to reach loops. This census has 17,728 supported starts, 48 directly on loops and 104 able to reach loops. The population changed because this is a stricter support definition; the reduction does not mean all formerly supported starts now terminate. The loop gate still fails for three components. The fingerprint includes this rule change on top of the parent commit shown above.

Loaded the largest component as `8/8/1k6/3K4/8/1B1N4/8/8 w - - 0 1`, `1. Ba4 Ka5 2. Bb3 Kb6`. Two full laps were verified against production best-move sets with Black return history. Replay encoding/decoding passed and the sidebar shows the initial board with Redo enabled. Ba4 remains supported here specifically because of its earlier exact placement declaration.
