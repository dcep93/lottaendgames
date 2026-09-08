# Two Bishops r18 outside-king recheck — 2026-09-08

Rule r18's choke move now requires White's king to begin strictly outside the wall, opposite Black beyond its outer diagonal. A king on the wall or inside Black's area does not qualify. The five-square inner-wall geometry and the bishop destination on the long diagonal remain required.

## Scope and fingerprints

The loaded loop root is checked with a fresh production adapter and proof map, including every tied preferred White move and every legal Black reply. No historical census transitions or proofs are reused. A separate candidate supplies the current exact four-ply loop below. Both starts have halfmove clock zero and fullmove number one; neither counterexample nor proof relies on a supplied earlier game history. No exhaustive census of all starts was run.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `c2c6391f407aba85b30177df6bd8f612ba61e4ae46e7f95619f07516fbe56a9e`
- Both fingerprints remained unchanged through the proof and independent draw replay validation.

## Previously reported r18 loop

Starting FEN: `3B4/8/4k3/8/B3K3/8/8/8 w - - 0 1`.

The former line **Bc6 Kd6 Ba4 Ke6** breaks immediately. The sole preferred first move is now **Ba5**, with **r30** as the final deciding rule. The first complete-graph attempt stopped at its 5,000-position cap after expanding 5,021 White choices and 19,942 Black replies; that capped attempt alone established neither a universal mating bound nor a failure.

A second run with a fresh proof map and a 25,000-position cap completed the entire reachable structural graph after **6,125 canonical positions, 6,162 White choices, and 25,146 Black replies** in 51.4 seconds. All structural continuations mate within **103 plies** when the fifty-move cutoff is ignored. Therefore no structural cycle remains reachable from this start, but the current policy still permits a **fifty-move draw after 100 plies from clock zero**.

[Replay the verified clock-zero fifty-move draw](http://localhost:5173/mate/two-bishops#fen=3B4/8/4k3/8/B3K3/8/8/8_w_-_-_0_1&moves=Ba5,Ke7,Bb5,Kf8,Bb6,Kf7,Be3,Ke6,Kf3,Ke5,Ke2,Kd6,Bd3,Ke5,Kf3,Kf6,Kg4,Ke5,Bc1,Kd4,Bh7,Kc3,Kf3,Kb3,Bh6,Kc3,Ke2,Kc4,Bg7,Kd5,Ke3,Ke6,Kf4,Kf7,Bb2,Kf8,Bb1,Kf7,Kg5,Ke6,Ba2%2B,Kd6,Kf5,Kc5,Ke4,Kb4,Kd3,Kb5,Ba3,Kc6,Kd4,Kd7,Ke5,Ke8,Kf6,Kd8,Kf7,Kd7,Bb3,Kc6,Kf6,Kb5,Ke5,Ka5,Bf7,Ka4,Bf8,Kb5,Kd4,Kb6,Be8,Kc7,Kd5,Kd8,Ba4,Kc7,Bc5,Kb8,Kc4,Kc8,Kb4,Kc7,Ka5,Kb7,Bb5,Kc7,Ka6,Kc8,Kb6,Kd8,Ba4,Kc8,Be7,Kb8,Bd7,Ka8,Bc5,Kb8,Bd6%2B,Ka8&cursor=0).

The displayed line reaches `k7/3B4/1K1B4/8/8/8/8/8 w - - 100 51`. An independent replay checked every White move against the current preferred-move set, every Black move for legality, and every earlier position for premature termination. The final position is a draw under the fifty-move cutoff, with no checkmate, stalemate, or threefold repetition. The app's starting-position validator and replay decoder accept the line. This complete structural result and its clock-zero draw replace the earlier incomplete 5,000-position attempt.

## Current loop from a fresh clock

[Replay the current four-ply loop from its beginning](http://localhost:5173/mate/two-bishops#fen=8/3k4/8/4K3/8/8/B6B/8_w_-_-_0_1&moves=Kd5,Ke7,Ke5,Kd7&cursor=0).

Starting FEN: `8/3k4/8/4K3/8/8/B6B/8 w - - 0 1`.

**1. Kd5 Ke7 2. Ke5 Kd7** restores the exact piece placement and side to move. Only the move counters change, reaching `8/3k4/8/4K3/8/8/B6B/8 w - - 4 3`.

| White position | Unique preferred move | Final deciding rule | Legal Black reply |
| --- | --- | --- | --- |
| White Ke5, Black Kd7, bishops a2/h2 | Kd5 | r25 — Prefer king proximity | Ke7 |
| White Kd5, Black Ke7, bishops a2/h2 | Ke5 | r25 — Prefer king proximity | Kd7 |

Both White moves were independently checked against the live preferred-move API and both complete White/Black branches against a fresh production adapter. Every Black move is legal, no position in the first lap is terminal, and the board repetition is exact rather than merely equal under symmetry. A second lap again follows the preferred policy and reaches threefold repetition at ply eight. The app accepts both the starting position and the cursor-zero replay link.

This is a permitted policy loop, not a claim that Black forces the loop against every possible White strategy. White has a unique preferred move at each of the two loop positions, while Black chooses the displayed legal replies.

## Focused validation

The completed change passed **124 policy tests**, **three focused guide checks**, and both app and verifier TypeScript checks. The two independently replayed witnesses retain the current policy fingerprint above.
