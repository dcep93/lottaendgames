# Independent Release Audit Prompt Design

## Purpose

Create a paste-ready prompt for a new Codex thread to repeat the complete
PDF-to-app audit of Lotta Endgames from scratch. The new audit must independently
prove the fidelity of the current release candidate, repair every objective app
defect it finds, attribute genuine printed-book errors accurately, and issue a
release verdict supported by page-level evidence.

The prompt is not intended to confirm the existing ledger or prior audit. Its
job is to challenge them and leave the current app completely patched within the
limits of the authoritative source and observable product behavior.

## Selected Structure

Use one phased, evidence-gated audit rather than a single undifferentiated
checklist or separate audit and repair projects. The phases are:

1. preflight and source lock;
2. independent source inventory;
3. sequential page-range audit batches;
4. classification, repair, and batch re-verification;
5. whole-app objective verification;
6. adversarial reconciliation and sealed regression checks;
7. final report and release verdict.

Each batch must close completely before the next one begins. Durable,
machine-readable evidence must record progress so context compaction cannot turn
an incomplete audit into an inferred pass.

## Release Candidate and Worktree Safety

The exact working tree present when the prompt is run is the release candidate.
The auditor must:

- read all applicable repository instructions before acting;
- inventory existing tracked, modified, deleted, and untracked files;
- treat all existing changes as user work;
- preserve and independently verify those changes rather than trusting them;
- never reset, discard, overwrite, or clean unrelated work;
- stop only the overlapping unsafe unit when existing changes cannot be
  reconciled safely, while continuing independent work elsewhere;
- avoid commits and pushes.

The prompt must work whether the tree is clean or dirty and must not require the
user to prepare a special baseline.

## Source Authority and Independence

The auditor must locate the authoritative PDF and identify it by path, page
count, edition, and cryptographic hash. If more than one plausible edition
exists, or no authoritative PDF can be established, the audit is blocked until
the user resolves the source.

The rendered PDF is authoritative for what the book prints. OCR, extracted
text, `book.json`, the running app, ledgers, extraction reports, tests, hashes,
comments, prior reports, and known conclusions may locate material but may not
prove it correct.

For each audit batch, source units must be inventoried in rendered-PDF reading
order before existing audit conclusions for that range are consulted. Existing
ledger entries and tests are then compared with the independently collected
evidence and repaired when necessary.

## Audit Coverage

The audit covers every PDF page from first to last, including:

- covers, publication metadata, front matter, contents, blank pages, and
  bibliography;
- headings, paragraphs, lists, tables, panels, captions, footnotes, names,
  places, dates, punctuation, glyphs, and typographic chess notation;
- every ending, example, position, analysis diagram, problem, and final test;
- every main line, variation, move number, annotation, evaluation, result,
  check, capture, promotion, and mate marker;
- every diagram square, piece, side to move, orientation, coordinate system,
  marker, route, arrow, prompt, caption, attribution, and associated solution;
- the ownership and order of all content relative to diagrams and sections.

The auditor must derive unit totals independently and explain differences from
current project expectations rather than adjusting the inventory to match them.
Sampling is not sufficient.

## Evidence Model

Every source unit must have durable evidence containing at least:

- stable unit identifier;
- PDF page and printed page where different;
- chapter, ending, position, or source identifier;
- app route, anchor, and curated-source section location;
- source-unit type and exact fields checked;
- printed value and app value when they differ;
- concise visual evidence, including a higher-resolution observation when the
  ordinary rendering is ambiguous;
- diagram reconstruction and FEN evidence when applicable;
- chess-legality result kept separate from transcription fidelity;
- discrepancy origin and comparison status;
- repair or accepted disposition;
- post-fix PDF and running-app verification.

The supported classifications are:

- `matched`;
- `app-defect`;
- `book-error`;
- `accepted-presentation-deviation`;
- `blocked`.

The existing machine-readable ledger may be extended minimally if it cannot
represent these facts. Generated ledger output must be rebuilt from its governed
source rather than hand-edited when the repository already uses a generator.

## Attribution Policy

The audit must distinguish transcription fidelity from chess correctness and
must never blame the book for an app-created position or association error.

### App defect

When the PDF is correct and the app is wrong, repair the app to match the PDF.
Do not add a book erratum or describe the author as mistaken.

### Confirmed book error with a certain correction

When the printed value is demonstrably wrong and the intended correction is
supported strongly enough to be certain, use the correction in the app. Add a
neutral About/errata entry that quotes or identifies the printed value, gives
PDF and printed pages plus a deep link, explains the correction, and keeps
project commentary distinguishable from the author's text.

### Book anomaly with an uncertain correction

When the source is demonstrably inconsistent but the intended correction is
not certain, preserve the printed text, do not manufacture a legal position or
playback line, and disclose the anomaly and uncertainty neutrally in
About/errata.

### Accepted presentation deviation

A digital presentation difference is acceptable only when it is an explicit
product decision, preserves the source's semantic content, and has current
evidence. Existing accepted deviations must be re-proven rather than inherited.

### Blocked evidence

Unreadable, ambiguous, or conflicting source evidence must be marked blocked.
The auditor must never guess, silently normalize, or lower the release standard
to clear the item.

## Batch Comparison and Repair Loop

For each fixed page range or book-part batch, the auditor must:

