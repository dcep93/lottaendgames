# All 100 Chapter Batches Final Product Design

## Goal

Turn Lotta Endgames from a chapter sample into a complete, snappy reader for all 100 endgames. The job is not complete at "all chapters are present"; it must also finalize the app with a strict perfect pass that drives the SAN audit to zero unresolved misses. The final app should feel consistent across chapters, render chapter switches quickly, keep all reconstructable played and variation moves clickable, and make any non-clickable prose an explicit audited design choice.

## Product Bar

The product-complete milestone is all 100 endgames available in the app from the single async, content-hashed chapter payload, with zero unresolved SAN audit misses across the included content. Each chapter should render through the same components and data flow, regardless of whether it came from the early hand-built extraction or a later batch pipeline.

The current descriptive banner text is not useful as primary page chrome. Chapter pages should lead with the existing styled chapter title treatment only, using the brown/pink/Comic Sans-inflected visual language already established below it. Any metadata-like text should be removed from the main reading surface unless it helps navigation or debugging.

## Batch Strategy

Process the remaining book in committed batches:

- checkpoint the current verified chapter 10-12 cleanup first;
- chapters 14-20;
- chapters 21-30;
- chapters 31-40;
- chapters 41-50;
- chapters 51-60;
- chapters 61-70;
- chapters 71-80;
- chapters 81-90;
- chapters 91-100.

Each batch should be shippable on its own. A batch includes extraction, normalization, safe diagram promotion, payload regeneration, tests, and a commit. JSON should remain generated from the pipeline; do not hand-patch chapter JSON when a source extraction or normalization rule is the real fix.

After the final chapter batch lands, continue directly into finalization rather than stopping. Finalization includes clearing the strict audit to zero unresolved misses, removing the current page-banner copy, fixing chapter-switch performance, and verifying the full app acceptance criteria.

## Extraction Rules

Use PDF text extraction as the first text source whenever it is cleaner than OCR output. OCR-style repairs belong in extraction/normalization scripts and should be narrow enough to explain from the source text. Diagram promotion must stay conservative: promote a diagram to a `position` only when the FEN is verified from the rendered diagram or another reliable source. Ambiguous or marker-heavy diagrams remain captions/panels until they can be safely resolved.

Panels such as summaries and conclusions should be represented as structured `panel` sections. Source content should not be summarized or dropped. Markers may remain in position content only when they are part of the source diagram representation; marker detail lists should not render as sidebar clutter.

## Clickability Policy

For batch completion, all generated clickable move tokens must replay legally through `chess.js`, and obvious OCR-damaged SAN-like text must be repaired or categorized. Actual played moves and explicit variation moves should be clickable when their parent position is reconstructable. Prose threats and explanatory references, such as "threatening ...Ng3" or "the bishop goes to e7", remain intentionally non-clickable unless they are also presented as played variation moves.

The strict final pass must produce zero unresolved audit misses. Reaching that bar may require promoting additional diagrams, adding verified alternate FEN anchors, improving branch reconstruction, correcting source extraction rules, or making the audit represent intentionally non-clickable prose as verified exclusions. The target is a clean audit, not merely fewer broken clickable tokens.

Verified prose exclusions must be discoverable in code or docs and should not hide real move-line failures. If the audit ignores a SAN-like token, it must be because that token is intentionally prose-only or otherwise documented as non-playable source content.

## Performance And Consistency

Chapter selection must feel snappy and homogeneous. Chapters 10-13 currently feel slower than chapters 5-9, which suggests redundant parsing/rendering work or inconsistent data paths. The expected user experience is roughly sub-100ms chapter switching on normal local data sizes, without visible stalls.

The viewer should avoid recomputing expensive chapter playback for chapters that are not being rendered. Derived data such as parsed move tokens, navigation trees, and playable-position sets should be memoized by chapter identity and payload hash. Chapter 5-9 and 10-13 should use the same rendering path; if later chapters require fallback behavior, that fallback should be explicit and cheap.

## App UX Completion

The completed reader should include:

- top and bottom chapter selection;
- a table of contents or endgame index once all chapters exist;
- consistent chapter title rendering without the current explanatory banner;
- actual chess boards with non-clickable-looking pieces;
- active-board keyboard navigation;
- responsive layout for mobile and desktop;
- loading and error states for the async payload;
- no visible FEN strings, marker detail lists, or extraction debug text in the reader.

Search is a good final polish feature after all chapters load reliably, but it should not block content completion.

## Finalization Pass

Once chapters 5-100 are included, run a dedicated finalization pass that finishes the app as a product. This pass must:

- make the strict audit cover all included chapters;
- drive the strict audit to zero unresolved misses;
- remove or replace the current explanatory chapter banner so the styled chapter title is the page title;
- profile chapter selection and eliminate redundant playback/navigation parsing;
- memoize derived chapter data by chapter identity and payload hash;
- confirm chapters 5-9 and 10-100 use the same rendering path;
- verify that no debug extraction artifacts are visible in the reader;
- run the full local verification suite.

The finalization pass is part of the job, not a separate optional future project.

## Testing And Verification

For every content batch, run:

- unit tests;
- content audit;
- chapter SAN audit for the batch and previously strict chapters;
- lint;
- production build;
- `git diff --check`.

Tests should not be added to GitHub workflows unless explicitly requested. Codex should run the relevant tests locally whenever extraction, normalization, payload, parser, or viewer code changes.

The audit output should remain useful while work is in progress: categorize misses by branch/anchor, OCR, spacing, prose reference, and unparsed section. During finalization, convert every remaining category into fixed clickability, verified intentional exclusions, or stricter test failures. The final audit command should pass without unresolved misses.

## Acceptance Criteria

The final product is ready when:

- chapters 5-100 are present in the single content-hashed async payload;
- all 100 endgames are reachable from chapter/endgame navigation;
- chapter switching is consistently fast across early and late chapters;
- the reader uses one coherent visual and rendering system;
- no source-debug banner, visible FEN footer, or marker-detail clutter appears in the reading view;
- all clickable moves replay legally from their parent FEN;
- the strict audit has zero unresolved misses across all included chapters;
- local tests, lint, build, and whitespace checks pass.
