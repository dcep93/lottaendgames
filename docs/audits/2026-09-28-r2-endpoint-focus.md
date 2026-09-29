# Focus beyond the former r2 endpoint

Start: `8/8/8/8/8/2K5/B1N5/3k4 w - - 6 4`.

The user removed this placement’s temporary-terminal role by requesting loops reachable from it. No move preferences changed. Follow all preferred White choices and all legal Black replies, without the old cutoff. Current app help no longer calls it a terminal; the opt-in worker switch remains only for reproducing historical searches.

Complete reachable graph: 461 D4 canonical White states; all 754 probed board-and-turn placements are Syzygy wins for White (reset counters). Exact four-ply cycles, deduplicated under D4 and cycle phase: 87, of which 79 fully satisfy r4 throughout and eight do not. One loop was absent from the previous bounded search; the other 86 remain reachable. No exhaustive count of longer cycles was attempted.

The start itself is on the newly exposed cycle: `Nd4 Kc1 Nc2 Kd1`. All moves are current policy/legal replies and the full placement and turn return to the start.

Graph, probe results, cycle examples, and replay: `/Users/danielcepeda/repos/_codex_output/bn-from-r2-endpoint-2026-09-28/`.
