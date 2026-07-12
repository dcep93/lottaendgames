# Adjacent Move Animation Design

## Goal

When a reader clicks a move that is exactly one move ahead of the board currently shown for that position, the chessboard should animate that move using the existing chessboard library. Longer jumps, backward moves, resets, and branch switches should remain instant.

## Scope

- Apply to the Chapter 5 clickable move playback UI.
- Use `react-chessboard` built-in animation options.
- Do not write custom piece animation code.
- Do not change `chapter_5.json`.

## Behavior

Each active board state should track the rendered FEN, active move token id, and local playback path. A move click is considered adjacent when:

- The clicked token belongs to the same position as the current board state.
- The clicked token path length is exactly one greater than the current board path length.
- Every current path move matches the clicked path prefix.

Only adjacent forward clicks animate. Examples:

- Initial Position 5.1 to `1.Kg5!` animates.
- `1.Kg5!` to the next move in that same local line animates.
- Initial Position 5.1 directly to `Kb3` does not animate.
- `5.Kd2` to prose `1...Kc3!` does not animate because it switches branches.
- Clicking `5.1` to reset does not animate.

## Components

`ChapterViewer` owns the adjacency decision because it knows the current and clicked playback paths. It passes an `animateNextMove` boolean to `ChessBoard` with the active FEN.

`ChessBoard` remains display-only. It receives `animateNextMove` and maps it to `react-chessboard` options:

- `showAnimations: animateNextMove`
- `animationDurationInMs: animateNextMove ? 220 : 0`

## Testing

- Extend parser/playback tests or add focused helper tests for adjacent path detection.
- Run `npm test`, `npm run build`, and `npm run lint`.
- Browser-check Position 5.1:
  - Adjacent click from the initial position to `1.Kg5!` enables animation.
  - Jump from initial position to `Kb3` stays instant.
  - Reset via `5.1` stays instant.
