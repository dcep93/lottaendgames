# Universal three-step king-distance limit

All supported bishop diagonals now require White’s and Black’s kings to be at most three king steps apart after White moves. The distance is Chebyshev distance: the maximum file/rank difference. The limit is checked before all declared support exceptions and applies to three-, five-, and seven-diagonals in every reflection. Other support checks still apply.

In `8/8/1k2B3/8/8/3N4/8/1K6 w - - 0 1`, after 1.Kc2 the kings on c2 and b6 are four steps apart, so the position is unsupported.

204 bishop-and-knight policy/phase tests pass. Three-step boundary fixtures remain supported in each diagonal family under all eight symmetries. Older test fixtures that violated the new limit were moved closer where needed to retain coverage of race, knight proximity, screening, outer-boundary, attack-response, and flush preferences; remote defended-bishop cases explicitly assert rejection. Production build passes.

## Exhaustive audit

All tied best continuations from supported starts are followed through loss of support, with Black return history, until mate, capture, or stalemate. Clocks/repetition claims are excluded. Black follows the app’s policy rather than arbitrary legal defense.

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-three-step --workers 4 --gate loops
```

The full census classified 13,660,584 placements, selecting **87,604 supported starts**. The three-step rule reclassifies 52,248 previously supported placements as unsupported.

- Zero supported starts lie on or can reach a loop; loop gate passes.
- 84,220 starts can reach mate; 3,400 can reach capture/stalemate. These outcome sets can overlap.
- 14,655 history states, 14,957 transitions, zero cyclic components.

Zero loops does not establish forced mate.

Policy fingerprint: `25447923d96ec64b5f87c23292ad39d5b9ca34c843142a8074b998d6d229fed8`. The manifest records parent eb371be; the fingerprint includes this working policy change.
