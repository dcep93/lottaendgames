# Two Bishops target square

Continue the existing Find loop in lottaendgames workflow in this task. Implement understood fixes without another design checkpoint, run focused checks, then load the first non-mating witness at cursor 0, preferably a four-ply loop. Preserve existing uncommitted policy work.

Replace r17 with r10, immediately after r8 and before r11: “Prefer fewer diagonals for Black's king, then bishops off the target corner's edge, except the Phase 2 diagonals, then White king's step proximity to the target square.”

Extend r3 (2026-09-08) in its existing ordered place: “Prefer White's king out of the corner, then bishops not adjacent to a cornered White king, then bishops out of the corner.” Compare resulting positions lexicographically by White-king corner occupancy, the number of bishops one king step from a cornered White king (zero when White is not cornered), and the number of bishops on any of a1/a8/h1/h8. Higher rules retain precedence. Verify each priority and all board symmetries, then freshly verify both previous stalemate roots under the changed policy; historical census results do not certify this revision. The initial r3-only recheck compared Kc2 from `8/8/8/3k4/8/8/4B3/2K3B1 w - - 20 11` without changing r10; the subsequent escape correction below supersedes that comparison.

For each resulting eligible adjacent-diagonal wall, target candidates are all outer-wall squares minimizing king-step (Chebyshev) distance to Black's king, including every tie. White's location does not affect this candidate set. If any candidate is occupied by a bishop, the entire set for that wall is invalid. Adjacency to Black is not required; never substitute a farther square when a closest candidate is bishop-occupied.

White's king must be strictly outside the wall, opposite Black across its outer diagonal, or on the outer diagonal and strictly closer to a candidate target than Black is, using king-step distance. Apply this eligibility condition after choosing the closest candidate set. A king inside the wall cannot create a target. For White on the outer wall, compare distances separately for each closest candidate; equal distances do not qualify. Occupying a target remains eligible since White’s distance is zero. For target discovery, Black may occupy the inner diagonal. Preserve the minimum diagonal length, four-diagonal enclosure floor, and other rules' enclosure requirements.

Compare complete wall profiles in the requested order: Black's diagonal count, then the existing target-corner edge penalty with its Phase 2 exception, then White's steps to a target. Remove the intermediate Black-to-inner-wall distance preference. Apply the same order both when selecting a wall profile and comparing White moves. Target existence is no longer a separate preference; a smaller enclosure wins even without a target. An inner wall Black can enter on the next move receives the no-enclosure score. The 2026-09-08 escape correction also gives no enclosure credit if any legal Black reply crosses beyond both walls to the opposite side, whether that side is smaller or larger. This replaces the previous maximum-of-separate-sides count. Thus Bf3+ allowing Kc4 receives no enclosure credit. Bd8+ allowing Kf4 loses credit for that orientation; its other orientation still counts ten diagonals. Preserve target and beyond-wall geometry independently of count eligibility. For a qualifying enclosure, count Black's original side, plus any reachable outer-wall diagonal and any inner diagonal screened by White's king. White must stand on that inner diagonal at least two squares from the nearest board edge to count as a screen; a king on the edge or one square from it does not. Add each wall diagonal once. A reply onto the outer wall remains distinct from crossing beyond it; Ke6 allowing Kg8 in the h1-wall example still counts eight, including that outer-wall diagonal. Do not introduce a flood fill or change actual legal moves.

Add the r4 retreat from `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1`: recognize all four Be8 retreats to d7/c6/b5/a4, preserving White Kf6 and Bh8, under every rotation/reflection. Subsequent rules may choose among those equally credited r4 moves. Verify all four pattern matches, rejection of other geometry, and all policy continuations from both previous stalemate roots. Recheck the user’s second start `8/8/8/3k4/8/8/4B3/2K3B1 w - - 20 11`: Bf3+ must lose its enclosure count because of Kc4, while Kc2 retains eight diagonals. Record the actual selected move and its deciding rule. Run focused policy tests and TypeScript checks; retain historical census and r3-only reports as dated results, and save a fresh recheck report for this revision.

Move the beyond-wall preference from r18 to r12, immediately after r11 and before r19: “Without a target square, prefer White’s king closer to the diagonal one beyond the outer wall.” It applies only to positions with no valid target but an eligible wall. Measure White's king-step distance to the parallel diagonal one index beyond the outer wall, away from Black's target corner. Use the best resulting wall profiles retained by r10; retain tied profiles and use their minimum beyond-diagonal distance. A usable target, or absence of any eligible wall, leaves r12 inactive.

