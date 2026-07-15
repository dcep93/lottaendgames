# Digital-edition note correction

## Goal

Correct the author-facing “Notes on this digital edition” section after visual
inspection of the printed chess glyphs established that Ending 95 already says
`38.Rd7+ Kf6`. Preserve a neutral disclosure for the genuine Final Test 14.29
prompt/solution inconsistency.

## Decision

Use one factual editorial note rather than removing the section or retaining
the false two-item correction list:

> Final Test 14.29 (print page 233; PDF page 234) is labeled “Black to move. Can
> he draw?”, while the published solution analyzes White's 69th move. This
> reader follows the solution and presents the position with White to move.

The note links directly to `/book/chapter14#p14.29`.

## Required changes

- Remove the Ending 95 item and every claim that the PDF prints `38.Kd7+`.
- Describe Final Test 14.29 as a source inconsistency without saying that the
  PDF is incorrect or claiming certainty about authorial intent.
- Change the rendered 14.29 problem prompt to `White to move. Can he draw?` so
  project commentary is not presented as the author's problem text.
- Preserve the White-to-move FEN because the published solution begins with
  White's move 69.
- Correct the source-fidelity report and design documentation that propagated
  the false Ending 95 claim.
- Keep source regression coverage for the correct printed `38.Rd7+ Kf6` score,
  but do not describe it as an edition deviation.
- Include the separately approved removal of the About-page rights-reservation
  paragraph in the implementation commit.

## Verification

- The About page contains no `38.Kd7+` claim and says there is one documented
  discrepancy rather than two corrections.
- The note includes print/PDF page references and a working `#p14.29` link.
- The 14.29 problem prompt contains only the corrected question.
- `38.Rd7+ Kf6` remains in Chapter 13 source and playback.
- The complete source, content, SAN, link, presentation, lint, and production
  build gates pass.
- Targeted browser inspection confirms the note, deep link, and 14.29 prompt.
