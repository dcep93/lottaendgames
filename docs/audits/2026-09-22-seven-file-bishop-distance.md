# Same-file seven-diagonal restriction: bishop distance

This supersedes the unconditional restriction in `2026-09-22-seven-same-file-kings.md`.

With a seven-diagonal bishop and a knight on its seven support square, same-file kings disqualify support only when Black is strictly closer to the bishop in king steps. Equal distances remain eligible. The knight fixes the reflected file direction; all eight board symmetries apply. Classification remains after White moves.

- In `6B1/3k4/8/8/8/2KN4/8/8 w - - 0 1`, after Kd4 Black is three steps from Bg8 and White is four: unsupported.
- In the loaded line `8/8/8/8/k7/2KN4/B7/8 w - - 0 1`, after Kb2 Kb5 Bb3, White is one step from the bishop and Black is two: supported. Bb3 is uniquely preferred. Phase 2 persists through Kc6.
- The loaded production-policy continuation reaches 19.Bb7#, retaining support after every White move.

## Validation

201 bishop-and-knight policy/phase tests pass, including both examples and a distance tie under all eight symmetries. Production build passes.

The exhaustive census classified 13,660,584 placements, selecting **149,524 supported starts**. Every tied best continuation was followed through loss of support, with Black return history, until mate, capture, or stalemate.

| Result | Supported starts |
|---|---:|
| Directly on a loop | 0 |
| Can reach a loop | 0 |
| Can reach mate | 145,244 |
| Can reach capture or stalemate | 4,296 |

The graph has 24,311 history states and 24,911 transitions, with zero cyclic components. Outcome sets can overlap. Zero loops does not establish forced mate: Black follows the app policy, and clocks/repetition claims are excluded.

Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-seven-file-distance`.

Policy fingerprint: `d4c76aa6962de3acd281fc8e3f04ca4c340c4de59495aee6ec592cd3e568970a`. Manifest commit 5544c35 is the parent; the fingerprint includes this working policy change.

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-seven-file-distance --workers 4 --gate loops
```

Loop gate passed.
