# Bishop and knight stages

The playing policy has three stages: assemble a satisfied-r4 formation with r4 and later rules, reach the r1 net with r2, then finish the net with r1. The temporary r3 proximity heuristic is removed. The r1 entry is White Kc3, Ba2, Nc2, Black Kc1, White to move. The two representative r2 formations are Kd4–Be4–Ne5 and Kd4–Bd5–Ne5, with every legal Black square. Rotations and reflections apply throughout.

## Migration and preservation

Checkpoint `3a82ee1` records the policy before migration. Capture every selected White move (including ties) and every legal Black reply from the r1 entry and all 82 r2 starts. Preserve this snapshot as reviewable migration evidence, including decisions previously supplied by r3 or later rules. Label the entire r1 descendant graph r1; label the remaining routes r2. Retain exact source choices on these established paths. Other positions may select a route by matching a full destination, regardless of which White piece moves. These outside entry moves are r2; only source-to-destination edges reachable from the r1 start qualify for r1. The existing priority framework still applies: immediate checkmate is selected and attributed to mate, above r1. Prefer destinations with a smaller verified worst-case remaining distance. Position identity includes material and side to move, but excludes move counters.

Every admitted destination must have all legal Black replies covered, without a capture, stalemate, or cycle. A decreasing bound proves termination independent of Black's choices. Verify the actual runtime selector, attribution, and all eight symmetries. Do not use search cutoffs, sibling pruning, or omitted losing replies in this certificate.

## Cleanup boundaries

Keep archived declarations available as historical evidence, separate from the compact runtime stage policy. Remove r3 from the guide and selector, and update the r1 illustration to its new start. Keep r4+ behavior changes limited to removing r3 and enabling entry into certified stages. Conservative shared-code cleanup must preserve two-bishop policy and book content; do not alter the curated book JSON or parser for this task.

## Verification scope

Certificates for these finite stage graphs do not prove every arbitrary winning board reaches r2. That requires a separate full-board audit of r4+. Clocks and the fifty-move rule are deliberately outside the stage certificate.

## Implementation and maintenance

- `app/src/mate/rules/bishopKnightStages.ts` is the only runtime r1/r2 selector. It uses full resulting K/B/N/k placements, enforces exact material, and expands all D4 orientations once at initialization.
- `bishopKnightStageData.json` contains source decisions, destination bounds, and a separate `r1Edges` index traced from the r1 start. Exactly 99 source classes and 99 White edges form r1; The remaining 583 recorded source classes are r2. The second column of `sources` is selection priority, not rule attribution. Keeping this priority separate preserves every established choice while correctly labeling outside entries r2.
- `scripts/bishop-knight-audit/data/stage-policy-seed.json` is the immutable migration snapshot. It records choices from checkpoint `3a82ee1`; recapturing it from the new policy is explicitly blocked. Reviewed r2 changes live in `stage-route-improvements.json`; separately approved r1 changes live in `r1-route-improvements.json`. Regenerate and verify before adopting a new route.
- `derive-stage-policy.mts` rejects missing destinations, unsafe replies, and cycles. `npm run check:mate:stages` checks deterministic regeneration. `npm run test:mate:stages` independently checks the actual selector, attribution, all symmetries, external entries via all three White pieces, counters, and material guards.
- Earlier mating-net, cage, and happy-r2 helpers remain as audit evidence. They are not imported by the production policy. Their declaration tests use the explicitly named `historical-policy.mts` adapter; they are not certificates of the new runtime. The current stage tests are the authority for runtime r1/r2 behavior.

The checked certificate covers 82 r2 starts, 672 White position classes, 1,544 Black-reply edges, and 5,376 symmetry checks. It finds no cycles, captures, or stalemates. Worst-case duration is 41 plies from r1 and 95 from the r2 starts. Phase strictly decreases on r2-to-r1 entry; within either phase the captured route bound decreases. Immediate checkmate always wins over a longer route.

To improve r2, preserve the closed r1 graph, make the intended route change explicit in the migration/declaration input, and regenerate. Re-run the full stage certificate against the real runtime. A newer declaration alone is not a reason to outrank an already verified route.

## Migration validation

