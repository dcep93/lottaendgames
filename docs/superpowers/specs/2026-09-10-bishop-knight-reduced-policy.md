# Bishop-and-knight reduced policy

Remove original priorities 5 (build the wall), 6 (edge cage), 7 (knight key square), and 9 (coordinate pieces). Keep mate, pieces safe, no stalemate, mating net, and king closer. Remove the four rules from selection and displayed priorities; retain shared score calculations used by the surviving rules.

“Show a line” means a minimal non-mating witness: a loop or a 50-move draw. Load it at cursor zero in the sole in-app browser tab and provide a durable replay hyperlink. Stop once a suitable witness is verified; do not launch a full audit unless requested.

From `8/6N1/6k1/8/B7/3K4/8/8 w - - 0 1`, `1. Ne8 Kf5 2. Ng7+ Kg6` returns to the exact starting board and side to move. Both White moves are selected by the reduced policy; both Black moves are legal. Four plies is the shortest possible exact cycle in this position: White cannot restore its moved piece in a single turn.

The regression verifies active rule membership, White move selection, legal replay, absence of terminal outcomes, and exact repetition. Registration, retained mating-net lookup, TypeScript, and whitespace checks pass. No claim of exhaustive termination is made.
