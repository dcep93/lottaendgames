# Mate in 8 ish K Design

## Goal

Add exact flow K from `8/8/8/8/7B/5K2/7k/3B4 w - - 0 1`:

`Kf2 Kh1 Bg4 Kh2 Bg3+ Kh1 Bf3#`

## Design

- Register the exact sequence under every rotation and reflection without inferring alternatives.
- Add a rendered-piece `mate in 8 ish K` animation.
- Test every White choice and the final checkmate, plus the help metadata.

## Verification

Run the focused Phase 2 tests, production build, and fast loop verifier, then load its verified loop at `cursor=0`.
