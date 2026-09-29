# Full-audit worker optimization, 2026-09-28

The audit worker now reuses the production lightweight Black-king reply helper instead of constructing verbose chess.js `Move` objects. Root children are encoded directly from each legal, noncapturing king destination rather than playing and undoing the move. Chess.js still generates every legal reply; captures retain the same terminal flags. White move selection and the root population are unchanged.

Before/after bundles of the same current policy were compared in four interleaved fresh processes per phase. Every output field, preferred White branch, reply, flag and graph edge matched exactly.

| Phase | Positions | Before (ms) | After (ms) |
| --- | ---: | --- | --- |
| Root classification | 221 | 125, 139 | 78, 82 |
| White policy expansion | 1,500 | 3,480, 3,408 | 3,528, 3,436 |

Root processing was about 39% faster in this small sample. Policy expansion was effectively unchanged (about 1% slower, within run variation). This is not a promised whole-audit speedup. Reproduction: `.audit/benchmark-r6-audit.mjs`, with measurements in `.audit/perf-r6-comparison.json`.

Fifteen targeted tests passed, including all-legal Black replies, capture handling, history independence, board encodings, symmetries and reporting exclusions. The full run additionally compares the memoized worker against its unmodified bundle and independently reconstructs root children and policy transitions using chess.js. It runs the entire fresh root census and recomputes current White choices; no previous-policy graph or sampled population substitutes for the census.
