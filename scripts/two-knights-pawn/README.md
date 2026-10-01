# KNN versus h-pawn solver

Run `npm run generate:two-knights-pawn` from `app/`. Requires Python 3 and a C++20 compiler (`clang++`); uses the app's installed `tsx` and `chess.js` for independent verification. Generation is offline, uses several GB of RAM and temporary disk space, and writes its intermediate arrays into ignored `work/`. The browser only downloads the compressed policy and performs binary searches.

See [the method and audit](../../docs/two-knights-h-pawn.md) for the exact supported domain and limitations.

Index: `(((pawnRank-2)*64 + whiteKing)*2016 + knightPair)*64 + blackKing`, a1=0. Knight pair rank is `a*(127-a)/2 + b-a-1`, with a<b. White and Black turns have separate arrays. There are 49,545,216 slots per turn before legality filtering. No a/h reflection or pawn-direction transform is used.

Retrograde distances count White moves. White nodes minimize `1 + child`; Black nodes require every legal reply to be solved and take the maximum. Degree counts include unsupported material changes as failure edges. Unsolved and drawn are deliberately not synonyms. Equal-distance ties choose the smallest from/to move code.

The finishing candidate domain confines Black to one fixed 3×3 corner box. Seeds additionally require a geometric king/guarding-knight trap, with the blockading knight removed. Only selected edges reachable from these seeds receive r1 attribution. r2 maintains an occupied knight-blockade square outside r1. r3 reaches the certified r2/r1 region. The audit verifies Bellman equations on certified nodes, selected moves, stage closure, and absence of cycles. It memoizes mating duration and maximum quiet intervals; it does not expand a fresh game tree for every start. Checkmate takes precedence over the clock threshold on the mating move.

Promotions on h1 qualify only if every choice immediately permits mate. All captures are outside the method. `probe.cpp` and `verify-geometry.mts` cross-check native legal move lists against chess.js, including excluded material-changing replies. `check-reverse.cpp` checks forward/predecessor consistency. `verify-promotion.mts` verifies every exported promotion finish. `verify-policy.mts` checks sampled exported moves and full worst-resistance witnesses with chess.js.

The exported file has sorted eight-byte records: a uint32 position-and-turn key followed by a uint32 containing move (bits 0–11), stage (12–13), phase distance (14–21), and remaining worst-case plies (22–31). Black records have no move. The metadata contains the raw SHA-256, source fingerprint, lengths, stage counts, promotion finishes and audit histograms. The runtime verifies the hash after decompression before making recommendations.
