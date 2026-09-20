# Unsupported loop positions grouped by placement

Policy: r25, fingerprint `d5a19011bb0b1fff6d070ae596cb0b436799d33b8b9ae8bea318cf0848966ac0`. Analysis date: September 20, 2026. No policy changes.

The previous bishop-shuttle / king-shuffle / knight-shuttle labels describe motion. These new groups describe the arrangement of pieces, independent of which move was played or which rule selected it. Rotations and reflections count as the same shape, with orbit weights restored for physical-position totals.

All 488 distinct post-White placements lying directly on an unsupported cycle are classified, not just the 20 linked examples. The source is the completed exhaustive r25 graph. Internal edges of cyclic components identify post-White placements; duplicates across histories and components are removed before counting. All included roots have support size 99. Counts sum to 488. This is postprocessing of the existing audit, not a new policy audit.

## Distribution

| Piece arrangement | Direct loop positions | Share |
| --- | ---: | ---: |
| Central king separated from both minors | 128 | 26.2% |
| Non-central bishop defended by knight | 96 | 19.7% |
| Central bishop, king-defended; knight on precage | 72 | 14.8% |
| Non-central bishop defended only by king | 56 | 11.5% |
| Undefended non-central bishop; king protects knight | 56 | 11.5% |
| Non-central king separated from both minors | 32 | 6.6% |
| Central bishop without king protection | 24 | 4.9% |
| Central bishop, king-defended; knight off precage | 24 | 4.9% |

Percentages are rounded. “Central” means d4, e4, d5, or e5. “Separated from both minors” means neither minor is adjacent to White's king, and the non-central bishop is not defended by the knight. A knight in those groups could still be bishop-defended. Protection in these labels is geometric king adjacency or knight attack, not the move-selection rule's central-king exemption.

## Exact grouping procedure

Each post-White placement belongs to exactly one group:

1. If the bishop is central: split by whether White's king protects it; if protected, split by whether the knight is on a precage square.
2. Otherwise, if the knight protects the bishop: classify as non-central bishop defended by knight, whether or not the king also protects it.
3. Otherwise, if the king protects the bishop: classify as non-central bishop defended only by king.
4. Otherwise the bishop is undefended: split by whether the king protects the knight; if not, split by whether White's king is central.

Precage uses the existing geometric definition: diagonally adjacent to a central bishop, off the long diagonals, and strictly behind the bishop relative to Black's king (negative direction dot product). No rule priority or played move enters classification.

This is a first-level taxonomy, not a claim that each group has one cause or remedy. Preserve Black-to-minor distances, king separation, bishop/knight adjacency, board-edge flags, long-diagonal membership, and exact squares as secondary fields. A loop can cross multiple groups as its pieces relocate; group counts partition placements, not loop families. Family IDs can therefore appear in multiple groups.

## Loaded example

The loaded line is **1. Ke3 Kh4 2. Kd4 Kg3** from `8/8/8/8/3K4/6kB/5N2/8 w - - 0 1`.

Its defining geometry is a **non-central bishop defended by the knight, attacked by Black's king, and not defended by White's king**. The bishop on h3 is protected by Nf2; Black is adjacent to that bishop; White's king on e3 or d4 is not adjacent to it. Both post-White placements fall in the same group. The corresponding Bg4/Nf2 line belongs with it, despite the bishop occupying a different square.

The broader knight-defended, non-central-bishop group contains 96 direct placements (19.7%). Within it, 80 have Black adjacent to the bishop, and 80 have no king protection of the bishop. Their intersection—the exact motif above—contains 64 positions (13.1% of all direct loop placements).

Only 16 of all 488 direct placements have White's king on an edge (3.3%); only 120 have a central bishop (24.6%). Thus “edge king” and “central bishop” should not be assumed to describe the residual population.

## Reproduction

The machine-readable companion `2026-09-20-r25-placement-archetypes.json` contains every canonical post-White board, its physical orbit weight, family memberships, exact squares, and placement features. Initial extraction is saved at `/Users/danielcepeda/repos/_codex_output/r25-placement-analysis.py`; intermediate files are `r25-placement-boards.json` and `r25-placement-distribution.json` in that directory. The immutable input is `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r25/census.sqlite` plus `result.json`.
