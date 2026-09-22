# Edge knights and the seven-diagonal a3 restriction

A knight on any board-edge square immediately disqualifies diagonal support after White moves. This universal check precedes all declared support placements and applies to three-, five-, and seven-diagonals.

Separately, in the canonical a2–g8 seven-diagonal orientation, if Black’s king and the bishop are both adjacent to a3, support requires the knight on d3. Adjacency means one king step (edge or diagonal). The restriction applies in all eight board symmetries; all other support checks remain in force.

In `8/8/8/3K4/1k6/8/B7/2N5 w - - 0 1`, 1.Kd4 is now unsupported immediately because Nc1 is on the edge. The separate a3 condition is independently covered by Ka1, Ba2, Nb2 versus Ka4: Nb2 is interior but this arrangement is unsupported. Kd4, Ba2, Nd3 versus Kb4 remains eligible.

206 bishop-and-knight policy/phase tests pass, including all eight symmetries of the new conditions. Older fixtures explicitly allowing edge knights now reject them or use interior knights to preserve independent coverage. Production build passes.

A verified support-loss example remains: `8/8/4B3/1k6/8/8/2K5/2N5 w - - 0 1`, 1.Nd3 Kc6 2.Kc3 Kd6. Every move is a current policy-best move with Black return history. After Nd3 the seven-diagonal is supported; after Kc3 it is unsupported. Its encoded four-ply replay decodes successfully at cursor zero.

## Exhaustive audit

The census classified all 13,660,584 physical placements, selecting **69,956 supported starts** (17,648 fewer than the previous definition). It follows all tied best continuations through loss of support, retains Black return history, and stops at mate, capture, or stalemate. Clocks and repetition claims are excluded; Black follows the app’s policy rather than arbitrary legal defense.

- **24 supported starts (0.0343%)** lie directly on and can reach loops.
- Three symmetry-distinct minimal four-ply loops, differing only in the bishop’s square: a2, c4, or g8.
- 66,972 starts can reach mate; 3,000 can reach capture/stalemate. Outcome sets can overlap.
- 11,727 history states and 11,966 transitions.
- The loop gate reports FAIL, correctly exposing the remaining loops. No extra preference was introduced to conceal them.

Each loop has White Kd3, Ne7 and Black Kd6: **1.Ng6 Kc6 2.Ne7+ Kd6**. Support is absent after Ng6 and restored after Ne7+. Every move was rechecked against the production policy for two complete laps, and the four-ply links decode successfully.

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-edge-knight --workers 4 --gate loops
```

Policy fingerprint: `5c46890ab6ab6d287218e95fcc4b9bbf7880e5d555ccb43721b1288b06079322`. The manifest records parent 52c401b; the fingerprint includes these working policy changes.
