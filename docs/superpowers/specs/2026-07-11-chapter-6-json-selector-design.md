# Chapter 6 JSON And Selector Design

## Goal

Add Chapter 6 as structured JSON and let the viewer switch between available chapters from controls at both the top and bottom of the rendered page.

## Chapter Data

Create `app/src/app_x/pdf/chapter_6.json` with the same top-level section array shape as Chapter 5. Use the current extraction rules, including `panel` for visibly boxed or callout content. Preserve full chapter text, move lines, diagram captions, positions, markers, and panels in reading order.

Chapter 6 extraction must be checked against the PDF visually, not only through OCR text. Page boundaries, diagrams, pieces, markers, captions, ending labels, and panel content should be verified from rendered PDF pages.

## Viewer Registry

Replace the single hard-coded `chapter_5.json` import with a small chapter registry:

```ts
[
  { number: "5", label: "Chapter 5", sections: chapter5Data },
  { number: "6", label: "Chapter 6", sections: chapter6Data }
]
```

The active chapter is stored in React state. Switching chapters resets active board state, active position, pending animation frames, and playback/navigation derived data.

## Chapter Selector

Render the same chapter selector above and below the chapter content. With only Chapters 5 and 6 available, use a compact segmented button group styled in the existing brown/pink visual language. The selected chapter should be visually active and accessible through `aria-pressed`.

## Rendering And Playback

The existing section renderer should stay generic and receive the active chapter's section array. Existing behavior should continue for:

- panels;
- clickable moves;
- parent-based move animation;
- active board tint;
- arrow-key navigation within the active board;
- hidden marker-detail rows and hidden FEN footers.

## Validation

Validate:

- `chapter_5.json` and `chapter_6.json` parse;
- every section has `type` and `content`;
- every position has `number` and `fen`;
- every panel has `title` and `text`;
- selector appears at both top and bottom;
- switching chapters changes the rendered content and resets active board state;
- tests, lint, and build pass.
