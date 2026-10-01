# Globally optimal r2 bridge to the fixed r1 net

The r2 rule is **“Force Black into the mating net.”** The browser now uses exact source/move lookups, replacing historical r2 destination preferences. The 99 r1 reachable edges are unchanged. Mate, minor-piece safety, and stalemate prevention retain their existing priority above r1/r2; no attribution override was added.

## Result for the 82 completed-r4 starts

Numbers count White moves, against every legal Black reply. The bridge objective stops at the first White-to-move source in the frozen r1 net.

| Metric | Previous routes | Optimal bridge policy |
|---|---:|---:|
| Maximum moves to r1 | 28 | 12 |
| Median moves to r1 | 11 | 8 |
| Mean moves to r1 | 14.00 | 7.85 |
| Maximum moves to mate | 47 | 32 |
| Median moves to mate | 30 | 27 |
| Mean moves to mate | 32.34 | 25.93 |

The twelve-move entry maximum is a global optimum for these starts with this fixed r1 target set. The 32-move mate maximum is a consequence of the chosen bridge and unchanged r1, **not** a claim of optimal distance to mate. Clocks are ignored; these are fresh-clock stage durations, not a new all-start fifty-move certificate.

| Optimal moves to r1 | Starts |
|---:|---:|
| 5 | 10 |
| 6 | 14 |
| 7 | 12 |
| 8 | 18 |
| 9 | 12 |
| 10 | 6 |
| 11 | 6 |
| 12 | 4 |

## Proof and scope

The offline C++ solver enumerates all 10,875,504 legal White-to-move and 13,660,584 legal Black-to-move four-piece placements. It seeds exactly the 792 orientations of the 99 r1 sources at distance zero. A White state gets `1 + min(Black-successor distance)`; a Black state gets `max(White-successor distance)`, only after all replies have finite distances. A capture of a minor or stalemate fails the reachability objective. Checkmate outside r1 is not substituted for reaching the net in this calculation.

Retrograde propagation proceeds in increasing distance. Consequently every assigned rank is both achievable and a lower bound against best resistance. An exhaustive second pass checks the Bellman equations at every legal state, including unreachable states. Separately, chess.js verifies 13,093 deterministic sampled positions against the native distances; every exported edge and Black reply is also checked with chess.js. The full-domain maximum finite entry distance is 20 White moves. Forty theoretically winning White placements cannot force entry to this particular net; all forty have immediate checkmate, which the existing higher-priority mate rule handles.

The browser receives only the optimal-policy closure of the established r2 starts, existing stored sources, and all previous implicit destination-based entries: 16,449 D4-reduced positions, from 6,116 seed classes. It does not receive an all-board r2 oracle. Existing r4/setup rules continue outside that set. Each exported non-net move decreases the guaranteed entry rank after every Black reply. Where a source is fixed by a reflection, all symmetry-equivalent selected moves are kept; ordinary lower rules may break those optimal ties. Existing moves are retained when optimal, otherwise a deterministic optimal move is chosen.

All nine focused stage tests and the application build passed. The wider audit TypeScript project still reports its four pre-existing errors in `verify-piece-preservation.mts` and `worker.mts`; no new errors were introduced.

Runtime checks cover every exported position, all legal Black replies, D4 lookup equivalence, r1 closure and attribution, higher-rule precedence, and termination. The previous all-start duration audit describes the old policy and must not be presented as a distribution for this new policy.

## Reproduction and provenance

- `npm run generate:mate:bridge` from `app/` compiles/runs the full solver when its source/target fingerprint changes and exports the bridge table.
- `npm run check:mate:bridge` regenerates and compares the output, reusing the fingerprinted full-board distance cache.
- `npm run test:mate:stages` verifies the browser policy and the exact bridge ranks.
- Full binary distances are cached under `.audit/optimal-r2.*`; they are not shipped in the browser.
- `scripts/bishop-knight-audit/data/optimal-r2-baseline.json` freezes the pre-change working-tree routes as reproducible entry coverage and tie preferences, including the previously pending r2 shortcuts. Those historical shortcuts no longer govern r2. The original pending files are preserved separately.
- A changed r1 edge set fails the generator/verifier fingerprint checks and requires an explicit new target definition; r1 is never silently enlarged.

[Machine-readable results](audits/2026-09-30-optimal-r2.json) include each starting position and its old/new costs.

[Example longest new table continuation (32 White moves)](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/4N3/3KB3/8/8/8_w_-_-_0_1&moves=Nf3,Kd7,Kd5,Ke7,Ke5,Kd7,Nd2,Ke7,Bd5,Ke8,Ke6,Kf8,Nf3,Kg8,Ne5,Kg7,Ke7,Kh8,Kf7,Kh7,Kf6,Kh8,Ng6%2B,Kh7,Bf7,Kh6,Bg8,Kh5,Ne5,Kh4,Kf5,Kh3,Ng4,Kg2,Bc4,Kf3,Bd3,Kg3,Be4,Kh4,Kf4,Kh5,Bf5,Kh4,Bg6,Kh3,Ne3,Kh4,Ng2%2B,Kh3,Kf3,Kh2,Kf2,Kh3,Bf5%2B,Kh2,Bg4,Kh1,Ne3,Kh2,Nf1%2B,Kh1,Bf3%23&cursor=0).
