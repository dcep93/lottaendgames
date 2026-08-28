# Two Bishops Geometric Rule r4 Design

## Goal

Replace rule r4's manually enumerated FEN lookup with position-only geometry so every symmetric instance of the mating pattern is recognized without consulting move history.

The motivating position is:

`8/2KBB3/8/k7/8/8/8/8 w - - 0 1`

Rule r4 must activate there because, in the a8 orientation, the bishops occupy the two Phase 2 diagonals, White's king occupies the Phase 2 king square c7 (a knight's move from a8), and Black is inside the enclosed corner region.

## Activation

For each transformed target-corner orientation, rule r4 is active exactly when:

1. One bishop occupies each of that orientation's Phase 2 diagonals.
2. White's king occupies that orientation's designated Phase 2 king square.
3. Black's king is inside the region enclosed by those diagonals.

Activation depends only on the current position. It does not inspect the move log, repetition history, halfmove clock, or whether rule r5 was selected earlier.

The displayed rule text remains human-oriented: "Once rule r5 has been achieved, follow the mating pattern: control the escape square, then check, sometimes using a waiting move."

## Move Selection

When active, rule r4 evaluates legal White moves using the mating-pattern order:

1. Prefer a safe move that controls the current escape square while preserving Black's enclosure.
2. Once the escape square is controlled, prefer a safe check that preserves the enclosure.
3. When checking immediately would lose the pattern, prefer a safe bishop waiting move that preserves the adjacent-diagonal walls.

Candidate results must retain a forced mating continuation. A bounded, position-keyed minimax verifier rejects a geometric candidate when any legal Black reply escapes the r4 mating graph, reaches stalemate, captures a bishop, or cannot be forced to mate within the configured local bound. This verifier uses only descendant positions, never the path by which the current position was reached.

If multiple moves satisfy the same geometric action and forced-mate condition, all remain equally preferred unless the geometric action order distinguishes them.

## Architecture

- Extend the existing Phase 2 templates with the designated White king square for each orientation.
- Add a small r4 geometry analyzer that returns the matching target corner, enclosing wall, escape square, and pattern stage.
- Replace `RULE_R4_PREFERRED_RESULTS` and its lookup builders with geometry-derived candidate scoring plus the bounded continuation verifier.
- Keep the normal ordered-rule interface: r4 assigns zero to accepted moves and one to rejected moves.
- Later construction rules remain inactive while the current position satisfies the geometric r4 activation predicate.

## Verification

Focused tests will cover:

- activation and preferred moves for the motivating FEN;
- all rotations and reflections;
- every existing supplied r4 mating branch;
- safe waiting moves;
- control-escape, check, and mate stages;
- rejection when bishops are not on Phase 2 diagonals, White is not on the designated king square, or Black is outside the enclosure;
- absence of cycles in the resulting policy search.

After focused tests pass, run the exhaustive cached early-exit loop search and deliver the first genuine loop at cursor 0.
