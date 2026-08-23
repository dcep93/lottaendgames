# Runtime White Analysis Cache Design

## Goal

Make repeated best-move calculations for the same position effectively immediate while retaining the existing lazy runtime construction of the Two Bishops Phase-2 graph.

## Design

Each registered mate rule set owns a bounded runtime cache keyed by the full FEN string. The cached value is the immutable `WhitePositionAnalysis`, which already contains ideal moves, the current hint, and move explanations.

- `analyzeWhitePosition`, `idealWhiteMoves`, `currentWhiteHint`, and `explainWhiteMove` share the cached analysis.
- Cache entries are refreshed on access using insertion order as a small LRU.
- The cache holds at most 256 positions per registered rule set.
- Registration replacement creates a fresh cache, so results never survive policy replacement.
- No persistent or build-time cache is added; the Phase-2 graph remains runtime-lazy.

## Verification

Add tests proving that repeated APIs score a FEN once, different FENs score independently, and eviction recomputes the oldest entry. Benchmark the loaded Two Bishops position before and after, then run focused rules tests, Two Bishops tests, build, diagrams, the development verifier, and browser loop replay.
