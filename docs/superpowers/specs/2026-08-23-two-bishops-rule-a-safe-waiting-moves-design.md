# Rule A Safe Waiting Moves Design

## Goal

Update Rule A to require an unattackable bishop waiting move that preserves the established corner cage diagonal.

## Behavior

At Rule A's completed-cage stage, a waiting move qualifies only when:

1. it is a non-checking bishop move;
2. the exact cage orientation established before the move is still established afterward; and
3. Black has no legal next king move that can attack the moved bishop on its destination.

Forced mate-in-two moves continue to override construction and waiting stages. Earlier king-target and cage-establishment stages are unchanged.

The rendered rule text becomes:

> With Black's king in the 2 corner edge squares, place the White king a knight's move from that corner. Then, place a bishop on the corner cage diagonal. Then, play an unattackable bishop waiting move if necessary, until mate in 2.

## Verification

- Reject a waiting move that swaps to the other corner cage orientation.
- Reject a waiting move whose destination Black can attack next.
- Preserve valid safe waiting moves under every rotation and reflection.
- Run focused Two Bishops tests, diagram drift, build, and the fast loop verifier.
