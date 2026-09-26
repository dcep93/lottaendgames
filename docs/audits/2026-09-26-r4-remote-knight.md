# r4 leaves room for a distant knight — 2026-09-26

The supplied position (Kd6, Bd5, Na2, Black Kb5) triggered r4 solely because the bishop was adjacent to White king and within two steps of Black. The knight was distant and could play Nc3+ toward the king and the middle 16 without interference.

Removed Black proximity as an independent noncorner r4 trigger. A noncorner bishop must now be adjacent to the noncentral White king AND within two steps of the knight. Existing corner handling remains. No new move search, exceptions, or UI wording. Nc3+ is preferred across all eight D4 transforms.

## Saved-cycle replay

79 of 15,917 baseline D4 four-ply witnesses survive, down from 98. 19 broke and 0 reappeared. All 19 r4/r6 cycles from the previous replay broke. After hiding the 64 all-White-middle-16 cycles, 15 remain visible. These counts do not include newly introduced cycles or establish a new global loop-position total.

Largest visible motif: 8 r6.5/r8 cycles. An attacked bishop retreats; r8 brings it back toward the center. Next: 2 r4/r8 cycles. The orientation and distinct-White-layout filters produce five examples of the former and one of the latter, rather than ten plus two.

Examples verified for preferred White moves, legal Black replies, exact four-ply closure, D4 uniqueness, terminal/degenerate exclusions at every ply, and display filters. Full-audit baseline pointer unchanged.

## Validation

Build passes. All 10 r4 regression tests pass. The broad run retains the four pre-existing failures in unchanged BishopProtection, KnightBishopDefense, and OppositePrecage tests. The newly superseded r4 expectation was updated to permit Nf2 instead of forcing separation with a remote knight.

## Examples

- **r6.5 ↔ r8**: [Bb7, Kc7, Ba8, Kb8](http://localhost:5173/mate/bishop-knight#fen=Bk6/8/8/2NK4/8/8/8/8_w_-_-_0_1&moves=Bb7,Kc7,Ba8,Kb8&cursor=0)
- **r6.5 ↔ r8**: [Bc6, Kc7, Ba4, Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/4K3/B3N3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kd8&cursor=0)
- **r6.5 ↔ r8**: [Ba4, Kb8, Bc6, Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3KN3/8/8/8_w_-_-_0_1&moves=Ba4,Kb8,Bc6,Kc7&cursor=0)
- **r6.5 ↔ r8**: [Ba4, Kd6, Bc6, Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3NK3/8/8/8_w_-_-_0_1&moves=Ba4,Kd6,Bc6,Kc7&cursor=0)
- **r6.5 ↔ r8**: [Bc6, Kc7, Ba4, Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/8/8/B2KN3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kc8&cursor=0)
- **r4 ↔ r8**: [Be4, Kb5, Ba8, Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2k5/2N5/3K4/8/8_w_-_-_0_1&moves=Be4,Kb5,Ba8,Kc5&cursor=0)
