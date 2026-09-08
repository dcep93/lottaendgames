# Two Bishops target square

Continue the existing Find loop in lottaendgames workflow in this task. Implement understood fixes without another design checkpoint, run focused checks, then load the first non-mating witness at cursor 0, preferably a four-ply loop. Preserve existing uncommitted policy work.

Replace r17 with r10, immediately after r8 and before r11: “Prefer fewer diagonals for Black's king, then bishops off the target corner's edge, except the Phase 2 diagonals, then White king's step proximity to the target square.”

For each resulting eligible adjacent-diagonal wall, target candidates are all outer-wall squares minimizing king-step (Chebyshev) distance to Black's king, including every tie. White's location does not affect this candidate set. If any candidate is occupied by a bishop, the entire set for that wall is invalid. Adjacency to Black is not required; never substitute a farther square when a closest candidate is bishop-occupied.

White's king must be strictly outside the wall, opposite Black across its outer diagonal, or on the outer diagonal and strictly closer to a candidate target than Black is, using king-step distance. Apply this eligibility condition after choosing the closest candidate set. A king inside the wall cannot create a target. For White on the outer wall, compare distances separately for each closest candidate; equal distances do not qualify. Occupying a target remains eligible since White’s distance is zero. For target discovery, Black may occupy the inner diagonal. Preserve the minimum diagonal length, four-diagonal enclosure floor, and other rules' enclosure requirements.

Compare complete wall profiles in the requested order: Black's diagonal count, then the existing target-corner edge penalty with its Phase 2 exception, then White's steps to a target. Remove the intermediate Black-to-inner-wall distance preference. Apply the same order both when selecting a wall profile and comparing White moves. Target existence is no longer a separate preference; a smaller enclosure wins even without a target. An inner wall Black can enter on the next move still receives the no-enclosure score. Additionally, when White’s king screens the inner bishop, count the inner diagonal as one of Black’s diagonals if Black can reach any square on it over a legal king path with White’s pieces fixed. Compute this reachability using actual White attacks and occupied squares, with Black’s original square removed so it cannot act as a fixed blocker. Use reachability only to add this screened inner diagonal, without merging the two sides or changing the existing reply-side count. Preserve target and beyond-wall geometry independently of this count eligibility. For eligible walls, count the two sides separately: start with the side containing Black, inspect every legal Black reply, and take the largest individual side count. For eligible walls, include a reachable outer-wall diagonal; an accessible inner wall invalidates the count instead. Landing on a wall is not itself a crossing into the opposite side. Do not merge the sides by flood-filling across a screened bishop. An escape to a larger side increases the count, while a crossing to a smaller side preserves it. Thus Bd8+ allowing Kf4 still counts nine rather than four diagonals; Ke6 allowing Kg8 in the h1-wall example counts eight: seven on the original side plus the reachable outer-wall diagonal.

Move the beyond-wall preference from r18 to r12, immediately after r11 and before r19: “Without a target square, prefer White’s king closer to the diagonal one beyond the outer wall.” It applies only to positions with no valid target but an eligible wall. Measure White's king-step distance to the parallel diagonal one index beyond the outer wall, away from Black's target corner. Use the best resulting wall profiles retained by r10; retain tied profiles and use their minimum beyond-diagonal distance. A usable target, or absence of any eligible wall, leaves r12 inactive.

For `8/7k/8/5K2/8/8/BB6/8 w - - 0 1`, the target corner is h1, outer wall a2–g8, and beyond diagonal a3–f8. Bb3 and Ke6 both have no usable target. Bb3 counts seven diagonals; Ke6 counts eight including the reachable wall diagonal. R12 distances are two and one, respectively, but r10 takes precedence; Bf6 is now selected: Bb1 gains the reachable screened inner diagonal and counts eight, while Bf6 counts seven.

The target definition and diagram precede the Phase 2 note. Use White Ke4, Black Kg3, bishops d1/d2, the outer diagonal c1–h6, and target f4; the arrow from Black to f4 illustrates closest-square selection. Optional zero-based noteIndex associates a diagram with its note without moving unrelated diagrams.

