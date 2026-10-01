# KNN versus h-pawn solver

Run `npm run generate:two-knights-pawn` from `app/`. Requires Python 3 and a C++20 compiler (`clang++`); uses the app's installed `tsx` and `chess.js` for independent verification. Generation is offline, uses several GB of RAM and temporary disk space, and writes its intermediate arrays into ignored `work/`. The browser only downloads the compressed policy and performs binary searches.

See [the method and audit](../../docs/two-knights-h-pawn.md) for the exact supported domain and limitations.

Index: `(((pawnRank-2)*64 + whiteKing)*2016 + knightPair)*64 + blackKing`, a1=0. Knight pair rank is `a*(127-a)/2 + b-a-1`, with a<b. White and Black turns have separate arrays. There are 49,545,216 slots per turn before legality filtering. No a/h reflection or pawn-direction transform is used.

Retrograde distances count White moves. White nodes minimize `1 + child`; Black nodes require every legal reply to be solved and take the maximum. Degree counts include unsupported material changes as failure edges. Unsolved and drawn are deliberately not synonyms. Equal-distance ties choose the smallest from/to move code.

The finishing candidate domain confines Black to one fixed 3×3 corner box. Seeds additionally require a geometric king/guarding-knight trap, with the blockading knight removed. Only selected edges reachable from these seeds receive r1 attribution. r2 maintains an occupied knight-blockade square outside r1. r3 reaches the certified r2/r1 region. The audit verifies Bellman equations on certified nodes, selected moves, stage closure, and absence of cycles. It memoizes mating duration and maximum quiet intervals; it does not expand a fresh game tree for every start. Checkmate takes precedence over the clock threshold on the mating move.

Promotions on h1 qualify only if every choice immediately permits mate. All captures are outside the method. `probe.cpp` and `verify-geometry.mts` cross-check native legal move lists against chess.js, including excluded material-changing replies. `check-reverse.cpp` checks forward/predecessor consistency. `verify-promotion.mts` verifies every exported promotion finish. `verify-policy.mts` checks sampled exported moves and full worst-resistance witnesses with chess.js.

The exported file has sorted eight-byte records: a uint32 position-and-turn key followed by a uint32 containing move (bits 0–11), stage (12–13), phase distance (14–21), and remaining worst-case plies (22–31). Black records have no move. The metadata contains the raw SHA-256, source fingerprint, lengths, stage counts, promotion finishes and audit histograms. The runtime verifies the hash after decompression before making recommendations.

## A-file strategy exploration

`explore-a-file.cpp` is a separate offline experiment, not the browser policy. It
counts every legal Black reply; reaching files f–h fails rather than suppressing
those replies. Its four finishing cages are a8–b8, a8–a7, a1–b1 and a1–a2.
A tighter confinement inside the same cage also qualifies. It preserves the
capture/promotion domain described above.

Phase and finishing cage are explicit search state. r2 maintains a knight
blockade until a geometrically locked, winning seed. r3 must reach a certified
blockaded state; unblocked r1 descendants are not setup goals. r1 never leaves
its selected two-square cage, and terminal mates must have Black on file a.
Each phase minimizes its own worst-case number of White moves; this does not
claim globally shortest total mate. Clock bounds are measured separately over
all Black replies, not inferred from the displayed longest line.

```sh
clang++ -O3 -std=c++20 scripts/two-knights-pawn/explore-a-file.cpp -o scripts/two-knights-pawn/work/explore-a-file
scripts/two-knights-pawn/work/explore-a-file scripts/two-knights-pawn/work/a-file > scripts/two-knights-pawn/work/a-file-results.txt
python3 scripts/two-knights-pawn/verify-a-file.py scripts/two-knights-pawn/work/a-file > scripts/two-knights-pawn/work/a-file-verification.txt
python3 scripts/two-knights-pawn/summarize-a-file.py
```

The independent verifier requires `python-chess`. It checks every selected White
move, every legal Black reply, each lock seed with the blockader removed, phase
transitions, cage confinement, promotions, mating distances and quiet-clock
bounds. Large tables and the proof graph stay in ignored `work/`.
