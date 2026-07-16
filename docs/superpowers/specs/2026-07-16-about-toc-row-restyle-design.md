# About-page table of contents row restyle

## Goal

Restyle the full nested table of contents on `/book/about` so every chapter and
ending reads as a distinct, full-width row. Preserve all source wording, source
order, routes, anchors, and navigation behavior.

This is a narrow presentation correction requested after the PDF-fidelity
audit. It authorizes changes to this table of contents only; it does not reopen
the excluded broader typography or visual-direction work.

## Approved visual direction

Use the selected “rule rows” direction:

- one single-column, full-width row for every chapter and ending;
- thin horizontal rules instead of individual cards or an accordion;
- chapter labels in the existing pink accent with stronger chapter titles;
- ending labels in the existing brown accent, with a modest indentation;
- restrained hover and keyboard-focus treatment across the entire row;
- no new decorative cards, columns, disclosure controls, badges, or icons.

The enclosing contents panel and its heading remain. The row treatment should
feel like a readable book index within the existing Lotta Endgames visual
language.

## Markup and behavior

The existing semantic structure remains a `nav` containing nested ordered
lists. Each chapter and ending remains an ordinary deep link.

The implementation may add narrowly named classes to chapter list items,
ending list items, or their anchors so styles can distinguish the two row
levels. It must not change:

- chapter or ending text;
- chapter/ending order;
- link destinations, anchors, or client-side navigation;
- the number of links;
- table-of-contents accessibility semantics.

Each anchor becomes the full row hit target rather than a text-width link.
Chapter rows and ending rows remain visually distinguishable without hiding
any content.

## Responsive behavior

Desktop and mobile both use one column.

- Row labels occupy a compact leading column.
- Titles use the remaining width and may wrap naturally.
- Ending rows retain a small visual indent without making long titles cramped.
- No horizontal page overflow or internal TOC scrolling is introduced.
- Touch targets remain comfortably usable at a 390-pixel viewport.

## Accessibility and interaction

- Preserve visible focus indication for keyboard users.
- Apply hover/focus styling to the full row.
- Preserve the existing `nav` label and nested list hierarchy.
- Do not add JavaScript state, collapse/expand behavior, or custom keyboard
  handling.

## Verification

Add or update focused presentation tests to protect:

- the semantic contents navigation and nested lists;
- unchanged chapter and ending destinations;
- full-width chapter and ending row classes;
- the absence of accordion/disclosure behavior.

Run the relevant presentation test, main test suite, lint, production build,
and `git diff --check`. Inspect the complete TOC in the running app at desktop
and 390 × 844 mobile widths for hierarchy, wrapping, focus treatment, clipping,
and overflow.

## Scope constraints

- No book source, fidelity-ledger, move-tree, board, or runtime-content edits.
- No changes to the top chapter selector.
- No broader P1.8 visual redesign beyond this contents component.
- No changes to P1.1, P1.2, P1.7, or P1.9.
- No commit or push.
