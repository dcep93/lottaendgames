# About Page Section Order Design

## Goal

Reorder the existing About page so its sections follow the requested reading sequence without changing their content, headings, links, anchors, or presentation.

## Required order

1. With thanks
2. About this project
3. About this edition
4. Reader features
5. Note on this digital edition
6. Publisher's description
7. Table of contents

“About this edition” refers to the existing book identity and publication metadata header. The heading “With thanks” remains unchanged; it is only moved.

## Implementation

Physically reorder the existing JSX blocks in `BookFrontMatter.tsx`. Do not use CSS ordering, because the visual order, DOM order, keyboard order, and screen-reader order must agree. Do not refactor the sections into a new data model.

No source-book data, generated runtime artifacts, section wording, navigation behavior, or styling will change.

## Verification

Add a presentation regression assertion that renders the About page and verifies the seven headings occur in the required DOM order. Retain the existing tests for the table of contents, neutral digital-edition disclosure, metadata, and navigation links.

Run the focused presentation test, lint, production build, and `git diff --check`. Inspect the final diff to confirm it contains only the intended block movement, regression coverage, and this specification.
