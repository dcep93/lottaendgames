# r5: anticipate the reverse knight hop

## Design and implementation

The declared example chooses Kf2 from WKf1, Ng1, BKd4. Ne2 allows Ke3, where the existing r5 geometry sends the knight back to g1. Advancing the king now skips that round trip.

Extend r5 with the inverse geometry of its existing hop. When the knight is orthogonally adjacent to White’s king, check the two perpendicular directions for a knight jump followed by a single Black king step that would activate the original r5 hop back to the starting knight square. Prescribe the White king step in that direction. Apply the existing more-central Black condition, board bounds, occupancy, Black king exclusion, and bishop-ray control of Black’s trigger square. No legal-move tree is enumerated. Existing legal-move and safety priorities still apply.

An exact-position exception would miss equivalent geometry; unrestricted lookahead would add unnecessary search. The inverse geometry handles translations and all D4 transforms. Keep the displayed text “Play the r5 move.” unchanged.

## Verification

The given move is uniquely preferred with reason r5 across all eight D4 transforms. The original Ne1 hop still passes. Added tests cover translated geometry, unreachable Black triggers, occupied landing/trigger squares, and bishop control. All five r5 tests and the production build pass. The broader bishop-and-knight suite passes 123 tests and has four pre-existing failures, reproduced with the unchanged baseline r5 implementation.

## Saved-loop replay

157 of the previous 2,467 four-ply loops survive; 2,310 recorded cycles are broken. The unchanged baseline replay returns all 2,467 as a sanity check. This does not establish a new full-domain total or count positions still on longer loops. The frozen full-audit position baseline remains unchanged.

Largest surviving saved motif: 61 central-bishop shuffles with the knight king-protected throughout. Second: 37 bishop shuffles entering/leaving the center.

## Verified current examples

1. [Be4 Ka2 Bd5+ Ka1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/4N3/8/k7_w_-_-_0_1&moves=Be4,Ka2,Bd5%2B,Ka1&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
2. [Be4 Ka1 Bd5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/4N3/1k6/8_w_-_-_0_1&moves=Be4,Ka1,Bd5,Kb2&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
3. [Be4 Ka2 Bd5+ Ka3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/k3N3/8/8_w_-_-_0_1&moves=Be4,Ka2,Bd5%2B,Ka3&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
4. [Be4 Ka3 Bd5 Ka4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/k2K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka3,Bd5,Ka4&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
5. [Be4 Ka3 Bd5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/1k1K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka3,Bd5,Kb4&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
6. [Be4 Ka4 Bd5 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/k2B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka4,Bd5,Ka5&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
7. [Be4 Ka4 Bd5 Kb5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1k1B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka4,Bd5,Kb5&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
8. [Be4 Ka5 Bd5 Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k7/3B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka5,Bd5,Ka6&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
9. [Be4 Ka5 Bd5 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/3B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka5,Bd5,Kb6&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
10. [Be4 Ka6 Bd5 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/8/3B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka6,Bd5,Ka7&cursor=0) — bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
11. [Be4 Kd4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/4k3/8/4NK2/8/8_w_-_-_0_1&moves=Be4,Kd4,Ba8,Ke5&cursor=0) — bishop shuffle; bishop enters/leaves center; knight king-protected throughout; no stable bishop defense.
12. [Be4 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/4k3/8/3KN3/8/8_w_-_-_0_1&moves=Be4,Kf4,Ba8,Ke5&cursor=0) — bishop shuffle; bishop enters/leaves center; knight king-protected throughout; no stable bishop defense.
