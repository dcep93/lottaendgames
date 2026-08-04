# Two Bishops Mate-in-Three Pattern Matcher

## Goal

Replace the recursive mate-in-three solver with a direct recognizer for the taught corner mating sequence. The rule should answer whether that particular pattern is available, not solve arbitrary mate-in-three positions.

## Pattern

The canonical orientation uses corner `a8`; all rotations and reflections are equivalent.

### Three-move form

1. Black starts on `a8` and White's king is a knight's move from the corner.
2. White makes a quiet bishop move that preserves or establishes control of `c8` and leaves Black exactly one legal move, `Kb8`.
3. White gives a bishop check that leaves Black exactly one legal move, `Ka8`.
4. White gives checkmate with a bishop.

### Two-move suffix

When Black is already on `b8`, the rule recognizes a bishop check whose only legal reply is `Ka8`, followed by a bishop checkmate. This preserves the previously approved mate-in-two behavior under the `mate in 3` label.

## Mechanics

- Use board-relative corner and edge geometry, so the matcher is D4-symmetric without orientation-specific policy branches.
- Inspect only the forced sequence above. Do not recursively search arbitrary continuations, score proof distance, consult history, or retain a transposition cache.
- Precompute the matching first moves once for the source-position candidate batch.
- The rule applies only when at least one legal candidate completes the exact sequence. Matching candidates receive 2 or 3 turns; all other candidates receive the nonmatching sentinel.
- Universal mate, piece safety, and stalemate priorities remain ahead of this rule.
- If the source kings resemble the setup but the required bishop sequence is unavailable, the rule does not participate and the next visible priority decides immediately.

## Verification

- Preserve the existing `Bc8`, forced edge reply, check, forced corner reply, and mate sequence.
- Preserve the former `Bg3+` mate-in-two suffix.
- Check both forms under all D4 transforms.
- Add the reported post-`Be7 ...Kb8` position as a negative matcher fixture.
- Benchmark cold analysis of that position and require a material reduction from the measured 6.66 seconds.
- Run only focused Two Bishops rule/presentation tests, TypeScript, and diff checks.

## Scope

No rendered-copy change, unrelated policy change, full mate suite, exhaustive loop census, commit, push, deployment, or archive synchronization.
