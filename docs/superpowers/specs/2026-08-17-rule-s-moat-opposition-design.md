# Rule S Moat Opposition

## Goal

Recognize both moat-anchored Rule S squeeze bundles and give Rules S and T one explicit definition of moat opposition.

## Moat opposition

For knight-separated kings, retain the existing King moat halfway along the two-square component of their displacement. A White move forces moat opposition when every legal Black reply either:

1. places Black's king in direct king opposition to White's king; or
2. increases Black's distance from the King moat.

Add this guide note:

> Moat opposition means Black takes king opposition or widens the King moat.

## Rule S geometry and behavior

Rule S remains Phase 1-only and immediately before Rule T. Derive both squeeze bundles through the existing square opposite the moat from Black's king. Each bundle uses one of the two diagonal orientations through that anchor. Its tertiary diagonal is parallel to its primary diagonal and passes through Black's king.

Evaluate each bundle independently. A Rule S bundle is prepared when a bishop occupies its primary diagonal. Prefer a move by the other bishop when it:

1. lands on the matching tertiary diagonal;
2. checks Black's king without allowing an immediate bishop capture; and
3. forces moat opposition.

If no qualifying tertiary check exists, retain the opposition fallback from the prepared bundles. The White king must take direct opposition while strictly increasing its absolute squeeze-projection distance from that bundle's primary diagonal.

The rendered wording becomes:

> **rule s** — Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal to force moat opposition or otherwise take opposition, stepping away from the primary squeeze diagonal.

In `2B5/2B5/8/1k6/3K4/8/8/8 w - - 2 2`, the King moat is the c-file. One bundle has primary `a5–b6–c7` and tertiary `a4–b5–c6–d7`. `Bc7` prepares that bundle, and `Bd7+` forces every Black reply either into opposition or farther from the c-file, so `Bd7+` is uniquely correct under Rule S.

## Rule T

Rule T remains Phase 1-only, bishop-only, and keeps its current reply-count tie-break. It uses the shared moat-opposition predicate without changing its scoring behavior.

The rendered wording becomes:

> **rule t** — When the kings are a knight's move apart, use a bishop to force the Black king to take moat opposition.

## Presentation

Keep the existing Rule S diagram and all rule ordering. Add the moat-opposition note to the Two Bishops guide notes and update exact Rule S and Rule T wording assertions.

## Verification

- `Bd7+` is uniquely ideal under Rule S in the supplied position.
- Both Black replies after `Bd7+` satisfy moat opposition.
- Both moat-anchored bundles work under every rotation and reflection.
- Existing Rule S tertiary check and away-stepping fallback remain correct.
- Existing Rule T bishop-only behavior and reply-count tie-break remain correct.
- Rules U/V/W, king closer, Black's reply policy, phase detection, and existing diagrams do not change.
- Focused rules, presentation, diagram drift, lint, build, and `git diff --check` pass.
- Find and open a strict Phase 1 loop, treating entry into Phase 2 as termination.

## Scope

Do not accept arbitrary checks outside the matching tertiary diagonal and do not combine primary and tertiary diagonals from different bundles.
