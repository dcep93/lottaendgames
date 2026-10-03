# Two Bishops r0.5 audit — 2026-10-03

Moved “Execute the mating pattern” from r4 to r0.5, ahead of r1 and r3. Immediate mate, bishop safety, and stalemate avoidance retain priority. The mating-pattern geometry and comparisons are unchanged.

The exhaustive audit found **no loops or failing continuations** under this policy. Every audited starting position forces checkmate within the fifty-move limit when the initial halfmove clock is zero.

| Measure | Result |
| --- | ---: |
| Symmetry-distinct eligible starting positions | 312,286 |
| Reachable White-to-move positions | 312,426 |
| Tied recommended White choices | 312,998 |
| Legal Black replies | 1,314,789 |
| Loop-leading positions | 0 |
| Other failing continuations | 0 |
| Fifty-move-limit failures | 0 |
| Longest continuation to mate | 95 plies |

The census includes all app-eligible opposite-colored KBBK White-to-move starts, the training seeds, and all reachable White states. It explores every tied recommended White move and every legal Black reply, including replies the app would not choose automatically. Structural cycle detection ignores move counters; the separate mating-distance check confirms the fifty-move bound. Supplied prehistory or an already-advanced halfmove clock is outside this guarantee.

The independent identity-key audit also verified all **582 historical/adversarial starts**, without symmetry merging. The development gate passed all 10 smoke roots and 10 seeded random roots.

[Machine-readable census](two-bishops-r05-audit-2026-10-03.json)

## Reproduction

From `app/`:

```sh
npm run develop:two-bishops
npx tsx ../scripts/mate-verifier/verify-two-bishops-exhaustive.mts --workers=6
```

- Engine fingerprint: `b4cb88f4437a23150852652ddfd4f448ac2a80a1470f7036ae7bb1bb62fd5ca1`
- Policy fingerprint: `6071067b780eb3ac88b7d13aef4fee8e088489a7a265288b28b0e5e179ade1c3`
- Census implementation fingerprint: `22ef30d6c462647fc5243aaa6c2c914b68d0fd9730071b8b478306c8caf2e535`
- Exhaustive run time: 20.67 minutes.

App build and lint passed. All 213 two-bishop tests and the graph/census verifier's 19 tests passed, along with the focused rendered-guide check.

The standalone verifier TypeScript check still reports a pre-existing status-name mismatch at `scripts/mate-verifier/production.mts:586`: `white-checkmate` versus `white-checkmated`. This file was not changed. The executed KBBK audit completed successfully; this terminal outcome cannot occur with Black having only a king.
