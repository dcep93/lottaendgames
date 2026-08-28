# Two Bishops Letter Rule Catalog

## Goal

Remove the two ordered rules proven inactive by the complete Two Bishops census, then give every remaining technique rule one unique sequential letter while preserving selection behavior exactly.

## Removal

Remove current rules `b1` and `c08`. Their exhaustive canonical census recorded zero eliminated moves and zero affected positions. Delete their catalog entries, score fields, scoring logic, diagrams, focused tests, and any helpers that become unused.

## Rename

Keep the three universal priorities (`mate`, `bishops safe`, and `no stalemate`) unchanged. Rename the remaining 25 technique rules in current priority order:

| Old | New |
|---|---|
| a | a |
| e | b |
| b2 | c |
| b3 | d |
| b5 | e |
| b6 | f |
| b7 | g |
| c01 | h |
| c03 | i |
| c05 | j |
| c07 | k |
| c07.5 | l |
| c08.5 | m |
| c09 | n |
| c10 | o |
| c12 | p |
| c14 | q |
| c15 | r |
| c20 | s |
| f4 | t |
| f5 | u |
| g1 | v |
| g2 | w |
| g4 | x |
| g5 | y |

Rename public rule IDs, labels, internal score fields, applicability fields, help text references, diagram titles and IDs, tests, and verifier census tags. Do not retain compatibility aliases or hidden legacy names.

## Behavioral guarantee

This is a catalog migration, not a policy change. Candidate ordering and all comparators remain in the same sequence. Removing two rules with zero effect over the complete legal canonical universe cannot alter any selected move. Focused tests will compare the expected priority order and representative selections after migration.
