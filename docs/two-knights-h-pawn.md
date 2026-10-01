# Two knights versus the h-pawn

The policy uses exactly three stages:

1. **r3 — Blockade the pawn.** Minimize the worst-case number of White moves to a blockade from which r2 can force entry into r1.
2. **r2 — Lock the king.** Keep a knight directly in front of the pawn and minimize White moves to the finishing net.
3. **r1 — Deliver checkmate.** Release the blockade when safe and force mate inside the same corner cage.

Every legal Black reply is considered. Once a stage is entered, the selected policy cannot return to an earlier stage. Moves entering r1 from outside it retain their r2 or r3 attribution. Immediate mates outside this construction do not bypass the blockade requirement.

## Exact domain

White has a king and two interchangeable knights. Black has a king and an h-pawn on h2–h7. Both turns are indexed. There are no a-pawns, reflections, or color reversals. Captures are excluded, including White capturing the pawn. The sole material exception is promotion on h1 when **all four promotion choices allow immediate mate**.

A lock seed has a blockading knight, plus a White king and guarding knight that confine Black's king to a 3×3 corner box after removing the blockader from the attack map. The Black pawn remains an occupied square in this geometric test. The guarding knight cannot be captured. The solver additionally requires a forced mate that never lets Black leave that same box. This is a precise, conservative definition of the requested cage, not a claim to cover every theoretical KNNKP win.

Knight capture is deliberately excluded even when mate remains possible. For example, after `...Kxh2`, White can force mate in seven because Black's h-pawn eventually blocks its own king's escape. Black need not choose the capture; it is a losing defensive option, and the shown post-capture continuation withstands every legal defense. [Replay this excluded finish on Lichess](https://lichess.org/analysis/pgn/%5BFEN%20%228%2F8%2F8%2F8%2F8%2F4K2p%2F4N1kN%2F8%20b%20-%20-%200%201%22%5D%0A%0A1...%20Kxh2%202.%20Kf3%20Kh1%203.%20Kf2%20Kh2%204.%20Nc3%20Kh1%205.%20Ne4%20Kh2%206.%20Nd2%20Kh1%207.%20Nf1%20h2%208.%20Ng3%23%201-0#0).

## Certified policy and audit

| Side to move | Legal five-piece positions | Certified by this method | Fresh-clock fifty-move failures | Longest forced policy line |
|---|---:|---:|---:|---:|
| White | 32,258,074 | 3,049,251 | 2,287,984 | 116 White moves |
| Black | 37,776,690 | 835,543 | 652,802 | 115 White moves |

These counts distinguish the two knights only by their occupied squares; they do not divide by board symmetries. Legal counts include terminal positions. Certified White starts comprise 3,690 r1 positions, 43,117 r2 positions, and 3,002,444 r3 positions. The longest r3 setup takes 68 White moves.

The policy optimizes each phase separately with the fifty-move clock ignored. Fifty-move failures count certified starts where Black can reach a nonterminal position after 100 consecutive plies without a pawn move, starting with a fresh clock. Pawn advances and promotion reset the clock; checkmate on the threshold move takes precedence. These failures do not mean the position is theoretically drawn, or that a different clock-aware policy could not win. The live trainer still terminates at the fifty-move threshold.

The native audit checks 3,884,171 certified-node distance equations, all selected White moves, all legal Black responses, stage closure, and absence of cycles. It caches continuation lengths and maximum quiet intervals across starts. Independent chess.js checks cover 10,889 sampled native move lists, all 192 promotion finishing edges, 4,509 sampled exported policy edges, and 37 complete worst-resistance paths, including the longest White-start path. Forward/predecessor sampling checks 2,895,096 edges.

## Browser behavior

The old back-rank start `3k4/7p/8/8/8/8/8/1N1K2N1 w - - 0 1` is **uncertified under this method**. It is not reported as a theoretical loss. Standard now uses `3k4/7p/8/8/8/6N1/8/1N1K4 w - - 0 1`; training starts inside a certified finishing net. Legal h-pawn inputs can be shared independently of either catalog seed.

A position absent from the table displays **Uncertified position**, with no best-move recommendation. A user move outside the certified domain likewise stops recommendations. The notes explain the capture exclusion and link to the example above.

The browser downloads a 12,163,656-byte gzip once, verifies SHA-256, and holds a 31,078,352-byte lookup. A recommendation uses binary search among 3,884,794 sorted records; there is no browser game-tree search. Failed downloads have a retry action and sessions wait for a complete table.

## Rebuilding

Run `npm run generate:two-knights-pawn` in `app/`. See [solver documentation](../scripts/two-knights-pawn/README.md). Generated metadata, histograms and fingerprints are stored in `app/src/mate/rules/twoKnightsPawnTableData.json`. Large intermediate arrays are ignored. The previous heuristic/construction routes and their generator have been removed.