1. render every complete PDF page at inspection resolution;
2. rerender ambiguous text, chess glyphs, or diagrams at higher resolution;
3. inventory all source units in reading order;
4. compare each unit with the rendered app and curated source data;
5. reconstruct each diagram square-by-square;
6. verify side to move, orientation, overlays, caption, prompt, and association;
7. replay every supplied main line and variation, including parser-skipped
   notation;
8. check legality, branching, annotations, checks, captures, promotions, mates,
   evaluations, and results;
9. classify every mismatch under the attribution policy;
10. patch the narrow existing source or behavior responsible;
11. add a regression test that fails on the old defect;
12. regenerate derived artifacts through the repository's established process;
13. rerun the focused source, chess, and presentation checks;
14. reinspect the changed PDF passage and running app;
15. close every unit in the batch before advancing.

The curated book source must never be regenerated wholesale from the PDF or
OCR. Repairs must be narrow and reviewable.

## Product Verification

After every source batch closes, verify the reader as an objective product.
Coverage includes:

- desktop and mobile layout on targeted major reader surfaces and every changed
  surface;
- table of contents, routes, anchors, deep links, and browser history;
- diagram coordinates, source orientation, overlays, and expansion behavior;
- move playback, variation association, reset, previous/next controls, keyboard
  controls, and Lichess links;
- clipping, overlap, unintended internal scrolling, unreadable notation,
  inaccessible controls, broken focus behavior, and console errors;
- generated payload consistency and absence of stale artifacts.

Run the repository's full relevant gates, including main tests, content and
source validation, strict and advisory SAN audits, fidelity and presentation
tests, routing and Lichess-link checks, lint, type checking, production build,
and `git diff --check`.

Automated checks support but never replace the rendered-PDF comparison.

Every objective source, functionality, accessibility, layout, or runtime defect
blocks release. Subjective design preferences and optional enhancements are
reported separately and do not block release.

## Adversarial Reconciliation

After the independent first-to-last audit, perform a separate challenge pass:

- recalculate unit totals and reconcile them with ledger coverage;
- confirm every unit has one disposition and every deviation has governed
  evidence;
- challenge every `matched` and `accepted-presentation-deviation` assumption;
- review the final diff for unsupported or collateral content changes;
- revisit front matter, all final tests, captions, diagram orientations,
  branch endings, parser-skipped notation, and the first and last unit of every
  chapter;
- inspect all repaired items again in both the PDF and app.

Only during this final phase should the prompt expose the sealed historical
regression appendix. It must include, at minimum:

- Position 10.19's h4/h5 rook placement and `3.Rh5`;
- Position 10.24's `7.Kd4 Ke6 8.Kc4` side continuation;
- Position 10.26's `8.Rb8? Rh8+` line;
- Position 11.1's impossible printed `3...Rc8!` after `2...Rg1?!`;
- Position 12.16's `1...Kb4 2.Ke5 Kxb3`;
- Position 12.19's printed `4...Kb5` move-number anomaly;
- Chapter 13 Ending 95's printed `38.Rd7+ Kf6`;
- Final Test 14.29's prompt/solution side-to-move inconsistency;
- the intentionally hidden full rights paragraph and retained publication
  metadata;
- the retained Mate entry.

These are regression challenges, not assumptions. The auditor must rederive
their disposition from the rendered source and current app.

## Autonomy and Progress

The new thread must execute the audit and repairs rather than only plan them. It
must continue across batches and context compactions until the terminal release
condition is reached.

Progress updates should state the current page range, cumulative closed-unit
counts, defects and book errors found in the current batch, and the next gate.
The auditor must not stop after representative defects or infer completeness
from aggregate counts or passing tests.

Normal read, repair, test, regeneration, and targeted verification steps are
pre-authorized. User input is required only for source-edition authority,
unreadable or genuinely ambiguous evidence, unsafe overlap with existing work,
or an action outside the stated audit scope.

## Final Report

The final deliverable must contain:

1. authoritative PDF path, edition, page count, and hash;
2. independently derived totals by page range, part, and unit type;
3. evidence-backed coverage summary;
4. every app defect found, severity, location, repair, and regression test;
5. every confirmed book error, source evidence, correction certainty, and app
   treatment;
6. every accepted presentation deviation and its current justification;
7. every blocked or unresolved item;
8. objective product findings separated from optional polish;
9. files and generated artifacts changed;
10. exact commands and results;
11. final diff review outcome;
12. a direct release verdict.

The allowed verdicts are:

- **Ready to show the author** only when every independently inventoried unit is
  closed with evidence, no unexplained PDF/app difference remains, no objective
  app defect is unresolved or blocked, every book error is truthfully governed,
  no fabricated correction or misleading playback exists, and all gates pass.
- **Not ready** otherwise, followed by the exact blockers.

The app may be described as perfect only in this bounded, evidence-backed sense:
no known unexplained source differences, no known objective defects, and all
required gates passing.

## Final Prompt Form

The deliverable prompt will be self-contained and paste-ready. It will include
the repository path, source-authority rules, dirty-worktree policy, audit phases,
evidence schema, attribution decision tree, repair loop, verification gates,
sealed regression appendix, completion rules, and report template. It will not
depend on the reader having access to this design document or the previous
conversation.
