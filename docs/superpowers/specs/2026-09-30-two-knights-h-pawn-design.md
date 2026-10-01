# Two knights versus an h-pawn: certified stages

Approved design: replace the old KNNKP heuristics and witness routes with an offline minimax policy. Only White KNN versus Black K and an h2–h7 pawn is supported. The two knights are interchangeable; board reflections are not used. Solve without the fifty-move limit and report clock failures separately.

r1 — Deliver checkmate. A locking seed has a knight directly in front of the pawn. Removing that knight from the attack map leaves Black's king confined by White's king and guarding knight to a connected corner region contained in a 3×3 corner box. It must also have a proved forced mate with Black remaining in that box. Compute the minimum worst-case finishing distance. r1 consists only of the selected White edges and all Black replies reachable from these locking seeds; a move entering this set from outside is not relabeled r1.

r2 — Lock the king. The target is the certified r1 region. Outside that region a knight must remain directly in front of the pawn at every node. Solve the minimum worst-case number of White moves until entry. Any legal Black reply that leaves the supported material/domain prevents certification.

r3 — Blockade the pawn. Solve the minimum worst-case number of White moves until entering the certified r2/r1 region. Temporary, dislodgeable blockades are not goals. Checkmates outside the r1 continuation graph are not shortcuts around the stages.

Each stage uses White minimum and Black maximum over all legal replies. Choose a deterministic minimum-distance White move. Never substitute a later heuristic if a node is unsupported. Pawn capture and knight loss are outside this method. Promotion is permitted only within r1 when every promotion choice allows immediate checkmate. On 2026-10-01 the user explicitly rejected knight-loss continuations even when they remain theoretical wins. Unsupported does not mean theoretically drawn. Runtime loads packed, checksummed lookup data and performs no search.

Verification: independent chess.js checks of legal moves and witness paths; exhaustive Bellman/progress and reachable-edge checks; cached maximum mating duration; worst-case fifty-move failures from a fresh clock, with live supplied-clock accounting. Preserve other endgames. Replace obsolete KNN-specific data, helpers, tests and generation scripts.

The teaching notes link to this deliberately excluded exception: [knight capture followed by forced mate in seven](https://lichess.org/analysis/pgn/%5BFEN%20%228%2F8%2F8%2F8%2F8%2F4K2p%2F4N1kN%2F8%20b%20-%20-%200%201%22%5D%0A%0A1...%20Kxh2%202.%20Kf3%20Kh1%203.%20Kf2%20Kh2%204.%20Nc3%20Kh1%205.%20Ne4%20Kh2%206.%20Nd2%20Kh1%207.%20Nf1%20h2%208.%20Ng3%23%201-0#0).
