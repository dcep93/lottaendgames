# Paste this entire prompt into a new Codex thread

Perform a complete, independent, release-blocking PDF-to-app audit and repair of
Lotta Endgames.

Repository:
`/Users/danielcepeda/repos/lottaendgames`

## Mission

Treat the exact current working tree as the release candidate. Independently
prove whether the app is a complete, accurate, and trustworthy digital edition
of the supplied book PDF. Inspect every source page and every app representation,
repair every objective app defect, attribute genuine printed-book errors to the
book rather than the app, and finish with a fully patched candidate and an
evidence-backed release verdict.

This is an execution task, not a request for a plan or a sample review. If goal
tracking is available, create one explicit goal for the entire audit and do not
mark it complete until all terminal conditions below are satisfied.

## Non-negotiable principles

- The rendered authoritative PDF establishes what the book actually prints.
- The app must never silently mistranscribe the book or blame the author for an
  error introduced by app data, parsing, association, playback, or rendering.
- A passing test, hash, ledger, extraction report, or prior audit is not proof
  of fidelity.
- OCR and extracted text may help locate material but cannot replace visual
  inspection of rendered pages.
- Do not sample. Audit every page and every unit from the first PDF page through
  the last.
- Do not stop after representative findings. Continue through repair,
  reinspection, reconciliation, and the final verdict.
- Do not commit or push.

## Phase 0: repository and source preflight

1. Read every applicable `AGENTS.md` and repository instruction before acting.
2. Inspect `git status`, the current diff, recent commits, source layout, build
   scripts, test scripts, and generated-artifact workflow.
3. Record a baseline inventory of tracked modifications, deletions, and
   untracked files. All existing changes belong to the user. Preserve them,
   verify them independently, and never reset, discard, clean, or overwrite
   unrelated work.
4. Locate the authoritative book PDF. Identify its absolute path, edition, page
   count, file size, and SHA-256 hash.
5. If no authoritative PDF exists or more than one edition is genuinely
   plausible, stop and ask which edition is authoritative. Otherwise proceed
   without waiting for approval.
6. Confirm how the curated source, fidelity ledger, runtime payload, and running
   app relate to one another. Follow the repository's established generation
   process; never invent a second source of truth.

The current dirty or clean working tree is the candidate being audited. Do not
require a clean baseline. If existing edits overlap a needed repair, inspect and
merge them safely. If that is impossible, mark only the affected unit blocked
and continue all other safe work.

## Independence protocol

Do not trust existing audit reports, source-fidelity ledgers, JSON, extraction
reports, tests, hashes, comments, or earlier conclusions as evidence. They may
be used to locate the corresponding app content only after the source evidence
for the current audit batch has been independently inventoried.

For each batch:

1. Render and inspect its PDF pages first.
2. Inventory their source units in reading order.
3. Record the observed source values.
4. Only then compare them with the current app, curated source, ledger, tests,
   and prior claims.

Maintain a fresh working audit record that survives context compaction. Reconcile
it into the project's canonical machine-readable fidelity ledger as units are
closed. Do not let an existing `matched` status pre-fill the new conclusion.

## Phased audit architecture

Audit contiguous source-order batches from the first PDF page to the last. Base
batch boundaries on the independently observed book structure, not on current
JSON assumptions. Keep batches small enough to close and verify rigorously.

For each batch, complete all of the following before advancing:

- rendered-PDF inventory;
- app and curated-source comparison;
- diagram and chess verification;
- discrepancy classification;
- narrow repairs;
- regression tests;
- generated-artifact rebuilds;
- focused automated checks;
- PDF and running-app reinspection;
- ledger reconciliation;
- zero unclassified units in the batch.

Report progress periodically with the current PDF page range, cumulative unit
counts, app defects found, book errors found, blocked items, repairs completed,
and the next gate. Context compaction is not a reason to restart or infer that a
batch passed; resume from the durable evidence record.

