# R5 waiting step with the knight behind the king

With Ka2, Na1, and Black Kc3, the old geometry tried Kb1 and rejected it because b1 was no more central than a2. It now targets Kb2, retaining knight defense while advancing centrally. Kc3 prevents that advance, so r5 chooses the bishop waiting move farthest from Black: Bh5. After Kd4, r5 chooses Kb2. The same geometry applies across D4; visible rule text is unchanged.

Implementation: for an orthogonally adjacent knight farther from the center than White's king, advance from the king's square instead of the knight's square. The continuation accepts Black's lateral offset of two so Kd4 does not lose the pattern. Existing inward-progress, occupancy, and king-separation checks still apply. No legal-response search was added.

## Saved loop witnesses

Replayed the full baseline's 4,847 four-ply witnesses. **187 survive**, compared with 882 before this change: 695 broken and 0 revived within that saved set. These are not total domain counts; newly introduced cycles and alternate cycles through old positions were not searched. The full-audit baseline is preserved.

The middle-16 display filter hides 74 survivors; terminal and degenerate exclusions apply at every ply. All links below are independently verified and D4-distinct.

## Largest display-eligible motif

bishop shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 44 saved cycles.

1. [Be2 Kd2 Bc4 Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2B5/2k5/5N2/5K2_w_-_-_0_1&moves=Be2,Kd2,Bc4,Kc3&cursor=0) — `8/8/8/8/2B5/2k5/5N2/5K2 w - - 0 1`.
2. [Bd1 Kc3 Ba4 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/Bk6/4N3/4K3/8_w_-_-_0_1&moves=Bd1,Kc3,Ba4,Kb4&cursor=0) — `8/8/8/8/Bk6/4N3/4K3/8 w - - 0 1`.
3. [Bc4 Ke5 Be6 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/4Bk2/2N5/1K6/8/8/8_w_-_-_0_1&moves=Bc4,Ke5,Be6,Kf6&cursor=0) — `8/8/4Bk2/2N5/1K6/8/8/8 w - - 0 1`.
4. [Be2 Ka5 Bc4 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/1kB5/8/3N4/4K3_w_-_-_0_1&moves=Be2,Ka5,Bc4,Kb4&cursor=0) — `8/8/8/8/1kB5/8/3N4/4K3 w - - 0 1`.
5. [Be2 Kb6 Bc4 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2k5/2B5/8/3N4/4K3_w_-_-_0_1&moves=Be2,Kb6,Bc4,Kc5&cursor=0) — `8/8/8/2k5/2B5/8/3N4/4K3 w - - 0 1`.
6. [Be2 Kc5 Bc4 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2Bk4/8/3N4/4K3_w_-_-_0_1&moves=Be2,Kc5,Bc4,Kd4&cursor=0) — `8/8/8/8/2Bk4/8/3N4/4K3 w - - 0 1`.
7. [Bh5 Kh6 Bf7 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/5Bk1/8/8/6K1/5N2/8/8_w_-_-_0_1&moves=Bh5,Kh6,Bf7,Kg7&cursor=0) — `8/5Bk1/8/8/6K1/5N2/8/8 w - - 0 1`.
8. [Ba6 Ka7 Bc8 Kb8](http://localhost:5173/mate/bishop-knight#fen=1kB5/8/8/1K6/2N5/8/8/8_w_-_-_0_1&moves=Ba6,Ka7,Bc8,Kb8&cursor=0) — `1kB5/8/8/1K6/2N5/8/8/8 w - - 0 1`.
9. [Ba4 Ka5 Bc6 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1kB5/8/8/1K6/2N5/8_w_-_-_0_1&moves=Ba4,Ka5,Bc6,Kb6&cursor=0) — `8/8/1kB5/8/8/1K6/2N5/8 w - - 0 1`.
10. [Bb5 Kd2 Bc4 Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/1N6/K7/2B5/2k5/8/8_w_-_-_0_1&moves=Bb5,Kd2,Bc4,Kc3&cursor=0) — `8/8/1N6/K7/2B5/2k5/8/8 w - - 0 1`.
## Second display-eligible motif

bishop shuffle; bishop enters/leaves center; knight king-protected throughout; no stable bishop defense: 29 saved cycles.

1. [Bb7 Kc7 Bd5 Kd6](http://localhost:5173/mate/bishop-knight#fen=K7/N7/3k4/3B4/8/8/8/8_w_-_-_0_1&moves=Bb7,Kc7,Bd5,Kd6&cursor=0) — `K7/N7/3k4/3B4/8/8/8/8 w - - 0 1`.
2. [Bb3 Kc3 Bd5 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3k4/N7/K7/8_w_-_-_0_1&moves=Bb3,Kc3,Bd5,Kd4&cursor=0) — `8/8/8/3B4/3k4/N7/K7/8 w - - 0 1`.

## Validation

10/10 r5 tests pass, including Bh5/Kb2, the maximum-distance wait, r5 attribution, and retained knight protection in all eight D4 orientations. Production build passes. The bishop-knight suite has 136 passes and the same four pre-existing failures documented in the prior report.
