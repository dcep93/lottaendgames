# Play Best Loop Preference Design

## Goal

Make **Play Best** prefer a complete White/Black turn that returns to the immediately preceding White-turn position. This makes an existing loop visible when the current chess priorities leave more than one best continuation.

This is an application behavior, not a rendered chess rule.

## Scope

The preference applies globally to every mating set through the shared Mate session layer. It affects only **Play Best**. Manual White moves, move correctness, ordered rules, reason labels, and rendered training guidance remain unchanged.

## Selection

1. Get the current ideal White moves from the active rule set.
2. Use the most recent move log's starting FEN as the return target. If no prior completed turn exists, use the existing random behavior.
3. For each ideal White move, calculate the Black candidates using the same prior-position context as normal play.
4. Search only the Black reply pool normal play would use: ideal replies when present, otherwise all legal replies.
5. Keep White/Black pairs whose final position has the same board, turn, castling rights, and en-passant state as the target. Ignore halfmove and fullmove clocks by comparing `positionKey` values.
6. If returning pairs exist, choose uniformly among those pairs and force the selected Black reply while completing the turn.
7. Otherwise retain the existing uniform White selection and normal automatic Black selection.

## Architecture

Add a private session helper that finds returning White/Black pairs without changing the rule-set facade. Extend the internal White-turn completion path so Play Best can supply a preferred Black reply, reusing the replay mechanism already supported by `completeWhiteTurn`.

The public `playWhiteMove` behavior remains unchanged.

## Testing

- A tied ideal White choice prefers the White/Black pair that returns to the preceding position.
- FEN clock differences do not prevent recognizing the return.
- Returning selection stays within ideal White moves and the normal Black reply pool.
- Multiple returning pairs use the existing random dependency uniformly.
- With no returning pair or no previous turn, Play Best preserves its existing selection behavior.
- Manual play remains unaffected.

