# R3: fastest forced central setup

Approved in conversation: implement r3 after r2, before r4, targeting K/B/N on d4/e4/d5/e5 with K and N opposite B's color. Keep mate, piece safety, no stalemate, r1, and r2 precedence. Preserve r1/r2 tables. D4 transformations apply, move counters do not.

Generate offline minimax entry ranks over all legal KBN-v-K placements with every legal Black reply. Export one optimal move per canonical source, retaining symmetry-equivalent choices at runtime. Use ten canonical White-king slots times 64 cubed 16-bit words: twelve move bits and four distance bits; reserve 0xffff for absent entries. Targets have distance zero and defer to r2. The binary is 5 MiB and has a content-hashed URL.

Fetch the binary once on entering the KBN trainer, gate session creation until loaded, and show a retryable error on failure. Other trainers do not load this asset. Node audit tools install the same bytes explicitly. Runtime lookup is bounded D4 canonicalization and direct indexing, with no graph search.

Verification: generator reproducibility; exhaustive legality/rank and all-start duration certificate using fixed r1/r2 continuations; independent chess.js samples and meaningful D4/priority/loading tests; app build. Report actual worst-case distribution rather than treating the prior conservative 45-move bound as a measured result. No unrelated pending changes are included in commits.