For `8/7k/8/5K2/8/8/BB6/8 w - - 0 1`, the target corner is h1, outer wall a2–g8, and beyond diagonal a3–f8. Bb3 and Ke6 both have no usable target. Bb3 counts seven diagonals; Ke6 counts eight including the reachable wall diagonal. R12 distances are two and one, respectively, but r10 takes precedence; Bf6 is now selected: Bb1 gains the reachable screened inner diagonal and counts eight, while Bf6 counts seven.

The target definition and diagram precede the Phase 2 note. Use White Ke4, Black Kg3, bishops d1/d2, the outer diagonal c1–h6, and target f4; the arrow from Black to f4 illustrates closest-square selection. Optional zero-based noteIndex associates a diagram with its note without moving unrelated diagrams.

From `3k4/8/8/4B3/5K2/7B/8/8 w - - 0 1`, Ke4 must be uniquely preferred with target c7. Bg4 leaves White on f4, which is not a closest candidate, and therefore has no target. Tests also cover adjacent candidates e3/f4 with Black f3, invalidation when only e3 is bishop-occupied, outside/on-target eligibility, checking escapes, smaller-side crossings, rotations/reflections, all three r10 subpriorities, and r12 activation and ordering.

For `8/8/7k/8/8/4K3/2BB4/8 w - - 0 1`, r10 prefers Bc3 (six diagonals) over Ke4 and Kd4+ (ten diagonals each). Their checking wall permits Black to cross beyond both walls, so only their other orientation receives enclosure credit. That orientation has no target and gives Ke4 a beyond-wall distance of three, versus two for Bc3.

For `8/6k1/3K4/8/8/7B/7B/8 w - - 0 1`, Ke5 reaches the closest target e5, two Black king steps away, and wins the r10 comparison. Ke6 has no target because White is inside the wall and counts six including a reachable screened inner diagonal. Bg3 now wins overall under r10’s edge subpriority by moving the bishop off the corner edge before r10 compares targets.

After `1. Bc3 Kh5` from `8/8/7k/8/8/4K3/2BB4/8 w - - 0 1`, Bd2 allows Kh6 on the screened inner diagonal, invalidating that orientation; its other eligible orientation counts ten diagonals, losing to Kd4’s six.

R6 only credits the Phase 2 diagonals if every legal Black reply remains strictly behind the wall. A reply onto either wall diagonal invalidates confinement. The Black-facing inner wall must also have an uninterrupted bishop ray across its full extent, even when Black cannot enter the screened tail on its immediate reply, except that White’s king one square from the board edge is ignored as a ray blocker for this screening check. Keep actual attacks and legal Black replies unchanged. In the Phase 2 template this is the shorter `outerDiagonal`; preserve that template naming. Checking both endpoints detects an intervening king without rejecting a king at an endpoint, where no ray continues beyond it. Screening the farther wall alone does not invalidate the Black-facing barrier. In `8/8/8/8/7k/5K2/2BB4/8 w - - 0 1`, Bd1 allows Kh5 on the screened inner diagonal and must receive no Phase 2 diagonal credit. Keep the inclusive Black-area geometry used for White king path restrictions unchanged.

Add the loaded r4 mating pattern from `8/8/8/k1B5/2BK4/8/8/8 w - - 0 1`: `1. Kc3 Ka4 2. Bb6 Ka3 3. Bb5 Ka2 4. Kc2 Ka3 5. Bc5+ Ka2 6. Bc4+ Ka1 7. Bd4#`. Match the exact piece geometry at each stage under all rotations/reflections. After `4...Ka1`, use `5. Bc5 Ka2` to rejoin the same finish.

Add the exact r4 entry `1. Be7` from `8/2k5/2B5/1KB5/8/8/8/8 w - - 0 1`, under all rotations/reflections. It moves the c5 bishop while preserving the c6 bishop and b5 king; Black may reply Kb8 or Kc8. After either reply, add `2. Kb6` to r4 with the bishops on c6/e7 and White king on b5, under all rotations/reflections.

From `8/8/BB6/8/1K6/8/8/3k4 w - - 0 1`, Ba5 allows Kd2 on the inner wall and gets no diagonal count, while Kc3 keeps the inner wall unreachable and counts five diagonals. Kc5 also counts five and wins the later r12 distance preference.

