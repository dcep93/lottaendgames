# Seven-diagonal same-file king restriction

With a seven-diagonal bishop and a knight occupying its seven-diagonal support square, kings on the same file are unsupported after White moves. The knight determines the board orientation; rotations/reflections preserve the corresponding file direction. This does not apply to a knight one move from its support square and does not introduce a new left/right restriction.

Loaded example: `6B1/3k4/8/8/8/2KN4/8/8 w - - 0 1`. After `1.Kd4`, White Kd4 and Black Kd7 share the d-file with Bg8 and Nd3: unsupported, phase 1/2. Kd4 remains the best move under r10 because every candidate is unsupported. Verified that result in the local browser after refreshing the replay.

## Validation

- 199 bishop-and-knight policy/phase tests passed; production build passed.
- All eight symmetries reject the loaded Kd4 placement.
- Nearby kings on different files and an approaching Nf2 retain their previous support.
- Adjusted older phase, race, boundary, and recorded-line fixtures to reflect the new definition while retaining their original independent checks.

## Exhaustive audit: loop gate failed

The complete census classifies 13,660,584 post-White boards. Supported starts decrease from 150,268 to **146,692** (3,576 newly unsupported placements).

- **1,496** supported starts can reach a loop (1.0198%).
- **96** supported boards occur on discovered cycles, across **seven cyclic components**.
- 140,988 starts can reach mate; 4,248 can reach capture/stalemate. These outcomes can overlap.
- All tied best continuations are explored through loss of support, with Black return history. Clocks and draw claims are excluded.

The previous zero-loop result does not apply to this stricter policy. The user's classification change has been implemented; no extra preference changes were added to conceal the resulting cycles.

Largest component: **784 starts**, a four-ply loop. The reflected replay below is verified against production best moves for three consecutive cycles; both White moves remain supported seven-diagonals:

[1.Kb2 Kb5 2.Kc3 Ka4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/k7/2KN4/B7/8_w_-_-_0_1&moves=Kb2,Kb5,Kc3,Ka4&cursor=0)

Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-seven-file`.

Fingerprint: `fb16382030b9007b8efcd4c09248bec597bea1f0fd68ef2a3cadca1081213e6f`.

The manifest records parent commit 308b303; the fingerprint captures the working policy change. Command run from app:

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-seven-file --workers 4 --gate loops
```

The command intentionally exits 2 for the failed loop gate, after writing the complete report.
