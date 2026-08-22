# Two Bishops “Mate in 8 Ish” Flow Diagrams

## Goal

Represent every distinct Phase 2 `mate in 8 ish` move flow in both the move-selection graph and Training Info, without creating separate diagrams for equivalent waiting-square choices.

## Flow groups

- **A — main line:** the existing Phase 2 mate pattern.
- **B — waiting cycle:** `Bf2, Kh3, Be1, Kh2`, returning to the Phase 2 start.
- **C — king walk:** from `8/8/8/7B/7B/5K2/8/6k1 w - - 0 1`, play `Kg3, Kf1, Kh3, Kg1, Be2, Kh1`; move 4 is any bishop waiting move along `d8–h4`; Black plays `Kg1`; move 5 is the corresponding bishop check; Black plays `Kh1`; then `Bf3#`.
- **D — early `…Kh1` deviation:** follow flow A through `Kf2`, then after Black deviates with `…Kh1`, play any accepted waiting move on `d8–h4` or `d1–h5`; Black returns with `…Kh2`, and the position rejoins the main Phase 2 pattern.
- **E — king retreat:** from the canonical Phase 2 start, play `Kf2, Kh3, Kf1, Kh2, Bg4, Kh1, Bh4, Kh2, Kf2, Kh1, Bf5, Kh2, Bg3+, Kh1, Be4#`. These moves are specific under rotation and reflection.

All flows apply under board rotations and reflections.

## Training Info

Render five separate chess-piece GIF note boards titled `mate in 8 ish A` through `mate in 8 ish E`. Flows C and D each use one representative waiting move in their GIF and explain that equivalent waiting choices share that diagram. Flow E renders the exact browser line.

## Validation

- Test every accepted move in flows A, B, C, D, and E.
- Test all four canonical move-4 waiting destinations in flow C and their continuing checks.
- Test the accepted waiting destinations on both diagonals in flow D and their rejoining continuations.
- Confirm transformed starts expose the same five flow choices.
- Regenerate GIF assets and verify them byte-for-byte with the generator’s `--check` mode.
