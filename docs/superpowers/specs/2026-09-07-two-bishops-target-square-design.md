# Two Bishops target square

Continue the existing Find loop in lottaendgames workflow in this task. Implement understood fixes without another design checkpoint, use focused checks, then load the first non-mating witness at cursor 0, preferably a four-ply loop. Preserve the existing uncommitted policy work.

Remove rule r18 and replace rule r17 with: “Prefer existence of a target square, then fewer diagonals for Black's king, White king's step proximity to the target square.”

Evaluate each resulting eligible adjacent-diagonal wall. Preserve the existing minimum diagonal length and four-diagonal enclosure floor, including checking walls that force Black inside. For each wall, minimize the sum of both kings' Chebyshev distances to squares on its outer diagonal; the user explicitly selected this interpretation. Retain tied closest squares, then exclude bishop occupancy. If none remain, that wall has no target; never substitute a farther square.

Compare complete wall profiles in the requested order: target existence, Black's diagonal count, White's distance to a remaining target. Keep r18.5 unchanged. The obsolete r17 starting-wall and screened-wall fallback behavior and r18 separation/floor-preservation scoring are superseded by the new three-part rule.

Add the target definition and an existing-style chess diagram before the Phase 2 note. The diagram uses White Ke4, Black Kg3, bishops d1/d2, the outer diagonal c1–h6, and target f4. Support note-associated diagrams with an optional zero-based noteIndex, preserving placement of other diagrams.

Verification: focused policy regressions for occupied targets, exact ties and symmetry, all three subpriorities, and existing unaffected rules; guide ordering checks; TypeScript compilation. Then stop at the first usable non-mating witness. No full visual pass or exhaustive content suite is needed.

Self-review: all requested changes are specified, distance ambiguity is resolved by the user, wall scores remain coherent, and source content outside the mating policy is unaffected.
