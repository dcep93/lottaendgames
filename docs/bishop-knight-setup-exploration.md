# Setup-route exploration after rule renumbering

Read-only exploration after `e426e79`. **No setup changes have been applied.** The renumbering preserves every move choice; the current all-start maximum remains 72 White moves.

## Single-move changes on the longest line

| Change | Setup worst case from that position | Total mate worst case from that position | Longest starting position after change | Global maximum after change |
|---|---:|---:|---:|---:|
| 1.Nc7 instead of Kg1 | 40 → 23 | 72 → 55 | 55 | 72 |
| 5.Nc7 instead of Kg4 | 36 → 16 | 68 → 48 | 71 | 72 |

Each experiment changes only that source's move (and its D4 equivalents), then follows existing recommendations. Every recommended White tie and legal Black reply is included; affected ancestors were recomputed. Both knight moves are currently rejected by **r6.1**, the king-toward-knight preference. The knight remains on a8 for a large part of the original king route. The move-five cut is larger locally, but Black can choose a different earlier route, so it saves only one move from the original start. Neither isolated cut reduces the global maximum.

The hypothetical 1.Nc7 line was replayed legally to checkmate in 55 White moves, with every later White move following the current policy:

- [Moves 1–40](http://localhost:5173/mate/bishop-knight#fen=N7/3B4/8/8/8/6k1/8/7K_w_-_-_0_1&moves=Nc7,Kf3,Kh2,Kf2,Kh3,Kf3,Kh4,Kf4,Kh5,Ke5,Ne6,Kf5,Kh6,Kf6,Ng5,Ke7,Ba4,Kf6,Kh5,Kf5,Bc2%2B,Kf4,Kg6,Ke5,Bb1,Kd4,Kf5,Kc3,Ne4%2B,Kb2,Bd3,Ka3,Ke5,Ka4,Nd6,Kb4,Nf5,Kc3,Ba6,Kb4,Nd4,Ka5,Bd3,Kb4,Be4,Kc4,Nf3,Kb5,Kd5,Kb4,Kd4,Kb5,Ng5,Kb4,Bd5,Kb5,Ne6,Kb4,Nc7,Ka3,Kc3,Ka4,Be4,Ka3,Nb5%2B,Ka2,Nd4,Ka3,Nb3,Ka4,Bd3,Ka3,Bb1,Ka4,Nd4,Ka5,Kc4,Ka6,Nb5,Kb7&cursor=0)
- [Moves 41–55](http://localhost:5173/mate/bishop-knight#fen=8/1k6/8/1N6/2K5/8/8/1B6_w_-_-_0_41&moves=Bf5,Kc6,Be6,Kb6,Bd5,Ka5,Kc5,Ka6,Be4,Ka5,Bc2,Ka6,Nd6,Ka7,Kc6,Ka8,Bf5,Ka7,Nb7,Ka8,Kb6,Kb8,Bd7,Ka8,Nc5,Kb8,Na6%2B,Ka8,Bc6%23&cursor=0)

The continuation resets the halfmove clock for display. This is not a fifty-move guarantee for the single-move patch.

## Globally optimal setup reachability

Reuse the existing full-board retrograde solver with different terminal targets. White minimizes entry time; Black maximizes it. Minor captures and stalemate cannot satisfy the objective. The solver checked all Bellman equations over all legal placements for each target set.

| Fixed target set | Physical target boards | Largest finite setup cost across the entire board | Setup cost from the current longest start |
|---|---:|---:|---:|
| Completed-r4 formations (D4 expansion of the 82 declared r2 starts) | 328 | 12 | 10 |
| Any source in the existing r2 lookup | 131,560 | 11 | 10 |

Costs count White moves and include every legal Black reply. The second target set is already recognized by the app as r2; it does not enlarge r1 or redefine r2 membership.

Both solvers cover 10,822,144 winning White-to-move placements and 11,187,664 winning Black-to-move placements. The same 40 uncovered winning White placements have immediate checkmate. Of the 504 uncovered winning Black placements, 464 are already checkmate; each of the other 40 can only reply into a solved state or a White position with immediate mate. Those cases remain handled by the existing higher-priority mate rule. In addition to the native exhaustive certificate, 3,117 sampled board-and-turn Bellman equations were independently checked with chess.js.

## Recommended design

Use a setup lookup aimed at **the existing r2 source set**, analogous to the new r2-to-r1 lookup. Keep the r1 edges, r2 moves, and existing mate / piece-safety / stalemate priority order frozen. The setup lookup applies only outside r1/r2 and must choose a move whose worst-reply setup rank strictly decreases. It would replace the setup heuristic decisions, including the current r6.1 preference that causes the long king detour; the renumbering itself did not make that behavior change.

This yields a constructive fresh-clock upper bound of **44 White moves to mate**: at most **11 setup moves**, then at most **33** moves on the unchanged r2/r1 continuation. Early r1 entry is also safe: the fixed net's maximum is 21 White moves. Immediate mate keeps its higher priority. Because the entry rank decreases and the existing r2/r1 graph terminates, the composition does not introduce cycles.

This is a conservative sum of maxima, not the measured maximum of an exported and installed setup policy, and not a claim of globally shortest mate. The minimum-entry policy still needs export, runtime integration, and a full audit before it becomes an app guarantee.

If setup must specifically aim at a completed-r4 formation, use the 12-move solver instead. Keeping existing early r2/r1 handoffs gives a conservative **45-move** bound (12 + 33), also below 50. Requiring the literal formation before allowing an already available r2 handoff would change stage precedence and is not proposed.

The next design choice is therefore whether to preserve heuristic setup explanations or replace setup with the certified lookup. One-off exceptions can shorten individual positions, but leave other 72-move starts untouched; a lookup addresses the complete setup domain while keeping the r4/setup → r2 → r1 structure.

[Machine-readable results, witnesses, exceptions and solver hashes](audits/2026-09-30-setup-exploration.json).