From `3k4/8/8/4B3/5K2/7B/8/8 w - - 0 1`, Ke4 must be uniquely preferred with target c7. Bg4 leaves White on f4, which is not a closest candidate, and therefore has no target. Tests also cover adjacent candidates e3/f4 with Black f3, invalidation when only e3 is bishop-occupied, outside/on-target eligibility, checking escapes, smaller-side crossings, rotations/reflections, all three r10 subpriorities, and r12 activation and ordering.

For `8/8/7k/8/8/4K3/2BB4/8 w - - 0 1`, r10 prefers Bc3 (six diagonals) over Ke4 (nine including a reachable wall diagonal) and Kd4+ (eight diagonals). R12 would prefer Ke4 (one step) over Bc3 (two steps), but diagonal count decides first.

For `8/6k1/3K4/8/8/7B/7B/8 w - - 0 1`, Ke5 reaches the closest target e5, two Black king steps away, and wins the r10 comparison. Ke6 has no target because White is inside the wall and counts six including a reachable screened inner diagonal. Bg3 now wins overall under r10’s edge subpriority by moving the bishop off the corner edge before r10 compares targets.

After `1. Bc3 Kh5` from `8/8/7k/8/8/4K3/2BB4/8 w - - 0 1`, Bd2 allows Kh6 on the screened inner diagonal, invalidating that orientation; its other eligible orientation counts ten diagonals, losing to Kd4’s six.

R6 only credits the Phase 2 diagonals if every legal Black reply remains strictly behind the wall. A reply onto either wall diagonal invalidates confinement. In `8/8/8/8/7k/5K2/2BB4/8 w - - 0 1`, Bd1 allows Kh5 on the screened inner diagonal and must receive no Phase 2 diagonal credit. Keep the inclusive Black-area geometry used for White king path restrictions unchanged.

Add the loaded r4 mating pattern from `8/8/8/k1B5/2BK4/8/8/8 w - - 0 1`: `1. Kc3 Ka4 2. Bb6 Ka3 3. Bb5 Ka2 4. Kc2 Ka3 5. Bc5+ Ka2 6. Bc4+ Ka1 7. Bd4#`. Match the exact piece geometry at each stage under all rotations/reflections. After `4...Ka1`, use `5. Bc5 Ka2` to rejoin the same finish.

Add the exact r4 entry `1. Be7` from `8/2k5/2B5/1KB5/8/8/8/8 w - - 0 1`, under all rotations/reflections. It moves the c5 bishop while preserving the c6 bishop and b5 king; Black may reply Kb8 or Kc8. After either reply, add `2. Kb6` to r4 with the bishops on c6/e7 and White king on b5, under all rotations/reflections.

From `8/8/BB6/8/1K6/8/8/3k4 w - - 0 1`, Ba5 allows Kd2 on the inner wall and gets no diagonal count, while Kc3 keeps the inner wall unreachable and counts five diagonals. Kc5 also counts five and wins the later r12 distance preference.

R22 remains after r19 and before r25. When White's king is on or inside the inner wall of the smallest adjacent-diagonal enclosure, select non-edge inner-wall squares closest to White in straight-line distance, excluding White's occupied square and any candidate closer to Black than to White. Keep exact ties. First place the inner bishop there while retaining the outer bishop. Then minimize White's king-step distance to an adjacent square strictly inside Black's area and farther from Black in straight-line distance than the bishop is. Retain all such king destinations. Use starting-position geometry consistently across candidate moves. No eligible wall or candidate, or White outside, leaves r22 inactive. The revised example selects Be5 from `2k2K2/8/8/8/8/6B1/6B1/8 w - - 0 1`; Bd6 is closer to Black in straight-line distance and is excluded. With Be5 and Black Ke7, f5 is a behind-bishop destination; d4 outside the wall is not. This supersedes the earlier edge endpoint and outside-wall definitions.

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
