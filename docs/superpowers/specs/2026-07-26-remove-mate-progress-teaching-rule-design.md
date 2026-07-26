# Remove Mate Progress From Teaching Rules

## Goal

The Rook and Two Bishops guides must teach decisions a human can make by
looking at the board. Proof distance is useful for verification, but it is not
a mating technique and must not appear as a production priority or reason.

## Rook

Remove `mate progress` from selection and presentation. White moves are chosen
only by the visible priorities:

1. mate;
2. pieces safe;
3. no stalemate;
4. rook box;
5. waiting move;
6. create rook box; and
7. king closer.

The existing box, waiting-move, and king geometry remain the source of truth.
Proof ranks remain available only to exhaustive verification.

## Two Bishops

Remove `mate progress` from selection and presentation. White moves are chosen
only by the visible priorities:

1. mate;
2. pieces safe;
3. no stalemate;
4. corner check;
5. waiting move;
6. clear bishop lines;
7. corner finish;
8. bishop wall; and
9. king closer.

The bundled proof table remains an offline oracle. It may identify loops or
fifty-move failures, but it may not choose a production move.

## Mechanical Alignment

Every reason shown in the log is one of the displayed rules, and every
displayed rule corresponds to an actual selector comparison. No proof rank,
move counter, repetition history, or hidden fallback may affect production
selection.

## Verification

Focused tests assert exact rule order, copy, and representative moves. The loop
checkers then exercise the resulting policies. A failure is fixed with concise
board geometry or explicitly accepted for a pattern whose current scope allows
loops; it is never masked by restoring proof distance.
