# Panel Section JSON Rendering Design

## Goal

Chapter 5 should preserve PDF callout panels as structured data and render them as special panels in the app. In particular, the printed `Summary of interesting ideas:` boxes should not be plain prose.

## Current State

`app/src/app_x/pdf/chapter_5.json` currently stores two `Summary of interesting ideas:` blocks as `text` sections. `app/src/app_x/pdf/pdf_extraction_rules.md` has no panel section type, so future extraction would repeat that mistake. `ChapterViewer` renders unknown section types as fallback warnings and has no panel renderer.

## JSON Shape

Add a generic `panel` section:

```json
{
  "type": "panel",
  "content": {
    "title": "Summary of interesting ideas",
    "text": "1) Pushing the defending king from the rear..."
  }
}
```

Use `panel` for visibly boxed/callout content in the PDF. The `title` is the printed panel heading without the trailing colon. The `text` contains the full panel body, preserving the author's text and numbered idea list in readable prose.

## Extraction Rules

Update `pdf_extraction_rules.md` so boxed/callout material is represented as `panel`, not `text`.

For Chapter 5, regenerate or manually correct `chapter_5.json` by converting the two existing summary text sections into `panel` sections. No chapter text should be lost or summarized.

## Rendering

Add `PanelSection` to `chapterTypes.ts` and handle `type: "panel"` in `ChapterViewer`.

Panel rendering should:

- display the title separately from the body;
- use a distinct panel style that fits the existing brown/pink/comic visual language;
- allow move tokens in the panel body to remain clickable if the parser recognizes any later;
- not affect the move parser's existing behavior for ordinary `text` and `moves` sections.

## Related Display Cleanup

Board cards should stop showing marker detail lists such as `a8 as printed`, and should stop showing the FEN text below the board. Marker overlays remain on the board itself. This is display-only; the JSON should still keep `markers` and `fen` for rendering and playback.

## Testing

Validate that:

- `chapter_5.json` parses;
- every section still has `type` and `content`;
- both `Summary of interesting ideas` blocks are `panel` sections;
- the app builds and renders panel sections without falling into the unknown-section fallback;
- marker overlays still display on boards even though the marker detail list is hidden;
- FEN text is no longer visible below position boards.