## Independent source inventory

Visually inspect every rendered PDF page in order, including:

- covers, publication data, front matter, contents, blank pages, and
  bibliography;
- every heading, paragraph, list, panel, table, caption, footnote, name,
  diacritic, place, date, year, punctuation mark, chess glyph, and result;
- every numbered ending, example, position, analysis diagram, problem, final
  test, prompt, and solution;
- every main move, variation, branch, move number, annotation, evaluation,
  check, capture, promotion, mate marker, and line ending;
- every diagram's complete square map, pieces, side to move, orientation,
  coordinates, markers, routes, arrows, cages, prompts, captions, attributions,
  and associated analysis;
- ownership and source order across headings, prose, diagrams, panels, and
  solutions.

Derive the inventory and totals independently. At minimum, preserve auditable
coverage for every nonblank page-copy unit, every front-matter and blank unit,
and every board/problem/diagram unit. If page-copy units aggregate paragraphs or
move lines, their evidence must itemize the subcontent actually checked.

Only after deriving the totals should you compare them with the existing project
expectation of 239 page-copy units and 337 board/problem/diagram units. Explain
any difference from first principles. Never adjust the inventory merely to make
the totals agree.

## Required evidence record

Every unit must contain, either directly in the canonical ledger or in linked
working evidence:

- stable unit ID;
- PDF page and printed page when different;
- chapter, ending, position, or other source identifier;
- unit type;
- app route, deep-link anchor, and curated-source section location;
- exact fields checked;
- concise rendered-page evidence;
- exact printed and app values when they differ;
- diagram square-map/FEN evidence when applicable;
- chess-legality result, separate from transcription fidelity;
- classification and severity;
- repair or accepted disposition;
- regression coverage;
- post-fix PDF and running-app verification.

Use these finding classifications:

- `matched`
- `app-defect`
- `book-error`
- `accepted-presentation-deviation`
- `blocked`

If the current ledger schema cannot express origin, correction certainty, and
disposition, extend it minimally and update its generator and tests. If the
ledger is generated, edit its governed source/generator and rebuild it; do not
hand-repair generated JSON.

## Complete PDF-to-app comparison

Follow the running app in source order. Compare each independently inventoried
unit with its exact route, anchor, section, rendered text, diagram, and playback
sequence. Inspect the visible app, not only `book.json`.

For text and structure, verify exact content, spelling, diacritics, punctuation,
notation, hierarchy, ownership, and order. Adaptive web layout may differ from
print, but it must not omit, duplicate, corrupt, reattribute, or silently rewrite
semantic source content except through a governed book correction.

For every chess diagram:

1. Reconstruct it directly from the rendered page, square by square.
2. Compare every square with the app FEN.
3. Verify side to move independently from the diagram, prompt, and analysis.
4. Verify source orientation and visible coordinates.
5. Verify all markers, highlighted squares, routes, arrows, cages, captions,
   labels, and attributions.
6. Confirm that the following prose and solution belong to the correct diagram.

For every printed move and variation:

1. Transcribe what the rendered page actually prints before assessing legality.
2. Replay main lines and all branches from the correct parent position.
3. Verify move numbers, side to move, checks, captures, promotions, mates,
   annotations, evaluations, results, transpositions, and branch returns.
4. Inventory SAN-looking tokens even when the current parser leaves them
   unclickable.
5. Confirm that each clickable token produces the intended board and that prose
   and playback remain synchronized.
6. Never infer that the book is wrong because the app's FEN or branch anchor
   makes a printed move illegal. Reconstruct the source position first.

Raise ambiguous pages, glyphs, and diagrams to 300–600 DPI or another adequate
inspection resolution. If the rendered evidence remains unreadable, classify the
unit as blocked rather than guessing.

## Attribution and correction decision tree

Treat “what the PDF prints” and “whether the printed chess is correct” as two
separate questions.

### App defect

