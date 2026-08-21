# Rule T Behind-Moat Design

## Design

Rule T will require its forcing bishop to start on the moat or behind it on White's side. The bishop may cross or finish on either side after it moves. The existing moat-opposition forcing test remains unchanged.

The rendered text becomes: “When the kings are a knight's move apart, use a bishop from behind the moat to force the Black king to take moat opposition.”

## Verification

- Reject `Bh3` from `8/3B4/8/8/8/3K4/3B1k2/8 w - - 0 1`.
- Prefer `Bc6+` from `4k3/2B5/5K2/8/8/8/8/7B w - - 22 12` because the bishop starts behind the rank-seven moat and forces `Kf8` into moat opposition.
- Verify the condition under all rotations and reflections.
- Preserve the remaining Rule T forcing corpus or update only expectations directly changed by the new condition.
- Run the focused Two Bishops suite, then find and audit a replacement Phase 1 loop.

## Assumption

“From behind the moat” describes the bishop's source square. The moat itself counts with White's side.
