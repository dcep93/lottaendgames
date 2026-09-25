# r6 protection alternatives

Immediate king protection is sufficient for r6: candidates with king-protected knights tie, even when one additionally has stable bishop protection. If neither has king protection, prefer stable bishop protection; if neither has either defense, compare the existing drift tuple and central-16 proximity. Modal text matches the requested wording.

The loaded Ba8/Ke5/Nf4 versus Kf8 position now prefers **Bd5 and Be4**, tied. Nd5 receives no extra credit for adding bishop protection to a king-protected knight.

## Targeted loop recheck

**5 of the previous 111 verified four-ply cycles survive.** All 100 previously found king shuffles with a stably bishop-protected knight are broken. A bounded broader recheck of archived witnesses yields **81 verified four-ply cycles**, including 77 bishop shuffles and four knight shuffles. This is a known lower bound, not a full-domain total or estimate; prior and archive cohorts differ.

The accompanying JSON records the number of archived witnesses checked and ten-plus-two current examples. Every example independently passes preferred White moves, legal Black replies, exact closure, D4 distinction, and terminal/degenerate exclusion on every ply. Examples favor the widest White-piece bounding rectangles available in the known set. The largest motif claim applies to this set only.

## Validation

64 focused tests and the TypeScript/Vite build pass. D4 tests explicitly check that adding bishop protection cannot break a tie between king-protected knights, and that king protection still wins over bishop protection alone.