If the PDF is correct and the app is wrong, repair the app to match the PDF.
This includes transcription, FEN, association, branch anchoring, parser,
orientation, caption, navigation, and presentation defects. Do not add an errata
entry and do not describe the book or author as wrong.

### Confirmed book error with a certain correction

If the PDF demonstrably contains an error and the intended correction is
supported strongly enough to be certain:

- use the correction in the app's reader and playback;
- add or update a neutral About/errata entry;
- identify the exact printed value;
- include print and PDF page references plus a deep link;
- explain the correction and its evidence;
- distinguish project commentary from the author's prose.

### Book anomaly with an uncertain correction

If the PDF is demonstrably inconsistent but the intended correction is not
certain:

- preserve the exact printed text;
- do not fabricate a legal FEN, move, or continuation;
- keep the impossible or unsupported token non-playable;
- add or update a neutral About/errata entry with page references, a deep link,
  the precise inconsistency, and the fact that the intended correction is
  uncertain.

### Accepted digital presentation deviation

Accept a digital presentation difference only when it is an explicit product
decision, semantically faithful, currently implemented as intended, and backed
by fresh evidence. Re-prove every existing accepted deviation; do not inherit
one merely because the ledger lists it.

## Repair rules

For every app defect or governed book correction:

1. Capture precise PDF and app evidence before editing.
2. Identify the narrow responsible layer: curated source, association,
   playback segment, parser, diagram metadata, UI, routing, or generator.
3. Patch the existing source or behavior narrowly.
4. Never regenerate `book.json` or other curated book content wholesale from
   PDF extraction or OCR.
5. Preserve unrelated user changes.
6. Add a regression test that fails on the old defect and proves the corrected
   source, association, or behavior.
7. Rebuild only the derived artifacts required by repository instructions.
8. Run focused validation immediately.
9. Reinspect the exact rendered PDF passage and running app after the repair.
10. Record the final disposition and evidence before closing the unit.

Normal read, repair, test, regeneration, and targeted verification work is
pre-authorized. An uncertain book correction follows the policy above without
requiring approval: preserve the print, prevent fabricated playback, and record
the erratum. Ask the user only when edition authority, an unsafe worktree
overlap, or an external action outside this audit genuinely requires a decision.
Mark unreadable evidence blocked and continue every other safe unit.

## Objective reader audit

After all source batches close, verify the reader as an objective product.
Respect repository guidance against an unfocused full visual E2E pass: use
targeted desktop and mobile checks for every changed surface and each major
reader surface, supported by exhaustive automated coverage.

Verify:

- table of contents, chapter navigation, routes, deep links, and browser history;
- board coordinates, source orientation, markers, routes, and expansion;
- move playback, branch selection, reset, previous/next controls, keyboard
  controls, and Lichess links;
- readable notation and source order;
- absence of clipping, overlapping controls, unintended internal scrolling,
  broken focus behavior, inaccessible controls, and misleading disabled states;
- runtime loading, generated payload consistency, stale artifacts, and browser
  console errors.

Every objective fidelity, functionality, accessibility, layout, or runtime
defect blocks release. Subjective redesign ideas and optional polish must be
reported separately and do not block release.

## Required automated gates

Discover the current repository scripts first, then run every relevant gate.
At minimum, the present project requires the established equivalents of:

```sh
python3 scripts/build_chapter_payload.py
node scripts/rebuild_fidelity_ledger.mjs
cd app
npm test
npm run test:content
npm run test:audit-san
npm run test:audit-san:advisory -- --all
npm run lint
npm run build
cd ..
git diff --check
```

Also run focused source-fidelity, ledger, routing, presentation, generated-link,
and parser tests whenever their areas change. Record exact commands, exit
results, and meaningful counts. Automated success cannot compensate for missing
visual PDF coverage.

## Final adversarial reconciliation

After completing the independent first-to-last pass:

