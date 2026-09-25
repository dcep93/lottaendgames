# Remove the stable bishop protection distance cutoff

Stable bishop protection no longer depends on Black being within two king steps of the knight. White-king blockers, edge-adjacent exclusions, and x-ray control are unchanged. The visible rule text is unchanged.

The reported Be8/Na4/Kh1 versus Ka1 position now prefers Kg2, retaining bishop protection while the king approaches. In the currently loaded Ba6/Kb6/Nf1 versus Kd5 position, Bd3 is preferred.

## Saved four-ply witness check

Replayed all 4,847 D4-distinct four-ply cycles from the full 76ac0b4 audit, retaining preferred White moves and legal Black replies. **882 survive; 3,965 are broken. All 3,714 witnesses from the previous largest drift/protection motif are broken.** These are saved-witness counts, not current full-domain loop totals. Alternate cycles through old positions and newly introduced cycles have not been enumerated. The last full-audit baseline is preserved.

All displayed examples were independently verified, remain D4-distinct, exclude terminal/degenerate positions at every ply, and obey the middle-16 display filter.

## Current motifs among surviving witnesses

- 516: knight shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense.
- 170: knight shuffle; bishop outside center throughout; knight king-protected throughout; alternates stable bishop defense.
- 70: bishop shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
- 47: bishop shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense.
- 30: bishop shuffle; bishop enters/leaves center; knight king-protected throughout; no stable bishop defense.
- 23: knight shuffle; central bishop throughout; knight king-protected throughout; alternates stable bishop defense.
- 18: knight shuffle; central bishop throughout; knight king-protected throughout; no stable bishop defense.
- 3: bishop shuffle; bishop outside center throughout; knight without king protection; no stable bishop defense.
- 2: bishop shuffle; bishop enters/leaves center; knight without king protection; no stable bishop defense.
- 2: bishop shuffle; bishop outside center throughout; knight king-protected throughout; stable bishop defense.
- 1: king shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense.

## Ten examples from the largest motif

1. [Nb3 Kc2 Na1+ Kc3](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/8/2k5/K7/N7_w_-_-_0_1&moves=Nb3,Kc2,Na1%2B,Kc3&cursor=0) — `4B3/8/8/8/8/2k5/K7/N7 w - - 0 1`.
2. [Nc2 Kb3 Na1+ Kc3](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/8/2k5/8/NK6_w_-_-_0_1&moves=Nc2,Kb3,Na1%2B,Kc3&cursor=0) — `4B3/8/8/8/8/2k5/8/NK6 w - - 0 1`.
3. [Nc2+ Kb3 Na1+ Ka3](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/8/k7/8/NK6_w_-_-_0_1&moves=Nc2%2B,Kb3,Na1%2B,Ka3&cursor=0) — `4B3/8/8/8/8/k7/8/NK6 w - - 0 1`.
4. [Nc3 Kb4 Na2+ Ka5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/k7/8/8/NK6/8_w_-_-_0_1&moves=Nc3,Kb4,Na2%2B,Ka5&cursor=0) — `4B3/8/8/k7/8/8/NK6/8 w - - 0 1`.
5. [Nc3 Kb4 Na2+ Kc4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/2k5/8/NK6/8_w_-_-_0_1&moves=Nc3,Kb4,Na2%2B,Kc4&cursor=0) — `4B3/8/8/8/2k5/8/NK6/8 w - - 0 1`.
6. [Nc4 Kd3 Nb2+ Kd4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/3k4/1K6/1N6/8_w_-_-_0_1&moves=Nc4,Kd3,Nb2%2B,Kd4&cursor=0) — `4B3/8/8/8/3k4/1K6/1N6/8 w - - 0 1`.
7. [Nd3 Kc4 Nb2+ Kd4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/3k4/8/1NK5/8_w_-_-_0_1&moves=Nd3,Kc4,Nb2%2B,Kd4&cursor=0) — `4B3/8/8/8/3k4/8/1NK5/8 w - - 0 1`.
8. [Nd3+ Kc4 Nb2+ Kb4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/1k6/8/1NK5/8_w_-_-_0_1&moves=Nd3%2B,Kc4,Nb2%2B,Kb4&cursor=0) — `4B3/8/8/8/1k6/8/1NK5/8 w - - 0 1`.
9. [Nb2+ Kd4 Nd3 Kc4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/2k5/3N4/2K5/8_w_-_-_0_1&moves=Nb2%2B,Kd4,Nd3,Kc4&cursor=0) — `B7/8/8/8/2k5/3N4/2K5/8 w - - 0 1`.
10. [Ne4 Kd3 Nf2+ Kd4](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/8/3k4/5K2/5N2/8_w_-_-_0_1&moves=Ne4,Kd3,Nf2%2B,Kd4&cursor=0) — `2B5/8/8/8/3k4/5K2/5N2/8 w - - 0 1`.

## Two from another motif

1. [Nb3 Kc2 Na1+ Kc3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/2k5/K7/N7_w_-_-_0_1&moves=Nb3,Kc2,Na1%2B,Kc3&cursor=0) — `6B1/8/8/8/8/2k5/K7/N7 w - - 0 1`.
2. [Ne3 Kf4 Ng2+ Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/4k3/8/8/5KN1/8_w_-_-_0_1&moves=Ne3,Kf4,Ng2%2B,Ke5&cursor=0) — `B7/8/8/4k3/8/8/5KN1/8 w - - 0 1`.

## Validation

Production build passed. Bishop-knight tests: 135 passed; the same four failures were reproduced before and after this change (recorded shuttles, r7 knight proximity, and two opposite-precage expectations). Distance-cutoff expectations were updated, and the Kg2 result plus defense retention after every Black reply were verified in all eight D4 orientations.
