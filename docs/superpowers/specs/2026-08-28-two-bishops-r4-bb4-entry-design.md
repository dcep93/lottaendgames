# Two Bishops r4 Bb4 Entry Design

## Goal

Recognize `Bb4` as r4 from
`8/8/k1K5/8/8/BB6/8/8 w - - 2 2`.

## Design

Add the position as a history-free r4 predecessor under every rotation and
reflection. r4 uniquely selects `Bb4`; Black has only `Ka7`, which reaches the
existing certified r4 position `8/k7/2K5/8/1B6/1B6/8/8 w - -`.

No general construction rule changes. The predecessor becomes part of the
finite r4 lookup graph, whose audit requires every legal Black reply to remain
inside the graph and terminate in checkmate.

## Verification

Require `Bb4` uniquely with reason r4 in the supplied move-two position, verify
forced `Ka7`, and traverse every subsequent r4 branch to mate under every board
symmetry. Run the focused suite and cached exhaustive early-exit loop search.