The final broad mate regression run passed 859 of 898 tests. Its 39 failures were all present in the checkpoint baseline, which had 71 failures among 893 tests; there were no newly failing test cases. These remaining historical rule assertions still need reconciliation, so the broad suite is not a green gate. The five new stage tests pass, including the complete runtime certificate. All 213 two-bishop tests, the book fidelity/navigation/content and strict SAN checks, TypeScript checks, and the production build pass. No curated book content was changed.

## Shortcut rollback

At checkpoint `6fa84b8`, all automatic r2 shortcut replacements were removed at the user’s request, including the five replacements introduced after the 20-cut rollback. That checkpoint restored the original migration seed: 99 r1 source classes and 560 r2 source classes. The improvements list was empty at checkpoint `6fa84b8`. Experimental shortcut search tools and phase-only metric changes were not part of that checkpoint. Earlier experiment artifacts remain locally under `.audit/` for recovery.

## Approved local shortcut

After checkpoint `6fa84b8`, one r2 choice is replaced: with White Kc3, Be4, Nc6 and Black Ka3, select Bb1 instead of Ne5. Black must reply Ka4, reaching an outside entry whose Nd4 move joins the original r1 graph. The earlier 25-to-1 measurement stopped at the old r1 attribution boundary. With strict graph membership, both Bb1 and Nd4 are r2 moves; all later choices remain those of the existing policy. D4 equivalents apply. The required implicit r1 entry is recorded explicitly so regeneration can certify it; its Nd4 choice is unchanged.

Further candidates are ranked by the reduction in worst-case remaining r2 moves **from the candidate source**, with Black maximizing time to existing r1 entry. This local saving is distinct from the maximum across all 82 completed-r4 starts. The approved Bb1 replacement is followed by the five serial replacements below.

## Five serial local reductions

The optimization target is now the original 99-position r1 graph, including its Black-to-move destinations. An outside entry is labeled r2 and is not a zero-cost goal: its move into the graph counts. Costs count White moves, with every selected White tie and every legal Black reply included. Each round re-enumerates currently reachable r2 decisions from all 82 completed-r4 starts and ranks eligible single-edge replacements by local worst-case saving. Replies must continue through the existing verified policy. The original r1 choices are frozen.

| Round | Source FEN | Replacement | Before | After | Saved |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | `8/8/8/8/4B3/k1K2N2/8/8 w - - 0 1` | Ne5 → Bb1 | 26 | 2 | 24 |
| 2 | `8/8/8/8/4B3/2K2N2/8/3k4 w - - 0 1` | Ne5 → Bd3 | 25 | 5 | 20 |
| 3 | `8/8/2N5/8/3KB3/8/8/4k3 w - - 0 1` | Ne5 → Ke3 | 24 | 8 | 16 |
| 4 | `8/8/8/3B4/3N4/3K4/8/5k2 w - - 0 1` | Ke3 → Ne2 | 15 | 2 | 13 |
| 5 | `8/8/8/8/k2KB3/5N2/8/8 w - - 0 1` | Bd5 → Kc4 | 25 | 5 | 20 |

These savings are measured separately at selection time; they are not additive. Each patch is checked before searching the next round. The immutable migration seed and all 99 original r1 choices remain unchanged.

## Exact r1 attribution

Generation traces `r1Edges` from the declared r1 start under every selected White move and legal Black reply. Runtime r1 eligibility requires the complete source-and-destination edge to appear in this index (including D4 equivalents). A matching destination alone never grants r1 attribution. The certificate independently reconstructs reachability and checks both directions of this eligibility equivalence and preserves mate attribution for checkmating moves; outside Nd4 entry regression tests cover the approved Bb1 shortcut. Existing route preferences, all approved shortcuts, and the original r1 moves are preserved.

## Ten further serial local reductions

Starting after the exact-r1 attribution cleanup, ten further rounds used the same local minimax metric and preserved the entire original r1 edge index. Each winner was re-ranked after the previous patch, then verified before continuing.

