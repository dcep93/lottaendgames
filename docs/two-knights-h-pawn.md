# Two knights versus the h-pawn: custom tablebase

The trainer uses one exact tablebase, replacing r1/r2/r3. Standard starts with
White Kf1, Ng1, Nh1 versus Black Ka8/h4: **mate in 29** (57 plies). Start Over
alternates the entire board by file reflection: White Kc1, Na1, Nb1 versus
Black Kh8/a4. Reflected lookups reuse the same table, including stationary Qa1
after promotion. Training keeps its existing seed.

The table was generated from `k7/8/8/8/3KN2p/7N/8/8 w - - 0 1`: White Kd4, Ne4, Nh3;
Black Ka8, h4. White forces mate in **41 plies (21 White moves)** against
Black's strongest resistance.

## Custom rules

- Neither side may capture. Both White knights move freely.
- The fifty-move clock and repetitions do not end the exercise.
- The h-pawn promotes only to a queen on h1. That queen cannot move or capture,
  but its normal attacks still give check and restrict White's king. Pieces
  block its rays normally.
- There are no blockade, cage, phase or forbidden-file conditions.
- For the reflected orientation, the pawn is on the a-file and promotes to a
  stationary queen on a1; all rules reflect along with the board.
- Checkmate and stalemate use this game's permitted moves. In particular,
  Black cannot evade mate by moving the stationary queen.

This is a tablebase for these custom rules, **not an ordinary chess tablebase**.
Promotion cannot simply be discarded: every permitted Black reply is included,
even when it prevents White from forcing mate.

## Recommendations and coverage

White receives one deterministic move minimizing the worst-case plies to mate.
Black's preferred replies include **every** move maximizing that distance.
Other permitted moves remain playable, and the resulting position is looked up
again. No route history is needed.

The table covers every state reachable from the generation root through
**any** permitted moves, including mistakes by either side. It includes both
sides to move and promoted-queen states. Knight identities are interchangeable;
the stored h-file table has no symmetry reduction, while runtime a-file
positions are mapped to their h-file reflection. Move counters do not change the
lookup key.

| Material | Forced White mate | No forced White mate | Total reachable |
|---|---:|---:|---:|
| Stationary queen h1 | 771 | 9,611,484 | 9,612,255 |
| Pawn h2 | 10,533 | 11,606,021 | 11,616,554 |
| Pawn h3 | 1,199,356 | 10,429,112 | 11,628,468 |
| Pawn h4 | 5,186,905 | 6,360,222 | 11,547,127 |
| **Total** | **6,397,565** | **38,006,839** | **44,404,404** |

Counts include terminal states. “No forced mate” covers draws and White losses;
it does not claim to distinguish those outcomes or optimize their duration.
These positions retain manual play. Black's replies that deny White a forced
mate are marked separately from replies that restore a White win.

An absent entry means **outside tablebase coverage**, not a draw. Old positions
with a pawn on h5–h7 are outside this start's reachable domain. Invalid custom
moves in old replay links produce an explanation rather than silently opening
another starting position.

## Computation and verification

A retrograde attractor starts at Black checkmates. White needs one winning
successor and minimizes distance; Black needs all successors winning and takes
the maximum. Each ply costs one. Unresolved nodes have no forced White mate.
A separate traversal from the generation root follows all permitted moves and
exports only its reachable states.

The native audit checks the minimax equation at every legal indexed state,
validity of every successor and predecessor, matching totals of **441,998,829
forward and reverse edges**, and 53,833 sampled forward/reverse edge memberships.
Every exported successor is checked for coverage. These equations also certify
that selected winning moves decrease distance, and that Black can stay outside
the White-winning attractor in non-winning states.

Independent chess.js checks compare 414 fixture positions and 3,799 permitted
moves, including promoted states and terminals, and replay the entire 41-ply
worst-resistance witness. Runtime tests additionally verify values, optimal
reply sets, manual deviations, high clocks and cold shared links.

The generated asset is **6,846,342 bytes compressed**, containing a
**97,066,376-byte** reachable bitmap and packed distances. The browser builds a
small rank index; lookup uses that index and an array read, without tree search.
SHA-256 and binary structure are checked before recommendations become available.
The local Node 25 benchmark measured 3.8 microseconds per lookup (including FEN
parsing), 0.64 milliseconds per root recommendation, and about 107 milliseconds
for decompression plus installation. Resident table/index storage is about
97.2 MB; download, checksum and temporary decompression buffers add transient
memory. These are local measurements, not browser/device performance guarantees.

## Historical capture example

In ordinary chess, a knight capture can sometimes leave White with forced mate:
`...Kxh2` in the example below permits mate in seven because Black's h-pawn helps
block its own king. That capture is **prohibited in this custom game**. This is
kept as an explanatory example, not a tablebase route.
[Replay the excluded capture on Lichess](https://lichess.org/analysis/pgn/%5BFEN%20%228%2F8%2F8%2F8%2F8%2F4K2p%2F4N1kN%2F8%20b%20-%20-%200%201%22%5D%0A%0A1...%20Kxh2%202.%20Kf3%20Kh1%203.%20Kf2%20Kh2%204.%20Nc3%20Kh1%205.%20Ne4%20Kh2%206.%20Nd2%20Kh1%207.%20Nf1%20h2%208.%20Ng3%23%201-0#0).

## Rebuilding

Run `npm run generate:two-knights-pawn` from `app/`.
See [the generator and binary format](../scripts/two-knights-pawn/README.md).
The former stage generator and its served policy have been removed. The
separate a-file strategy experiment remains historical and is not used by the
trainer.
