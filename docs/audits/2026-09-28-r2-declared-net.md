# r2 declared mating-net continuation

r2 text: Lock the Black king into a 7-diagonal cage, then force Black into the mating net.

The loaded line starts at `8/8/8/8/2N1B3/4K3/8/4k3 w - - 0 1`:

`1. Bf5 Kd1 2. Na3 Kc1 3. Nc2 Kd1 4. Kd3 Kc1 5. Kc3 Kd1 6. Bg4+ Kc1 7. Bf3 Kb1 8. Bd5 Kc1 9. Ba2 Kd1`.

The nine resulting post-White FEN destinations are preferred from any legal source, regardless of which White piece moves. Matching includes every piece, Black’s square, and side to move (plus castling/en-passant fields), under all eight D4 symmetries; counters are ignored. Among matching destinations, r2 prefers the furthest destination along the declared line. This avoids later rules choosing an earlier destination (for example Bf5 over Ba2 from Be6). Source and moving piece remain unrestricted. The existing cage-entry and king-only forcing routes are preserved.

The final White-to-move placement is a temporary search terminal, not checkmate. Focused searches enable `AUDIT_R2_TERMINAL=1`; unrestricted graph audits remain available with that option unset.

Validation: ten targeted tests pass, including all nine destination matches across D4, alternative king/bishop/knight approaches, rejection of extra pieces, unchanged king-only route forcing bounds, exact terminal boundaries, and counter independence. Type checking and diff whitespace checks pass. The reached endpoint has zero outgoing focused-search edges.

Prior source-based implementation (superseded): the complete reachable graph from the existing all-winning, both-turn satisfied-r4 seeds contains 2,823 canonical White states with the temporary endpoint enabled. All 4,796 probed board-and-turn positions are Syzygy wins for White. There are 84 D4/phase-deduplicated four-ply loops: 79 fully satisfy r4 throughout and five do not. Three previous four-ply loops disappear; no new four-ply loops appear. This is not a full-board audit or a count of longer cycles.

Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r2-net-from-satisfied-r4-2026-09-28/`.

Destination-based update: 453 reachable canonical White states and 735 winning board-and-turn probes. There are 89 four-ply loops, five newly reachable compared with the source-based implementation; 79 fully satisfy r4 throughout. The temporary terminal remains active. This scoped traversal is not a full-board audit. Current verified examples and graph: `/Users/danielcepeda/repos/_codex_output/bn-r2-destinations-from-satisfied-r4-2026-09-28/`.

Progress-priority update: the Be6/Kc3/Nc2/Black Kc1 position now uniquely selects Ba2 across D4 and counters. All nine original line moves are again uniquely selected. The focused graph has 455 canonical White states, all 739 probed board-and-turn positions winning, and 87 four-ply loops (79 fully r4 throughout, eight others), down two with no new four-ply loops. Temporary r2 endpoint unchanged. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r2-progress-from-satisfied-r4-2026-09-28/`.

Be6 addition: after `Nc2 Kb1`, choose `Be6` by the full post-White destination `8/8/4B3/8/8/2K5/2N5/1k6 b - - 0 1`, all D4 and regardless of incoming piece/source. It ranks just before the Ba2 destination. After `...Kc1`, Ba2 is still uniquely preferred and `...Kd1` reaches the unchanged temporary terminal. Eleven targeted tests pass, including this route and a king move reaching the same Be6 destination. Focused results: 422 canonical White states; 681 winning probes; 86 four-ply loops (79 fully r4, seven others); one removed, none newly introduced. Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-r2-be6-from-satisfied-r4-2026-09-28/`.
