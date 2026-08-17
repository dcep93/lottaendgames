# Two Bishops Rule W Priority Partial Credit Design

## Goal

Credit control of Rule W's priority flank diagonal as a setup step without restoring credit for flank geometry created by a White king move.

## Behavior

- Keep completed post-move flank pairs as Rule W's best result.
- When the starting kings are a knight's move apart, Rule U is inactive, the starting position does not already complete a flank pair, and a legal move can occupy the existing priority flank diagonal, activate priority setup.
- Under priority setup, an incomplete candidate occupying that starting-position priority diagonal receives partial credit ahead of other incomplete candidates.
- Rule W applies when either a candidate completes a post-move flank pair or priority setup is available.
- Compare completed-pair status first and priority-flank occupancy second. A complete pair can never lose to partial credit.
- Do not derive priority partial credit from king geometry created only after White moves.

## Supplied positions

From `8/8/8/6k1/4K3/B7/2B5/8 w - - 2 2`, the kings already begin a knight's move apart. `Bb2` moves a bishop onto the priority flank diagonal and must receive Rule W partial credit.

From `8/5k2/8/5K2/6BB/8/8/8 w - - 0 1`, the kings do not begin with Rule W geometry. `Kg5` creates knight-step geometry only after moving and leaves the other bishop screened by White's king. It must not activate Rule W or receive priority partial credit.

## Presentation

Keep Rule W's order, rendered text, and diagram unchanged.

## Testing

- Assert `Bb2` activates Rule W through priority setup and beats `king closer`.
- Assert complete pairs remain better than priority partial credit.
- Preserve the screened `Kg5` regression.
- Assert priority setup and the screened exclusion under every D4 transform.
- Run focused Two Bishops and presentation tests, diagram consistency, lint, build, and whitespace validation.

## Scope

No Rule WW, Rule U, flank geometry, phase, help-copy, or diagram changes are included.
