# Replace r9 with minor-piece coordination behind White

Follow-up: the user subsequently requested removing r9 entirely. Its rule, scoring helper and modal note are now removed. The r10 and r15 changes below remain in effect.

The user requests removal of r15, replacement of r9, and restoration of the five stated r10 priorities.

- r9 minimizes the sum of the bishop’s and knight’s Euclidean distances to the nearest board square strictly behind White’s king relative to Black’s king. Reuse the negative-dot-product region; pieces already behind contribute zero. No adjacency requirement applies to that region.
- Exempt each minor individually when White’s king is central (d4, e4, d5, e5) and protects it. Other protection does not exempt it. Evaluate the resulting position after White moves.
- r10 orders king Euclidean center proximity, opposite bishop color, bishop on the long diagonal, protected central bishop, and knight move distance to a precage square. Remove the behind-White prerequisite. Retain the previously requested neutrality for absent precage targets.
- Delete r15 and its obsolete scoring fields. Remove the former r9 precage occupancy and king-approach priorities. Update the modal and notes from the same rule definitions.

Validate geometry and exemptions under every board symmetry, rule ordering and rendered help, the complete mate test suite, and the production build. Verify and load a minimal unsupported loop using the updated selector; prior exhaustive audit counts are not current after this change.
