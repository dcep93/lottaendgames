# Bishop–knight r4.2: prevent loss of a piece

## Design

Use an exact White-to-move source lookup at ordinary priority r4.2, between r4.1 and r4.5. The table stores one move per D4-reduced KBNvK position. Rotations and reflections apply; translations do not. Ignore move counters, reject extra material and Black-to-move positions. This implements the user's requested lookup rather than adding tactical search or tablebase probing to the browser.

The baseline audit found 9,252 canonical winning positions (74,016 physical orientations) with at least one immediately drawing recommendation. For each source, choose a tablebase-winning candidate that survives earlier priorities, then use the existing remaining preferences. Break any final tie by SAN in the canonical orientation. Each row stores a 24-bit K/B/N/k placement and a 12-bit from/to move. Lookup results are scored through the ordinary selector; they do not bypass it or change attribution.

## Priority conflicts awaiting a separate decision

Four canonical sources already have a losing move forced by r4. Their winning lookup entries are present, but r4.2 cannot override r4. They account for 32 physical positions. No special priority exception is introduced.

| Source FEN | Existing r4 choice | Stored winning move |
| --- | --- | --- |
| `8/8/8/8/2N5/2K5/8/1k1B4 w - - 0 1` | Nd2+ | Kd4 |
| `8/8/8/8/8/k2KN3/8/1B6 w - - 0 1` | Nc2+ | Kd4 |
| `8/8/8/8/8/1k1KN3/8/1B6 w - - 0 1` | Nc2 | Kd4 |
| `8/8/8/8/3N4/3K4/8/2k1B3 w - - 0 1` | Ne2+ | Ke4 |

Thus ordinary r4.2 can repair 9,248 canonical sources / 73,984 physical positions. The four r4 sources need their own correction if authorized; they are not silently promoted into r4.2.

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
