# Mate Landing Explanation Design

## Goal

Explain the Mate tool's teaching approach before asking the user to choose a
mating set.

## Copy and placement

Add this paragraph inside the existing Mate landing card, immediately above
the `Choose a mating set` heading:

> Other mating tools use an engine or teach specific lines. This tool uses
> human-understandable rules and strategy to teach you how to mate.

Keep the existing heading and the short material-selection prompt below it.
The explanation appears only on the unselected `/mate` landing state because
that is where the chooser heading is rendered.

## Presentation

Style the new paragraph as introductory body copy. It should remain readable
and visually distinct from the shorter muted selection prompt without adding
a separate panel, badge, or heading.

## Verification

- Assert the explanation appears before `Choose a mating set` in the rendered
  landing page.
- Preserve the catalog, mode labels, and no-drill landing behavior.
- Run the focused presentation test, lint, build, and a diff check.
