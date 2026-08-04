# Two Bishops Wall-Waiting Fallback Design

## Goal

Allow a bishop waiting move that preserves an established Phase 2 wall when White's king cannot make genuine progress.

## Rendered Rule

> **king closer** — Bring White's king closer to Black's king. In Phase 2, if the king cannot get closer, make a bishop waiting move that maintains the wall.

## Behavior

Within the existing `king closer` priority, rank surviving moves in this order:

1. King moves that strictly reduce Manhattan distance to Black's king, with the smallest resulting distance best.
2. In Phase 2, when a valid off-Black-edge wall already exists, bishop moves that preserve that same valid wall. All such waiting moves tie.
3. Other king moves, with the smallest resulting Manhattan distance best.
4. Other moves.

Earlier priorities remain authoritative. In particular, unsafe moves and stalemates are removed before this rule compares progress or waiting moves.

## Constraints

- Use only the current board position.
- Preserve D4 symmetry.
- Do not add a visible rule, destination tie-break, history check, or lookahead.
- A bishop move that merely creates a new wall is not a waiting move; the wall must already exist.

## Verification

- Assert `Be5` and every other legal wall-preserving bishop wait remain tied in the supplied position, while `Ke6` no longer wins.
- Retain a regression where a genuinely closer king move outranks waiting.
- Check the rendered text and score/mechanic alignment.
- Run focused Two Bishops rules, relevant presentation tests, TypeScript, diagram/diff checks, and the fail-fast loop search.

## Non-goals

- Do not choose one waiting bishop destination over another.
- Do not change Phase 2, wall geometry, sequester, or universal priorities.
- Do not run the full mate suite, commit, push, or deploy.
