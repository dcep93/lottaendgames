# Digital-edition note policy

## Goal

Keep the public “Note on this digital edition” limited to defensible corrections
to the 2008 edition, while preserving PDF-only artifacts and uncertain editorial
judgments accurately in the internal source-fidelity evidence.

## Public note

- The first list entry states that the author of the digital app consulted only
  the 2008 edition and that the listed issues were likely corrected in later
  editions.
- Every correction entry cites print pages only. PDF page references remain in
  internal audit evidence, not in the public note.
- Correction entries are ordered by their earliest cited print page.
- Position 1.14 is removed from the public note. The reader retains the normal
  spacing in “a stalemate”; the internal audit records the dot as an accepted
  artifact of the supplied PDF rather than a book error.

## Contested entries

### Analysis diagram 4.11

Retain the correction. Exact replay of the printed line reaches
`8/8/8/8/8/1K6/4Q3/kq6 w - - 2 7`, which is a tablebase draw. The printed
“not enough to draw” is therefore objectively false; the reader keeps “enough
to draw.”

### Position 12.19

Treat the source as a move-number typo, not a square typo. Immediately after
`3.d3+`, Black's king is on c4 and `3...Kb5` is a legal drawing counterattack.
The printed `4...Kb5` retains the intended destination but has the wrong move
number. The reader sentence becomes “Immediate counterattack by 3...Kb5 draws
easily,” and the governed playback branch starts from the position after
`3.d3+`.

### Appendix F13

Remove the correction and restore the exact printed wording. “Black can force
one of the pawns’ advance to h3 and then win” is awkward but defensibly parses
as “the advance of one of the pawns,” so it is not a certain source error.

## Evidence and verification

- Reclassify the Position 1.14 copy difference as an accepted presentation
  deviation caused by the supplied PDF artifact.
- Remove the F13 book-error finding and classify its copy unit as matched after
  restoring the print.
- Update Position 12.19 evidence to identify `3...Kb5`, including its legal
  parent position and tablebase result.
- Regenerate the runtime payload, manifest, and fidelity ledger from their
  authoritative sources.
- Add regressions for the disclaimer, print-only page references, page ordering,
  the three contested decisions, and the corrected Position 12.19 playback.
- Complete desktop and mobile browser checks, console/history checks, the full
  automated gate suite, and a final drift/diff review before closing the audit.

## Constraints

- Do not commit or push.
- Do not claim later-edition verification; phrase it as likely because only the
  2008 edition was consulted.
- Do not expose internal PDF-page or audit-ledger details in the public note.
