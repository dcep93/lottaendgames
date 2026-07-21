# Mate Pattern Selector Toggle Design

## Goal

Let users clear the selected mating pattern by activating its already-active
material icon.

## Navigation behavior

- An inactive mating-pattern icon links to that pattern's existing Standard
  route.
- The active mating-pattern icon links to `/mate`.
- Primary pointer clicks continue through the app's client-side navigation
  callback and release button focus.
- Keyboard activation uses the same `/mate` destination without forcing a
  blur.
- Modified clicks and browser link actions use the anchor's real destination,
  so opening the active icon in another tab also opens `/mate`.
- Mode links are unchanged.

## Accessibility

Keep the active visual class. Give the selected icon an accessible label that
identifies it as selected. Do not use `aria-current` on the active icon because
its link destination is the landing page rather than the current pattern URL.

## Verification

- Assert that the active pattern's rendered `href` is `/mate`, while inactive
  patterns retain their existing paths.
- Assert primary pointer and keyboard activation of the active icon both call
  navigation with `/mate`.
- Preserve modified-click behavior and focus-release behavior.
- Run focused presentation tests, lint, build, and a diff check.