1. Recalculate all unit totals from the fresh evidence.
2. Confirm that every source unit has exactly one final disposition.
3. Confirm that every accepted deviation and book erratum has page evidence and
   correct app treatment.
4. Challenge every `matched` claim and every inherited product assumption.
5. Revisit front matter, captions, every final test, diagram orientations,
   branch endings, parser-skipped notation, and the first and last unit of every
   chapter.
6. Reinspect every changed item in the rendered PDF and running app.
7. Review the complete final diff for collateral, unsupported, duplicated, or
   stale changes.
8. Run all final gates again after the last repair.

Only now use the historical regression appendix below. Treat every item as a
challenge to reverify, not as an assumed conclusion or permission to skip its
surrounding pages.

### Historical regression appendix

- Position 10.19: independently verify the PDF's h4/h5 rook placement and the
  legality and transcription of `3.Rh5`.
- Position 10.24: independently verify the ownership and legal parent position
  of `7.Kd4 Ke6 8.Kc4`.
- Position 10.26: independently verify whether the source prints `8.Rb8?` or
  another rook move and whether `...Rh8+ 9.Kc7 Rh7+` is correctly playable.
- Position 11.1: independently verify the source sequence around `2...Rg1?!`
  and the later printed `3...Rc8!`, including whether a rook on g1 can reach c8
  and whether the intended correction can actually be proven.
- Position 12.16: independently verify the source line around
  `1...Kb4 2.Ke5 Kxb3` and distinguish it from other captures on b4.
- Position 12.19: independently verify the printed move number on `...Kb5`, the
  legal immediate counterattack, and whether the correction is certain enough
  to use in the reader.
- Chapter 13, Ending 95: independently verify whether the rendered source prints
  `38.Rd7+ Kf6` or `38.Kd7+`; do not inherit either claim.
- Final Test 14.29: independently compare the printed prompt with the published
  solution's side to move and verify the reader prompt, FEN, About erratum, both
  page references, and deep link.
- Reverify the deliberate omission of the full rights-reservation paragraph
  while retaining required author, edition, publisher, copyright, publisher
  link, photo credit, ISBN, and production metadata.
- Retain and test the Mate navigation entry. Do not classify it as book content
  or remove it during source reconstruction.

## Completion rules

- Do not mark a page, board, or move line matched without actually inspecting
  it against the rendered PDF.
- Do not infer complete coverage from expected totals, nearby correct content,
  a clean extraction report, or passing tests.
- Do not silently downgrade, suppress, or relabel a defect to obtain a release
  verdict.
- Do not guess at unreadable source material or uncertain authorial intent.
- Do not finish while any safe in-scope audit, repair, reinspection, or gate
  remains.
- Do not commit or push.

## Final report

Produce a release report containing:

1. authoritative PDF path, edition, page count, file size, and SHA-256;
2. exact independently derived totals by page range, book part, and unit type;
3. batch-by-batch coverage and evidence summary;
4. every app defect found, with severity, PDF/printed page, app location,
   evidence, repair, regression test, and final disposition;
5. every confirmed book error, with exact printed value, correction certainty,
   app treatment, errata treatment, page references, and deep link;
6. every accepted presentation deviation and fresh justification;
7. every unresolved or blocked item;
8. objective product findings, clearly separated from optional polish;
9. files and generated artifacts changed;
10. every command and exact result;
11. final diff review outcome;
12. a direct verdict.

Use exactly one of these verdicts:

- **Ready to show the author** — only if every independently inventoried unit is
  closed with evidence, there are zero unexplained PDF/app differences, zero
  unresolved or blocked objective app defects, every genuine book error is
  accurately attributed and governed, no fabricated correction or misleading
  playback exists, and all gates pass.
- **Not ready** — otherwise, followed by the exact remaining blockers.

Call the app “perfect” only in this bounded, evidence-backed sense: no known
unexplained source differences, no known objective defects, and all required
gates passing.
