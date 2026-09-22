# Same-file seven support uses Euclidean distance

This refines the bishop-distance comparison in `2026-09-22-seven-file-bishop-distance.md` from king-step to Euclidean distance. The seven-diagonal bishop, knight on the seven support square, same-file king condition, reflected orientation, strict inequality, and post-White evaluation remain unchanged.

In `3k2B1/8/2K5/8/8/3N4/8/8 w - - 0 1`, after 1.Kd6, Black Kd8 is 3 Euclidean units from Bg8 and White Kd6 is sqrt(13) units away. Their king-step distances tie, but Black is closer by Euclidean distance, so this placement is unsupported. The current preferred move changes to Kd5, which is also unsupported.

The earlier 2.Bb3 example remains supported and preferred. Regression checks cover both examples and equal-distance eligibility under all eight symmetries. All 202 bishop-and-knight policy/phase tests pass; production build passes.

## Exhaustive audit

Command, run from app:

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-seven-euclidean --workers 4 --gate loops
```

The complete census selects 148,684 supported starts from 13,660,584 placements. All tied best continuations are explored through loss of support until mate, capture, or stalemate, with Black return history; clocks and repetition claims are excluded.

- 56 supported starts can reach a loop (0.0377%).
- 8 supported placements lie directly on a discovered cycle (0.0054%).
- One cyclic component; 24,194 history states and 24,793 transitions.
- 144,348 starts can reach mate; 4,296 can reach capture/stalemate. Outcome sets can overlap.

The loop gate therefore fails (exit 2); the audit itself completed. No extra preference changes were added.

[Minimal loop: Kd6 Ke8 Kd5 Kd8](https://lottaendgames.web.app/mate/bishop-knight#fen=3k2B1/8/8/3KN3/8/8/8/8_w_-_-_0_1&moves=Kd6,Ke8,Kd5,Kd8&cursor=0). This reflected witness was verified for three cycles against production best moves, including Black history, and passes replay decoding. It alternates supported and unsupported White results.

Fingerprint: `e81565b73fc7b7cc6ea8c2c6e7ca27a681b0ebf3cda6f36d662bf1de9808e14d`. The audit manifest records parent 2609d82; the fingerprint includes the working policy change.
