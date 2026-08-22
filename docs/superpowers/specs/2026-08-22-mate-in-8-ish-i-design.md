# Mate in 8 ish I Design

## Goal

Add the currently demonstrated Phase 2 sequence as lettered flow I:

`Kf2 Kh2 Bg4 Kh1 Bc3 Kh2 Be5+ Kh1 Bf3#`

The canonical starting position is `8/8/8/8/8/5K2/8/3BB2k w - - 0 1`.

## Design

- Register the exact sequence, plus every rotation and reflection, in the existing Phase 2 pattern graph.
- Record only the White moves from that sequence as valid flow-I choices. Do not infer alternate waiting moves or broaden another flow.
- Add a `mate in 8 ish I` animated note board using the existing rendered-piece frame generator.
- Keep the animation caption specific to this route through mate.

## Verification

- Add a focused test that walks the complete sequence, requires every White move to be ideal, and confirms checkmate.
- Extend the help-board test to require flow I, its starting FEN, and its ten animation frames.
- Run the focused Phase 2 tests, minimal-policy tests, TypeScript production build, and fast loop verifier.
