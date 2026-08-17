# Rule S Away Step and Bishop-Only Rule T

## Goal

Prevent Rule S from taking opposition toward its prepared primary squeeze diagonal, and make Rule T exclusively a bishop waiting-move rule.

## Rule S

Rule S remains Phase 1-only and keeps its current tertiary-check branch. Its rendered wording becomes:

> **rule s** — Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal to force opposition or otherwise take opposition, stepping away from the primary squeeze diagonal.

If no safe tertiary check exists, a king move qualifies for Rule S only when:

1. it creates direct opposition with Black's king; and
2. its absolute squeeze-projection distance from the prepared primary diagonal is strictly greater than White's king's starting distance.

If no opposition move satisfies both conditions, Rule S has no preferred moves and Rule T evaluates the position.

## Rule T

Rule T remains Phase 1-only and keeps its existing force condition and reply-count tie-break. Its rendered wording becomes:

> **rule t** — When the kings are a knight's move apart, use a bishop to force the Black king to either take opposition or widen the King moat.

Every White king move fails Rule T. A bishop move satisfies Rule T only when every legal Black reply either takes direct opposition or moves farther from the existing king moat.

## Supplied position

In `8/8/8/8/6K1/3B4/3B1k2/8 w - - 2 2`, `Kf4` takes opposition while moving closer to the primary diagonal, so it does not satisfy Rule S. `Kh3` is a king move, so it does not satisfy Rule T. `Ba6`, `Bb5`, and `Bc4` are tied Rule T bishop waiting moves; the supplied `Ba6` is therefore correct.

## Verification

- Assert the supplied position's three correct moves and Rule T reason.
- Assert `Kf4` fails Rule S and `Kh3` fails Rule T.
- Preserve the safe tertiary-check branch and an opposition fallback that strictly steps away.
- Cover every board rotation and reflection.
- Update exact Rule S and Rule T presentation assertions.
- Keep diagrams, rule order, Rules U/V/W, king closer, Black's reply policy, and phase detection unchanged.
- Run focused rules, presentation, diagram drift, lint, build, and `git diff --check`.
- Find and open a strict Phase 1 loop, terminating any branch that enters Phase 2.

## Scope

Do not add a new priority or redefine primary squeeze geometry or the king moat.
