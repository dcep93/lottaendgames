# Two Bishops Rule WZ Design

## Goal

Add Rule WZ immediately before Rule W:

> **rule wz** — Prefer adjacent bishops.

## Scoring

Rule WZ evaluates the resulting position after each legal White move. When both White bishops remain on the board:

- penalty `0` when their king-move distance is exactly `1`;
- penalty `1` otherwise.

This is a binary preference. It does not reward bishops merely for becoming closer while still non-adjacent. King moves and bishop moves are scored identically, so a move that preserves an adjacent pair receives full credit.

## Priority and UI

Rule WZ is rendered and evaluated immediately before Rule W. Its Training Info text is exactly:

> Prefer adjacent bishops.

No phase restriction or diagram is added.

## Verification

Tests cover the active priority, exact help text, creating and preserving adjacency, non-adjacent positions, and rotations/reflections. After implementation, the development verifier supplies a cycle that is independently checked and loaded in the in-app browser at `cursor=0`.
