# Bishop–knight r4.2: prevent loss of a piece

## Design

Use an exact White-to-move source lookup at ordinary priority r4.2, between r4.1 and r4.5. The table stores one move per D4-reduced KBNvK position. Rotations and reflections apply; translations do not. Ignore move counters, reject extra material and Black-to-move positions. This implements the user's requested lookup rather than adding tactical search or tablebase probing to the browser.

The baseline audit found 9,252 canonical winning positions (74,016 physical orientations) with at least one immediately drawing recommendation. For each source, choose a tablebase-winning candidate that survives earlier priorities, then use the existing remaining preferences. Break any final tie by SAN in the canonical orientation. Each row stores a 24-bit K/B/N/k placement and a 12-bit from/to move. Lookup results are scored through the ordinary selector; they do not bypass it or change attribution.

## Original priority conflicts, now resolved

The original lookup implementation left four canonical sources (32 physical orientations) with a losing move forced by the protected r4 maneuver. The maneuver is now restricted to a king on d4, e4, d5, or e5, with every knight landing inside c3–f6. It no longer activates at these noncentral-king sources; the existing r4.2 lookup selects the winning king move at normal priority. No special priority exception or per-position r4 override is introduced.

| Source FEN | Former losing r4 choice | Current winning move |
| --- | --- | --- |
| `8/8/8/8/2N5/2K5/8/1k1B4 w - - 0 1` | Nd2+ | Kd4 |
| `8/8/8/8/8/k2KN3/8/1B6 w - - 0 1` | Nc2+ | Kd4 |
| `8/8/8/8/8/1k1KN3/8/1B6 w - - 0 1` | Nc2 | Kd4 |
| `8/8/8/8/3N4/3K4/8/2k1B3 w - - 0 1` | Ne2+ | Ke4 |

All 9,252 lookup sources now select their stored winning move; all 74,016 transformed lookups pass. The four reported starts have no cycles, captures, or stalemates across every recommended White move and every legal Black reply (233 D4 position classes, 43 certified-stage boundaries). A broader exhaustive check of 23,340 winning D4 starts where the old maneuver activated with a noncentral king traversed 35,578 classes and found no cycles, captures, or stalemates before entering the certified stages. Clocks were ignored. See [the central-four routing audit](audits/2026-09-30-central-four-routing.json).

## Generation and evidence

Baseline: `.audit/all-legal-after-46`, policy fingerprint `78fff1f4deaa435f9b88058a7fd4295110541f7d9dbf16613dfe3961619414c6`. This includes the twenty uncommitted r2 changes after checkpoint `3565aee`. The safety lookup does not alter that route data.

The saved `shadow-safety-candidates.json` contains source keys, FENs and every legal tablebase-winning SAN candidate. Only its winning candidates are used; the earlier tactical-search experiments are not incorporated. Keep this frozen baseline artifact when regenerating, since a post-repair failure scan will no longer include repaired sources.

```
app/node_modules/.bin/tsx scripts/bishop-knight-audit/generate-piece-preservation.mts .audit/all-legal-after-46/shadow-safety-candidates.json
.audit/tablebase-venv/bin/python scripts/bishop-knight-audit/verify-piece-preservation.py --tables .audit/syzygy
app/node_modules/.bin/tsx scripts/bishop-knight-audit/verify-piece-preservation.mts
app/node_modules/.bin/tsx --test app/src/mate/rules/bishopKnightPiecePreservation.test.ts app/src/mate/rules/bishopKnightStages.test.ts
```

The Python verifier independently checks legality, a winning source and a winning destination for every stored move. The TypeScript verifier checks canonical keys, all eight move transformations, legal reflected moves, and actual production selection. It reports and fails on priority conflicts instead of hiding them.

The existing stage tests traverse every r1/r2 branch and verify all D4 orientations, higher-priority checkmate attribution, and the exact 99 reachable r1 edges. No r1/r2 choices should change. This lookup preserves wins at its registered sources; it is not a proof of arbitrary-start convergence to r4 or mate, nor a fifty-move guarantee.