R22 remains after r19 and before r25. When White's king is on or inside the inner wall of the smallest adjacent-diagonal enclosure, select non-edge inner-wall squares closest to White in straight-line distance, excluding White's occupied square and any candidate closer to Black than to White. Keep exact ties. First place the inner bishop there while retaining the outer bishop on its wall diagonal. Once the inner bishop is placed, the outer bishop may slide along that same wall while White’s king approaches or holds a behind-bishop square; do not require the outer bishop’s original square. Then minimize White's king-step distance to an adjacent square strictly inside Black's area and farther from Black in straight-line distance than the bishop is. Retain all such king destinations. Use starting-position geometry consistently across candidate moves. No eligible wall or candidate, or White outside, leaves r22 inactive. The revised example selects Be5 from `2k2K2/8/8/8/8/6B1/6B1/8 w - - 0 1`; Bd6 is closer to Black in straight-line distance and is excluded. With Be5 and Black Ke7, f5 is a behind-bishop destination; d4 outside the wall is not. This supersedes the earlier edge endpoint and outside-wall definitions.

R4 recognizes corner preparation with White already on the Phase 2 king square and a bishop controlling the third edge square (f7/h6 for h8). A preparation must preserve that control, force Black to the adjacent edge square, and leave a verified mate in two. This admits `Ba4 Kh7 Bc2+ Kh8 Bg7#` from `4BB1k/5K2/8/8/8/8/8/8 w - - 0 1`, and also the preparation `Bd7`, under rotation/reflection. Existing pattern matches retain precedence.

Verification: focused policy suite, relevant guide ordering checks, and TypeScript compilation; then stop at the first usable non-mating witness. No full visual pass or exhaustive content suite is needed.

Self-review: closest-square selection supersedes the previous adjacency requirement. All requested behavior is specified, wall scores remain coherent, and unrelated book content is unaffected.

For `8/8/6B1/4K3/8/4B3/8/3k4 w - - 2 2`, r10 now prefers Kd4 over Bd3: both retain five diagonals, but Kd4 puts White two steps from target c2. Black's distance from the inner wall must not affect either wall selection or move comparison.


Add r11 between r10 and r12: “Play the flank step.” It requires orthogonally adjacent bishops straddling ranks 4–5 on a shared file, or files d–e on a shared rank; White’s king adjacent to both; and the kings aligned perpendicular to the bishop line, exactly three king steps apart, on opposite sides of that line. Evaluate these conditions before White moves. Extend the bishop line one square past the bishop level with White’s king, away from the other bishop, and prefer the legal king move there. In `8/8/8/2B5/k1BK4/8/8/8 w - - 0 1`, this is Kc3. R11 resolves candidates retained by r10; with target proximity restored in r10, Kc3 can already win there. Preserve all eight rotations/reflections and translated placements that satisfy the central-half condition. Otherwise r11 is inactive. Validate the positive pattern, each missing precondition, rule ordering, and the next non-mating witness.


Restore closest outer-wall targets without the Black-adjacency restriction. Keep all tied minimum king-step candidates before occupancy and White-king eligibility checks. In `8/4k3/8/3BB3/3K4/8/8/8 w - - 0 1`, c6 and d5 tie as closest squares on a8–h1. Since d5 is bishop-occupied, that wall still has no target under the existing occupied-candidate rule. Verify distant candidates and ties under all board symmetries, update notes and diagram captions, and retain r11 and r10 ordering.


Combine r9 and r10 into r10, removing the standalone r9. Compare diagonal count first, then the existing bishop corner-edge penalty with its Phase 2 exception, then White’s target distance. Preserve the existing corner-selection geometry for the edge score; this is an ordering change, not a new wall definition. Rename the score and guide diagram consistently.

For `8/1k6/4K3/8/8/B7/B7/8 w - - 0 1`, r10 selects Bb3 instead of Kd5: equal diagonal counts leave edge penalties zero versus one to decide before Kd5’s better target distance.

For `8/4k3/6K1/8/8/8/BB6/8 w - - 2 2`, combined r10 selects Ba3+ with five diagonals and one edge penalty over Bb3 with six diagonals and zero edge penalty.

