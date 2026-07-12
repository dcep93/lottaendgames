# Board Content Column Layout

## Goal

Position diagrams should stay visible while the reader works through the prose, moves, and panels that explain that position. This must work on desktop and mobile without switching to a stacked row layout on small screens.

## Design

Each `position` section starts a study group. The group contains the board/position metadata in the left column and the related content in the right column. Related content is every following non-major section until the next `position`, `ending`, or `title` section. Major sections remain in the normal chapter flow so chapter structure stays readable.

The study group always uses columns. On wide screens the board column is comfortable and the content column gets the rest of the width. On phones the board column intentionally shrinks so both columns still fit; the content column scrolls independently. The scroll pane uses `max-height: 100svh` so the board remains visible while reading the full explanation.

Move playback, position reset, active-board tinting, and arrow-key navigation keep their existing behavior. The existing `.leg-position-card` remains the board element used by visibility and keyboard navigation helpers.

## Verification

Run the existing local checks after implementation: `npm test`, `npm run test:content`, `npm run test:audit-san`, `npm run test:audit-san:advisory -- --all`, `npm run lint`, and `npm run build`.
