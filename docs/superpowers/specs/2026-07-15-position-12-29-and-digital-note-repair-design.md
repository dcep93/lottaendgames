# Position 12.29 playback and digital-edition note repair

## Goal

Correct the Position 12.29 move-tree association from rendered PDF 194 /
printed page 193, and reduce “Note on this digital edition” to one neutral,
fully cited disclosure for Final Test 14.29.

## Rendered-source interpretation

The Position 12.29 score is structured as follows:

- **1.h3** is the main move.
- **1.h4**, **1.g3**, and **1.g4?** are alternative first moves discussed
  before the main line resumes.
- The later **1...Kg6 2.Kg4** resumes the **1.h3** main line.
- The parenthetical **1...h6 2.g3! 2...Kg6 3.g4 Kf6 4.h4+-** is an alternative
  Black reply to **1.h3**.
- The continuation through **4.g3** confirms that the g-pawn was still on g2
  before that move.

The displayed book text remains unchanged.

## Playback changes

- Associate the later main-line **1...Kg6**, **2.Kg4**, and their continuation
  with the position after **1.h3**.
- Keep the earlier short **1.h4 1...Kg6 2.Kg4+-** variation separate.
- Keep **1.g3** and **1.g4?** as independent first-move alternatives.
- Do not stage the later **2.Kg4** from the **1.h4** sibling position.
- Preserve all printed notation and evaluations exactly.

## Digital-edition note

Remove the Position 12.6, Position 12.18, and Position 12.29 bullets. Retain
only Final Test 14.29, using neutral wording and citing both pieces of source
evidence:

> Final Test 14.29 is labeled “Black to move. Can he draw?” on print page 233
> (PDF page 234). Its published solution begins with White's 69th move on print
> page 238 (PDF page 239). The reader follows the solution and presents the
> position with White to move.

The Final Test 14.29 deep link remains **/book/chapter14#p14.29**. The problem
prompt remains **White to move. Can he draw?**.

## Fidelity ledger and release report

- Remove **position-12.29-illegal-published-line** from the deviation register.
- Change the Position 12.29 board unit from **accepted-deviation** to **matched**
  with evidence describing the main-line association.
- Rebuild the ledger through its established generator rather than editing
  generated counts by hand.
- Expected totals after regeneration: 586 total units, 566 matched, 20
  accepted-deviation units, 13 deviation IDs, zero unresolved, zero blocked.
- Expected Chapters 10–12 subtotal: 174 units, 166 matched and 8 accepted.
- Update the release report so it no longer describes Position 12.29 as a
  published illegal line or an accepted deviation.

## Regression coverage

- Assert the exact parent FEN/path for the later Position 12.29 **1...Kg6** and
  **2.Kg4**: both must descend from **1.h3**.
- Assert that the earlier **1.h4 ...Kg6 2.Kg4+-** variation remains separate.
- Assert that the visible note has exactly one disclosure link.
- Assert both prompt and solution page references for Final Test 14.29.
- Assert that no Chapter 12 disclosure links remain in the note.
- Rebuild the cache-busted runtime payload and manifest.
- Run the regional fidelity test, presentation test, full main/content tests,
  strict and advisory SAN audits, Lichess-link checks, lint, production build,
  and **git diff --check**.
- Reinspect Position 12.29 playback and the note in the running app at desktop
  and mobile widths.

## Scope and repository handling

No changes are made to the five excluded P1 product areas, the Mate entry, or
unrelated book content. No commit or push is made.
