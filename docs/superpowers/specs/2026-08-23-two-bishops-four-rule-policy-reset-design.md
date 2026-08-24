# Two Bishops Four-Rule Policy Reset Design

## Goal

Reduce the active Two Bishops policy to four chess heuristics while preserving mandatory legality and safety priorities:

1. `rule n`
2. `rule o`
3. `rule w3`
4. `rule w`

Retain the definition and detection of Phase 2.

## Active selection policy

The active ordered rules become:

1. `mate`
2. `bishops safe`
3. `no stalemate`
4. `rule n`
5. `rule o`
6. `rule w3`
7. `rule w`

The first three entries are mandatory correctness safeguards rather than positional bishop heuristics. Every other heuristic is removed from active move selection, including `mate in 8 ish`, Rules AA through B, Q, W1, W2, king closer, WY, and WZ.

Removed heuristic implementations remain dormant in the catalog so they can be restored without discarding tested code.

## Phase 2 and Training Info

Phase 2 detection remains unchanged: Phase 2 exists when a functional bishop wall at least four diagonals from its corner restricts Black inside it.

Training Info will show only:

- the Phase 2 definition and Phase 2 wall diagram;
- the four active rule descriptions;
- the Rule N diagram.

All diagrams and explanatory material associated only with removed heuristics are hidden.

## Validation

- Assert the exact active rule order and rendered rule descriptions.
- Assert Training Info exposes only the Phase 2 wall and Rule N diagrams.
- Retain focused geometry tests for Phase 2, Rules N and O, W3, and W.
- Run focused tests, build, lint, and `git diff --check`.
- Generate and independently validate a closed loop, orient it so Black's closest corner is h1, and load it at `cursor=0`.
