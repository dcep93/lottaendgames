# R4.1: avoid entering another escape decision

## Current implementation: generated return closure

The return check now uses `bishopKnightRareReturnData.json`, a generated table of **seven D4-reduced excluded edges**. These are ordinary r4.1 penalties, not move removals or higher-priority exceptions. The original escape declarations, base reply guard, displayed rule text and priority order remain unchanged.

The generator evaluates the complete current policy. If r4.1 changes the next-turn choice to the unique reversal of a selected White move, and Black can legally undo its reply, it adds that White edge to the exclusions. It keeps those exclusions, recomputes the affected decisions, and repeats against the resulting policy. Two passes add exclusions; the third finds no further additions and no four-ply policy cycles. This catches returns created by the previous pass instead of probing a deliberately incomplete policy. The browser uses the compiled table; it does not perform recursive closure searches.

In the reported `Nb4+ Kc3 Na6 Kc2` position, **Nb4+ is rejected by r4.1** and **Bd5** is preferred. The earlier Nd2+ rejection and every declared escape remain intact across D4.

### Reproduction and verification

Run `app/node_modules/.bin/tsx scripts/bishop-knight-audit/derive-rare-returns.mts BASE_CACHE OUTPUT_CACHE`. `BASE_CACHE` must be a verified complete graph for the same policy with the generated return exclusions empty; the output directory must be new. For this run, the baseline was `.audit/all-legal-after-r42-pieces-safe`. The generator records every round and witness, checks 1,352 unaffected decisions, and writes the runtime table only after convergence. Regenerate and re-audit when the underlying policy changes; a cache from a different policy is not a valid baseline.

The dependency-closed update refreshes eight distinct canonical sources across the rounds. A full distance recomputation and SCC check over **1,359,578 legal canonical White positions**, including all selected White ties and every legal Black reply, finds **zero cycles and zero lost wins from theoretically winning starts**. The remaining 24 previously looping winning White starts now converge. The result also covers Black-to-move starts; theoretically drawn positions remain separately classified.

This is eventual convergence, not a fifty-move guarantee. The maximum finite duration remains 87 White moves. The audit includes the existing 40 uncommitted r2 shortcuts, which this change leaves untouched. All 21 focused/stage tests and the app build pass. The app bundle matches the audited worker's policy fingerprint. Machine-readable results are in `audits/2026-09-30-r41-return-closure.json`.

## Earlier implementation and audit history

For each candidate White move, examine every legal non-capturing Black reply. If the resulting position's original policy attributes its next White decision to r4.1, penalize the candidate under r4.1. The original escape declarations and forbidden-formation penalty remain in place.

“Triggers r4.1” means r4.1 is the last rule that eliminates candidates, matching the app's decision attribution. Merely filtering an unwanted move is insufficient if a later rule still chooses among the survivors. This distinction preserves the declared Nf5 escapes while detecting the reported Na5/Nb3 loop.

The probe disables its own lookahead, so it checks one Black reply without recursive self-application. A conservative formation check avoids unnecessary policy evaluation; repeated probes are cached by placement and turn in a bounded cache. Capturing replies remain the responsibility of the higher-priority piece-safety rule.

## Reported position

`8/8/8/N7/8/8/B7/K1k5 w - - 0 1`

Previously: `1. Nb3+ Kc2 2. Na5 Kc3 3. Nb3 Kc2`, repeating the position after the first full move. After `...Kc2`, r4.1 rejects Nc5 and Nd4+, leaving Na5. The new lookahead therefore rejects the entry move **1. Nb3+**, with r4.1 attribution. The current recommendation is **1. Nc4**.

## Priority and stage boundaries

R4.1 remains after r4 and before r4.2. Mate, piece safety, no stalemate, r1, r2 and r4 all retain their existing precedence. The r1 graph, r2 routes, destination tables and attribution invariants are unchanged by this patch. This is a rule preference, not removal of legal moves: an earlier rule can take precedence, and if all survivors share a penalty then later rules break the tie normally.

## Validation

