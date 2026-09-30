# R4.1: avoid entering another escape decision

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

After reviewing these results, the user explicitly chose to keep the requested rule and review the new loop next. Earlier uncommitted r2 shortcuts remain unchanged. No additional loop-breaking preference has been installed.

## Review of the new loop

At `Ka1 Bb1 Nd2 / Kc3`, the old choice was Ne4+. The new lookahead rejects it because ...Kb3 would trigger the geometric r4.1 bishop escape. R4.7 instead chooses Nf3. After ...Kb3, r4.7 chooses Nd2+ to bring the knight closer to White’s king; ...Kc3 restores the start. Thus the return move is now driven by r4.7, not r4.1.

At the position after `1. Nf3 Kb3`, either **2. Bd3** or **2. Be4** would break the cycle and then force eventual mate under the unchanged continuation policy, in at most 59 additional White moves including the bishop move, against every Black reply. This is a prospective single-move alternative for review, not a newly installed rule or a 50-move guarantee.