For `8/6B1/8/8/5K1k/8/2B5/8 w - - 2 2`, Bh6 leaves White Kf4 screening h6 from c1 on the inner wall. Black can reach c1 through h3, g2, f1, e1, d2, c1 with White fixed, so Bh6 counts six rather than five diagonals. The existing target and edge subpriorities still apply after the corrected count.

The Bh6 count fix alone tied r10 on six and left r12 favoring Bh6. The added outer-wall eligibility below now lets Ke5 reach toward f6 under r10 and break that loop.

For `8/6B1/8/8/5K1k/8/2B5/8 w - - 2 2`, Ke5 leaves White on outer wall a1–h8, one step from target f6 versus Black’s two. This now qualifies f6 and lets r10 prefer Ke5 over Bh6. Test equality and greater White distance as rejected cases, and preserve bishop-occupied candidate invalidation before this distance comparison.


Add the r4 retreat `2. Bc1` with White Kc3, Black Ka2, the moving bishop on b2, and the other bishop anywhere on c2–h7 (c2, d3, e4, f5, g6, or h7). Preserve that other bishop and the king; Bc1 forces ...Ka1. Recognize every rotation/reflection, and reject missing king or diagonal geometry.


For `8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1`, Bh5 receives no r6 diagonal credit because White Kf3 screens its d1–h5 wall. This does not depend on an immediate Black escape onto that diagonal. Test all eight symmetries and verify that clearing a screened wall restores credit before bishop-square preferences.


For `8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1`, Bh5 counts five diagonals because White Kf3 screens d1–h5, even though Black cannot reach its hidden tail. Ke4 also counts five and has target f5 one king step away, so r10 uniquely prefers Ke4. The guarded-tail test with White Kd2 and Bh6 counts five under the one-square edge exemption. Verify both cases and the endpoint exception under all eight symmetries.


Exempt White’s king from screening in both r6 and r10 when its minimum distance to a board edge is one square. In `8/8/8/8/1k6/3BB3/3K4/8 w - - 0 1`, Ke2 now retains five Black diagonals, tying Kc2; r12 prefers Ke2 because its beyond-wall distance is one rather than two. Kings at least two squares from the edge, such as f3 screening Bh5, still count as screens. Test all eight symmetries, retain the endpoint exception, and preserve rejection when an actual legal Black reply reaches a wall.


Extend r22 to allow the outer bishop to make room along its existing wall, while retaining the placed inner bishop and scoring the king’s distance to the same starting-position behind squares. From `8/8/8/8/8/3k4/BB6/1K6 w - - 2 2`, Bf7 preserves the b2 inner bishop and holds White Kb1 behind it, so it must beat the retreat Kc1 under r22. Bg8 satisfies the same r22 conditions and wins overall under the existing r30 bishop-distance preference. Moving the outer bishop off its wall, or moving the placed inner bishop away, does not get placement credit. Preserve all eight symmetries and existing inner-bishop-first behavior.


Add r18 between r12 and r19: ‘Play the choke move.’ For the smallest existing adjacent-diagonal wall profiles, if the inner wall has exactly five squares and none touches either edge incident to its target corner, prefer the inner-wall bishop on the board’s long diagonal. Determine eligibility and the target from the starting position, then score whether the result retains or reaches that square. In `4B3/6K1/4k3/8/7B/8/8/8 w - - 0 1`, the inner wall is d8–h4, target corner a1, and long diagonal a1–h8, so prefer h4–f6. Preserve all rotations/reflections. Other wall lengths, walls touching a target-corner edge, and absent walls leave r18 inactive. Add a native guide diagram with the exact pieces, five-square wall, target corner, long diagonal, and h4–f6 move arrow. Keep the earlier target-square note and diagram ordering. Verify rule order, positive and negative geometry, retained placement, diagram rendering, TypeScript, and the next non-mating witness.


Exhaustive audit request (2026-09-08): supersedes the first-witness stopping rule
for this run. Enumerate the entire app-eligible Standard KBBK universe and every
reachable selected-policy continuation, with no root/node cutoff. Report at most
five playable non-mating witnesses, or certify all positions terminate. Count
moves first eliminated by every ordered rule and positions affected, once per
D4-canonical White state. Include universal 100-ply draw checks. Fix measured
semantics-preserving inefficiencies and verify unchanged move scores, choices,
and census counts. Keep a resumable fingerprinted checkpoint, parallelize scoring,
and continue the census after discovering failures. Report remaining performance
or rule-interpretation problems without silently changing policy during the run.
