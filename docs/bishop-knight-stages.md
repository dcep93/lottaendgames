# Bishop and knight stages

The playing policy has three stages: assemble a satisfied-r4 formation with r4 and later rules, reach the r1 net with r2, then finish the net with r1. The temporary r3 proximity heuristic is removed. The r1 entry is White Kc3, Ba2, Nc2, Black Kc1, White to move. The two representative r2 formations are Kd4–Be4–Ne5 and Kd4–Bd5–Ne5, with every legal Black square. Rotations and reflections apply throughout.

## Migration and preservation

Checkpoint `3a82ee1` records the policy before migration. Capture every selected White move (including ties) and every legal Black reply from the r1 entry and all 82 r2 starts. Preserve this snapshot as reviewable migration evidence, including decisions previously supplied by r3 or later rules. Label the entire r1 descendant graph r1; label the remaining routes r2. Retain exact source choices on these established paths. Other positions may enter either stage by matching a full destination, regardless of which White piece moves. Prefer destinations with a smaller verified worst-case remaining distance. Position identity includes material and side to move, but excludes move counters.

Every admitted destination must have all legal Black replies covered, without a capture, stalemate, or cycle. A decreasing bound proves termination independent of Black's choices. Verify the actual runtime selector, attribution, and all eight symmetries. Do not use search cutoffs, sibling pruning, or omitted losing replies in this certificate.

## Cleanup boundaries

Keep archived declarations available as historical evidence, separate from the compact runtime stage policy. Remove r3 from the guide and selector, and update the r1 illustration to its new start. Keep r4+ behavior changes limited to removing r3 and enabling entry into certified stages. Conservative shared-code cleanup must preserve two-bishop policy and book content; do not alter the curated book JSON or parser for this task.

## Verification scope

Certificates for these finite stage graphs do not prove every arbitrary winning board reaches r2. That requires a separate full-board audit of r4+. Clocks and the fifty-move rule are deliberately outside the stage certificate.

## Implementation and maintenance

- `app/src/mate/rules/bishopKnightStages.ts` is the only runtime r1/r2 selector. It uses full resulting K/B/N/k placements, enforces exact material, and expands all D4 orientations once at initialization.
- `bishopKnightStageData.json` contains source decisions and destination bounds. The 99 r1 source classes are closed under all Black replies. The remaining 560 source classes form r2; matching an r1 arrival may enter the net earlier. Within a known source, captured choices retain precedence over alternative destinations in that same stage.
- `scripts/bishop-knight-audit/data/stage-policy-seed.json` is the immutable migration snapshot. It records choices from checkpoint `3a82ee1`; recapturing it from the new policy is explicitly blocked. Edit/extend a reviewed copy of the declarations deliberately, then regenerate and verify before adopting a new route.
- `derive-stage-policy.mts` rejects missing destinations, unsafe replies, and cycles. `npm run check:mate:stages` checks deterministic regeneration. `npm run test:mate:stages` independently checks the actual selector, attribution, all symmetries, external entries via all three White pieces, counters, and material guards.
- Earlier mating-net, cage, and happy-r2 helpers remain as audit evidence. They are not imported by the production policy. Their declaration tests use the explicitly named `historical-policy.mts` adapter; they are not certificates of the new runtime. The current stage tests are the authority for runtime r1/r2 behavior.

The checked certificate covers 82 r2 starts, 659 White position classes, 1,546 Black-reply edges, and 5,272 symmetry checks. It finds no cycles, captures, or stalemates. Worst-case duration is 41 plies from r1 and 105 from the r2 starts. Phase strictly decreases on r2-to-r1 entry; within either phase the captured route bound decreases. Immediate checkmate always wins over a longer route.

To improve r2, preserve the closed r1 graph, make the intended route change explicit in the migration/declaration input, and regenerate. Re-run the full stage certificate against the real runtime. A newer declaration alone is not a reason to outrank an already verified route.

## Migration validation

The final broad mate regression run passed 859 of 898 tests. Its 39 failures were all present in the checkpoint baseline, which had 71 failures among 893 tests; there were no newly failing test cases. These remaining historical rule assertions still need reconciliation, so the broad suite is not a green gate. The five new stage tests pass, including the complete runtime certificate. All 213 two-bishop tests, the book fidelity/navigation/content and strict SAN checks, TypeScript checks, and the production build pass. No curated book content was changed.

## Shortcut rollback

All automatic r2 shortcut replacements have been removed at the user’s request, including the five replacements introduced after the 20-cut rollback. The active policy is restored to the original migration seed: 99 r1 source classes and 560 r2 source classes. The improvements list is empty. Experimental shortcut search tools and phase-only metric changes are not part of this checkpoint. Earlier experiment artifacts remain locally under `.audit/` for recovery.
