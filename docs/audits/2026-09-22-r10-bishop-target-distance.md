# r10 bishop distance from the target corner

r10 now maximizes the bishop’s Euclidean distance from the target corner immediately after preferring a king-protected central bishop, and before knight proximity to a precage square. It uses the existing target-corner selector (bishop-colored corner nearest Black, preserving the established exact exception). When target corners tie, the score maximizes distance from the nearer tied target, preserving symmetry.

For `8/3k4/8/3BK3/2N5/8/8/8 w - - 0 1`, the target is a8. **1.Be4** is now preferred: distance sqrt(32) instead of sqrt(18) for Bd5. The first four r10 criteria tie against Kd4; the new fifth criterion decides before knight routing. Earlier rules, including r1.5, remain unchanged.

210 policy/phase tests pass, including all eight symmetries of the loaded move, exact priority order, score values, and tied-target handling. Existing downstream preference tests retain their individual comparisons while reflecting the new earlier bishop priority. Production build passes.

A first-policy continuation from the loaded board starts Be4 and reaches Bb7# on move 26. The exhaustive audit below covers all tied branches rather than only that one continuation.

## Exhaustive audit

All 13,660,584 physical placements were classified; 23,340 supported starts were followed through support loss, with all tied best moves and Black return history. Terminal conditions are mate/capture/stalemate. Black follows the app policy; clocks and repetition claims are excluded.

- Zero supported positions directly on a loop.
- **32 supported starts (0.1371%)** can reach a loop, down from 144: a **77.8% reduction**.
- Two downstream cyclic components remain, both entirely unsupported bishop shuffles; loop gate reports FAIL.
- 22,076 starts can reach mate; 1,280 can reach capture/stalemate. Outcome sets can overlap.
- 3,864 history states and 3,919 transitions.

Minimal loops, normalized to a light bishop nearer a8 and a knight nearer a1, were checked against production best moves for two full laps and validated as four-ply replays:

1. `B7/8/8/8/3k4/8/2KN4/8 w - - 0 1`: Be4, Ke5, Ba8, Kd4.
2. `B7/8/8/8/1N1k4/1K6/8/8 w - - 0 1`: Bd5, Ke5, Ba8, Kd4.

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-r10-bishop-target --workers 4 --gate loops
```

Policy fingerprint: `8b7b8ce4f2d3f4750ab4f5982e7def8fd1d31bad822ded226aafd6fca932e907`. Manifest parent b0e4d2c; the fingerprint includes this working policy change.