The reported entry rejection passes all eight D4 orientations. Existing declared-escape and forbidden-formation tests pass. The production build passes. Full graph recheck results are recorded in `audits/2026-09-30-r41-lookahead.json`.

## Full-audit result and accepted tradeoff

The dependency-closed refresh checked 19,309 potentially affected decisions and independently checked 5,139 unaffected cached decisions; 39 preferred decisions changed. All legal-position distances were recomputed. The build, six r4.1 tests and ten stage/piece-preservation tests passed.

However, winning White-to-move starts that can loop increased from **28,328 to 88,164**; Black-to-move failures increased from **70,296 to 152,812**. The new graph contains 58 cyclic components, versus 57 before. No newly recommended move immediately loses the tablebase win; the regression is failure to make progress. The maximum finite mate duration remains 87 White moves.

A newly looping position previously had a finite worst-case mate bound of 63 White moves:

`8/8/8/8/8/2k5/3N4/KB6 w - - 0 1`

[New loop: Nf3 Kb3 Nd2+ Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/2k5/3N4/KB6_w_-_-_0_1&moves=Nf3,Kb3,Nd2%2B,Kc3&cursor=0).

After reviewing these results, the user explicitly chose to keep the requested rule and review the new loop next. Earlier uncommitted r2 shortcuts remain unchanged. At that checkpoint, no additional loop-breaking preference had been installed.

## Review of the new loop

At `Ka1 Bb1 Nd2 / Kc3`, the old choice was Ne4+. The new lookahead rejects it because ...Kb3 would trigger the geometric r4.1 bishop escape. R4.7 instead chooses Nf3. After ...Kb3, r4.7 chooses Nd2+ to bring the knight closer to White’s king; ...Kc3 restores the start. Thus the return move is now driven by r4.7, not r4.1.

At the position after `1. Nf3 Kb3`, either **2. Bd3** or **2. Be4** would break the cycle and then force eventual mate under the unchanged continuation policy, in at most 59 additional White moves including the bishop move, against every Black reply. This is a prospective single-move alternative for review, not a newly installed rule or a 50-move guarantee.


## Forced-return correction (2026-09-30)

The base reply guard above remains unchanged. R4.1 now also rejects a candidate when all of the following hold:

1. Black has a legal non-capturing reply.
2. At the resulting position, the existing r4.1 filter (including its one-reply lookahead) changes the chosen move: without r4.1 that move would not be preferred.
3. The complete continuation policy uniquely selects the exact reversal of White's candidate. A later rule may break the tie left by r4.1.
4. Black can legally reverse its own move, restoring the original placement and turn.

The continuation probe disables only this new return check. It retains the original r4.1 reply guard and the existing r4.2 behavior. The base r4.1 and r4.2 probes do not recursively invoke this return check. Memoized scores, bounded placement/turn caches and a conservative White-formation prefilter keep the search finite and avoid unrelated probes.

For the reported `Nf3 Kb3 Nd2+ Kc3` loop, **2. Nd2+ is rejected by r4.1**, and **2. Ne5** is preferred. The same check also rejects **1. Nf3** at the original source, choosing **1. Nf1**. These results hold across all eight D4 transforms, without changing rule text or priorities.

The cached full-graph audit refreshed all seven potentially affected cycle nodes and independently checked 1,352 unaffected decisions; six choices changed, all rejected by r4.1. All distances were recomputed over 1,359,578 canonical legal White positions, with all selected White ties and every legal Black reply. Winning White starts that can loop fell from **60,004 to 24**. No previously convergent winning start became non-convergent, and no recommendation loses its tablebase win immediately. The 20 focused/stage tests and production build passed; r1/r2 continuations are unchanged.

One cyclic component remains (two canonical cycle positions, three canonical winning starts that can reach it): [Nb4+ Kc3 Na6 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/8/N7/8/8/8/B1k5/K7_w_-_-_0_1&moves=Nb4%2B,Kc3,Na6,Kc2&cursor=0). This bounded return check does not promise to eliminate every loop or guarantee mate within fifty moves. The maximum finite bound remains 87 White moves.

The machine-readable result and dependency proof are in `audits/2026-09-30-r41-forced-return.json`.
