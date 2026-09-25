# r6 king protection before stable bishop protection

r6 now compares immediate king protection before stable bishop protection, then retains the existing drift and central-16 preferences. The displayed wording matches the user request.

The loaded `B4k2/8/8/4K3/5N2/8/8/8 w - - 2 2` position chooses **Nd5**, maintaining king defense and adding stable bishop defense. In `B7/8/8/5k2/3K4/8/8/5N2 w - - 0 1`, **Ne3+** (king defense) now beats **Bg2** (bishop defense alone).

## Targeted loop recheck

All **111 previously verified four-ply cycles survive**. This is a recheck of the preceding turn's witnesses, not a fresh full-domain count. No fresh-total estimate is claimed.

- King shuffles, knight stably bishop-protected: 100 cycles.
- Bishop shuffles, knight without stable bishop protection: 6 cycles.
- Knight shuffles, knight without stable bishop protection: 3 cycles.
- King shuffles, knight without stable bishop protection: 2 cycles.

The ten-plus-two examples in `2026-09-25-r6-stable-first.json` were reselected and independently verified with the new policy: preferred White moves, legal Black replies, exact closure, D4 distinction, and terminal/degenerate exclusions at every ply. The largest motif is only asserted among this known set.

## Validation

64 focused tests pass, including all eight D4 orientations of the loaded position and the king-versus-bishop defense priority. TypeScript and Vite production build pass.
