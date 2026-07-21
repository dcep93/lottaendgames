# Mate Slop Alert Heading Design

## Goal

Give the Mate landing value proposition a clear title before the user reaches
the mating-set chooser.

## Structure

Add an `h2` with the exact text `Slop Alert` immediately before the 83-word
introductory paragraph. Preserve the rest of the landing sequence:

1. `Slop Alert`
2. value-proposition paragraph
3. `Choose a mating set`
4. material-selection prompt

Using the same heading level and existing landing-card heading selector gives
`Slop Alert` the same typography and color as `Choose a mating set` without
adding new CSS.

## Verification

- Assert both headings are rendered.
- Assert `Slop Alert`, the explanation, and `Choose a mating set` appear in
  that order.
- Preserve the explanation's exact copy and 50–100-word limit.
- Run the focused landing presentation test, lint, build, and a diff check.
