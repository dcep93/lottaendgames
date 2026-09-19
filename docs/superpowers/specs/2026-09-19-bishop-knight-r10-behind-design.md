# R10 precage proximity eligibility

The user specified that r10 must not credit precage proximity unless the knight is behind White's king from Black's king's perspective. Use the same strict, post-White directional definition as r15. No changes to rule ordering or to support eligibility.

Retain the geometric precage distance as a raw score. When ranking r10's final subpriority, only use it for candidates whose knight is strictly behind White's king. Candidates outside that region, on its boundary, or without a precage target are neutral, following the existing missing-target treatment. Among eligible candidates, fewer knight moves still wins. Update both modal wording and notes.

From White Kd4, Bd5, Ng1 and Black Kg4, both Ne2 and Ke5 leave the knight outside the behind region. Their raw precage distances (4 and 3) therefore no longer determine the choice; r15 selects Ne2 by Euclidean distance behind White. Verify this across all board symmetries, boundary neutrality, and preservation of eligible precage rankings. Verify a remaining unsupported loop with production best-move selection.
