# Book and Mate Routing Design

## Goal

Place the existing endgame reader inside a `/book` module, add a `/mate`
module placeholder, and make chapters, endings, and positions directly
addressable with browser-native URLs.

## Routes

- `/` and `/book` canonicalize to `/book/intro` with `replaceState`.
- `/book/intro` renders the Introduction.
- `/book/chapter1` through `/book/chapter15` render the corresponding chapter.
- `/book/bibliography` renders the Bibliography.
- `/mate` renders the Mate placeholder.
- Unknown paths canonicalize to `/book/intro`.

The app remains a single Vite bundle. Firebase Hosting already rewrites unknown
paths to `/index.html`, so direct loads require no deployment change.

## Book Anchors

- `#e1` targets Ending 1.
- `#p1.4` targets Position 1.4.
- Problem boards use their displayed position number, for example `#p2.01`.
- Direct loads wait until the asynchronous chapter payload has rendered before
  scrolling to the anchor.
- An invalid or absent anchor leaves the selected chapter at the top.
- Clicking an Ending label pushes its `#e…` URL.
- Clicking a position number pushes its `#p…` URL and retains the existing
  snap-to-position and board-reset behavior.

## Navigation State

A small native History API router owns module and chapter URL state. It parses
the current pathname and hash, formats canonical Book URLs, and listens for
`popstate` and `hashchange` so browser back/forward restores the module,
chapter, and anchor.

The Book chapter selectors push the selected chapter pathname, clear any old
hash, reset chapter-local playback and solution state, and begin at the top.
Anchor-only navigation does not clear playback unless the user explicitly
clicks a position number, whose existing reset behavior remains authoritative.

## Module Shell

A shared compact tab navigation appears at the top of both modules:

- `Book` links to `/book/intro` and is active on all `/book/*` routes.
- `Mate` links to `/mate` and is active on `/mate`.

The tabs use real links for standard browser behavior and are styled as a
compact segmented module selector consistent with the current dark brown and
pink visual system. The Mate route is a restrained dummy page with a `Mate`
heading and short placeholder state, not a marketing page.

## Structure

- Add a focused routing module for parsing and formatting paths and hashes.
- Add a shared module selector/shell at the app entry point.
- Keep Book-specific payload, playback, chapter state, and rendering inside the
  existing Book module.
- Give ending and position elements stable DOM IDs matching the public hash
  format.

## Error Handling

- Invalid modules, chapter numbers, and unsupported Book slugs resolve to
  `/book/intro`.
- Valid chapters with invalid hashes still render normally at the top.
- Existing payload-load errors remain visible inside the Book module.

## Verification

- Unit-test route parsing, formatting, canonicalization, and anchor IDs.
- Test module selector semantics and ending/position anchor markup.
- In a live browser, verify direct loads, chapter selectors, anchor scrolling,
  position reset plus URL updates, module switching, and back/forward behavior.
- Check desktop and 320px phone layouts.
- Run the existing unit, content, strict SAN, advisory SAN, lint, and production
  build gates.
