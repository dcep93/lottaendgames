# Mate in 8 ish J Design

## Goal

Add the loaded Phase 2 sequence as lettered flow J:

`Kf2 Kh3 Bg5 Kh2 Bg4 Kh1 Be7 Kh2 Bd6+ Kh1 Bf3#`

The canonical starting position is `8/8/8/8/7B/5K2/7k/3B4 w - - 0 1`.

## Design

- Register the exact sequence, plus every rotation and reflection, in the existing Phase 2 pattern graph.
- Record only its White moves as flow-J choices; do not infer alternatives.
- Add a `mate in 8 ish J` rendered-piece animation using the existing frame generator.

## Verification

- Walk the complete sequence in a focused test, require each White move to be ideal, and confirm checkmate.
- Extend the training-help metadata test for flow J.
- Run focused Phase 2 tests, the production build, and the fast loop verifier.