| Round | Source FEN | Replacement | Before | After | Saved |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | `8/8/8/8/3KB3/k4N2/8/8 w - - 0 1` | Bd5 → Kc3 | 20 | 6 | 14 |
| 2 | `8/8/8/4N3/4B3/2K5/8/2k5 w - - 0 1` | Nc4 → Bd3 | 19 | 6 | 13 |
| 3 | `8/8/8/4N3/3KB3/k7/8/8 w - - 0 1` | Kc3 → Nc6 | 26 | 13 | 13 |
| 4 | `8/8/2N5/8/3KB3/8/8/3k4 w - - 0 1` | Ne5 → Kd3 | 19 | 7 | 12 |
| 5 | `8/8/8/8/5N2/3KB3/8/k7 w - - 0 1` | Kc4 → Kc2 | 17 | 7 | 10 |
| 6 | `8/8/8/8/3B1N2/3K4/8/3k4 w - - 0 1` | Kc3 → Ne2 | 13 | 4 | 9 |
| 7 | `8/k7/8/4N3/3KB3/8/8/8 w - - 0 1` | Bd5 → Kc5 | 24 | 15 | 9 |
| 8 | `8/8/2N5/8/3KB3/8/8/5k2 w - - 0 1` | Ne5 → Ke3 | 24 | 15 | 9 |
| 9 | `8/8/8/3N4/8/3KB3/1k6/8 w - - 0 1` | Nf4 → Bd4+ | 25 | 16 | 9 |
| 10 | `1k6/8/8/4N3/3KB3/8/8/8 w - - 0 1` | Bd5 → Kc5 | 25 | 16 | 9 |

At that point, all 16 approved replacements were recorded in `stage-route-improvements.json`. Source and destination identity remain exact up to D4 symmetry. These per-position worst-case savings are not additive and are not reductions in the global maximum.

## Ten additional serial local reductions

Continuing from those 16 shortcuts, each round re-ranked the largest local worst-case saving among covered single-move r2 changes reachable from the completed-r4 starts. Only route data changed; rule priorities, the selector, the original seed and all 99 r1 choices stayed fixed. All 26 replacements remain uncommitted.

| Round | Source FEN (light bishop) | Replacement | Before | After | Saved |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | `2k5/8/8/4N3/3KB3/8/8/8 w - - 0 1` | Bd5 → Kc5 | 25 | 16 | 9 |
| 2 | `4k3/8/8/4N3/3KB3/8/8/8 w - - 0 1` | Bd5 → Nc6 | 29 | 20 | 9 |
| 3 | `8/8/8/4N3/3KB3/8/k7/8 w - - 0 1` | Nc6 → Kc3 | 13 | 5 | 8 |
| 4 | `8/8/8/4N3/4B3/4K3/7k/8 w - - 0 1` | Kf4 → Kf2 | 14 | 6 | 8 |
| 5 | `8/8/8/k7/3KB3/5N2/8/8 w - - 0 1` | Bd5 → Kc5 | 25 | 13 | 12 |
| 6 | `8/8/8/4N3/3KB3/7k/8/8 w - - 0 1` | Nc4 → Ke3 | 24 | 16 | 8 |
| 7 | `8/8/2N5/8/4B3/4K3/8/6k1 w - - 0 1` | Nd4 → Ne5 | 14 | 7 | 7 |
| 8 | `8/8/8/4N3/3KB3/8/7k/8 w - - 0 1` | Nc4 → Bd5 | 23 | 16 | 7 |
| 9 | `8/4k3/8/8/3KB3/5N2/8/8 w - - 0 1` | Bd5 → Ke5 | 28 | 21 | 7 |
| 10 | `8/8/8/3B4/3N4/5K2/7k/8 w - - 0 1` | Be4 → Be6 | 13 | 7 | 6 |

The full runtime certificate passes 5,376 symmetry checks with no loops or draws. Across all 82 completed-r4 starts, worst-case White moves to r1 (or earlier mate) range from 5 to 29, median 18, mean 16.80. Previously the range was 7–30, median 19, mean 19.27. These are phase-only costs; the 95-ply certificate maximum includes subsequent r1 play to mate.

## Approved r1 shortcut

With White Kf3, Bb3, Nf4 and Black Kh2, select Bc4 instead of Be2 (including D4 equivalents). This single decision reduces the local worst-case continuation from 13 to 9 plies: seven to five White moves. It does not reduce the worst case from the r1 start or the 82 completed-r4 starts.

The immutable seed is unchanged. `r1-route-improvements.json` records this separately approved change after the r2 rounds above, which froze r1 during their searches. The generator retraces r1 edges after applying it; bypassed sources would retain their routes as r2 rather than receive unreachable r1 labels. This change retains 99 reachable source classes and 99 selected edges. Checkmate retains its higher-priority `mate` attribution. Nothing is committed.
