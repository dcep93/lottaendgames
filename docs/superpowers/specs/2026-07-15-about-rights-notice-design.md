# About-page rights notice removal

## Goal

Remove the visible paragraph beginning “All rights reserved” from the About
section without changing the surrounding publication identity.

## Scope

- Delete the rights-reservation sentence from `BookFrontMatter` markup.
- Keep the `www.newinchess.com` publisher link visible.
- Keep `All photos: New In Chess Archives.` visible.
- Keep the author, edition, ISBN, copyright, and publisher metadata unchanged.
- Do not change the project explanation, deviations, features, thanks, contact,
  table of contents, or any book content.

## Presentation

The remaining publisher link and photo credit continue to use the existing
fine-print styling. The removed sentence must not remain visually hidden in the
DOM because hidden legal copy would still be exposed to assistive technology
and text extraction.

## Verification

Update the front-matter presentation regression test to assert that:

- `All rights reserved` is absent;
- `www.newinchess.com` remains present;
- `All photos: New In Chess Archives.` remains present; and
- the copyright and publisher metadata remain present.

Run the targeted presentation test, the full test suite, lint, and production
build.
