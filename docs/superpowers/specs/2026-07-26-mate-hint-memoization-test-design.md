# Mate Hint Memoization Test Design

## Goal

Make the `current hint scoring is lazy and memoized by its exact inputs` test
represent an unrelated parent rerender accurately.

## Design

The harness will create one frozen empty logs array and pass that same reference
to `MateLog` on every render. The unrelated counter update will therefore leave
all `MateLog` inputs unchanged, so `currentWhiteHint` must not run again.

The production memoization dependencies remain unchanged. Logs affect hint
selection and must remain a dependency.

## Verification

- Run the memoization test in isolation.
- Run the complete Mate presentation test file.
- Run TypeScript.
