# Bishop-clutter reset — 2026-09-26

Removed r4 from the active rules and visible rule list, including its activation, scoring fields, and separation/exit-clearing logic. Removed the bishop-near-both-White-pieces veto from r6.5. Old clutter behavior tests are replaced with removal and Bc6 regressions. No new clutter heuristics: future examples must come from the user.

r6.5 still saves an attacked, non-king-defended bishop by preferring adjacency to the central White king, otherwise distance from Black. Safety and physical move/path blocking remain unchanged. Bc6 is now preferred both from Ba8 and Bb7 against Kb8 with Kd5/Nc5, across all eight D4 transforms.

## Saved-cycle replay

66 of 15,917 saved D4 four-ply witnesses survive, down from 79. 13 previous witnesses broke and 0 reappeared. 64 survivors are hidden by the all-White-middle-16 display filter, leaving two: one r20/r20 and one r20/r5. This is not a new global total and does not detect newly introduced loops. The full-audit baseline pointer is unchanged.

Neither survivor can simultaneously orient bishop and Black nearer a8 than h1. The examples below retain Black nearer a8 but have the bishop nearer h1. All other verification remains: preferred White moves, legal Black replies, exact closure, D4 uniqueness, terminal/degenerate exclusions each ply, and middle-16 display filtering.

## Validation

Build and all 21 tests in the four changed test files pass. The broad suite retains four pre-existing failures in unchanged tests; no claim of a fully passing suite.

## Surviving examples

- **r20 ↔ r20**: [Bh1, Ke5, Bg2, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/4N3/4K3/6B1/8_w_-_-_0_1&moves=Bh1,Ke5,Bg2,Kd5&cursor=0)
- **r20 ↔ r5**: [Bg2, Kd5, Bh1, Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/8/4NK2/8/8/7B_w_-_-_0_1&moves=Bg2,Kd5,Bh1,Ke6&cursor=0)
