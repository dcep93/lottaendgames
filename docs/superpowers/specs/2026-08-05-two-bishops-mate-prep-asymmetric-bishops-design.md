# Two Bishops Mate-Prep Asymmetric Bishops Design

## Goal

Replace mate-prep's requirement that both bishops can reach their reference diagonals with the user-approved asymmetric current-board condition.

## Mechanic

Keep the exact Phase 2 king stencil, D4 symmetry, no translations, and terminal opposition move. Under the canonical orientation, the bishop gate passes when either:

1. The dark-squared bishop already occupies the `c1–h6` diagonal; or
2. The light-squared bishop already occupies the `d1–h5` diagonal and the dark-squared bishop has a legal move onto `c1–h6`.

“Already controls” means physically occupying the named diagonal. “Can reach” means at least one currently legal bishop move lands on the named diagonal.

The loaded position `8/7k/5K2/8/8/6B1/8/5B2 w - - 0 1` no longer qualifies: its dark bishop can reach the transformed dark diagonal, but neither bishop already occupies its required diagonal.

## Alternatives

- The stated two-branch condition is selected because it exactly models readiness versus one remaining bishop-preparation move.
- Keeping symmetric one-move access is rejected because it activates before either diagonal is established.
- Requiring both bishops already on their diagonals is rejected because it would exclude the explicitly allowed second branch.

## Verification

- Preserve the canonical second-branch fixture and all D4 transforms.
- Add a first-branch fixture where the dark bishop already controls its diagonal and the light bishop is otherwise irrelevant.
- Reject the loaded `g3/f1` arrangement under every D4 transform.
- Preserve the exact king stencil, Phase 2 gate, terminal king move, and translation rejection.
- Run focused Two Bishops tests, TypeScript, diff checks, and an all-Phase-2 fail-fast loop scan.

