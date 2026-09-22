# Seven-diagonal support: White must be to Black’s right when Black is closer

The bishop-distance restriction previously applied only when the knight occupied its seven support square and the kings shared a file. It now applies in each qualifying seven-support orientation, including a knight one move from support. If Black is strictly closer to the bishop by Euclidean distance, White must be strictly to Black’s right. Same-file and left-side White kings fail this condition; distance ties remain eligible. Other support checks and rule priorities are unchanged.

In `3k2B1/8/8/3KN3/8/8/8/8 w - - 0 1`, 1.Kd6 is unsupported: Black Kd8 is 3 units from Bg8 versus White’s sqrt(13), and White is on the same file. Ne5 approaching d3 no longer bypasses the condition. All eight symmetries reject it and prefer Ke6 instead.

The resulting production-policy line reaches mate without losing support:

`1.Ke6 Ke8 2.Bf7+ Kd8 3.Nd3 Kc7 4.Ke7 Kc6 5.Bb3 Kb5 6.Kd6 Ka5 7.Kc5 Ka6 8.Ba4 Ka5 9.Bc6 Ka6 10.Nb4+ Ka5 11.Nd5 Ka6 12.Bd7 Kb7 13.Kb5 Kb8 14.Kb6 Ka8 15.Bc8 Kb8 16.Ba6 Ka8 17.Nf6 Kb8 18.Nd7+ Ka8 19.Bb7#`.

## Validation

203 bishop-and-knight policy/phase tests pass, including the original Nd3/Kd6 rejection, Bb3 support, equal-distance eligibility, the approaching-knight rejection, and left-side rejection. The focused regression suite also passes after adding the Ke6 preference assertion. Production build passes.

The exhaustive audit follows all tied best continuations through loss of support, stopping only at mate, capture, or stalemate, with Black return history. Clocks and repetition claims are excluded; this is the app’s policy graph rather than arbitrary legal Black defense.

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-seven-right --workers 4 --gate loops
```

The full census classified 13,660,584 placements and selected **139,852 supported starts** (8,832 fewer than the previous Euclidean-distance policy).

- **Zero** supported starts lie on or can reach a loop; loop gate passes.
- 135,980 starts can reach mate; 3,888 can reach capture/stalemate. Outcomes may overlap.
- 22,598 history states, 23,147 transitions, zero cyclic components.

Zero loops does not establish forced mate. This result covers continuations from supported starts, including unsupported downstream positions.

Fingerprint: `f9249ba13afab2eb02219eabcb15b63b8edada354e33d598e000e07dc4a8d4e8`. The manifest records parent commit 363afd0; the fingerprint includes this working policy change.
