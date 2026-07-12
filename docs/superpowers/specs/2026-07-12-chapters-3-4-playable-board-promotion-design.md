# Chapters 3-4 Playable Board Promotion Design

## Goal

Promote every diagram in Chapters 3 and 4 from `caption` sections into rendered chess boards, and require clickable move playback wherever adjacent played or variation moves can be reconstructed from those board positions. Chapter 3 has 10 diagrams and Chapter 4 has 13 diagrams, so the finished payload should add 23 playable board panels and leave no diagram captions for those two chapters.

## Scope

This pass is limited to Chapters 3 and 4 in the 100-endgames body. The app structure, chapter selector, async hashed payload, board rendering library, and existing click-to-play navigation remain the same. The work should update extraction data and audits, not create a separate rendering path for early chapters.

## Extraction Strategy

Use targeted PDF renders as the source of truth for every Chapter 3 and Chapter 4 diagram. Add verified FEN overrides to `scripts/promote_extracted_diagrams.py` only after checking the rendered diagram. Printed non-piece symbols should be represented as `markers`; FEN should contain only real pieces.

The generic classifier should stay conservative. Do not loosen global promotion rules just to make these chapters pass. If a diagram is too ambiguous for the classifier, use a documented verified override in the promoter, the same way Chapter 1 and several Chapter 13 diagrams are handled.

After updating the promoter, regenerate:

- `app/src/app_x/pdf/chapter_3.json`
- `app/src/app_x/pdf/chapter_4.json`
- `app/src/app_x/pdf/diagram_extraction_report.json`
- the single public `app_x/chapters.<hash>.json` payload
- `app/src/app_x/chapterPayloadManifest.ts`

## Playback Requirements

Promoted boards must participate in the normal playback system. Adjacent actual played moves and explicit variation moves should become clickable when their parent position is reconstructable. Prose-only threats and explanatory references remain intentionally non-clickable unless the text presents them as a played variation.

The strict SAN audit should include Chapters 3 and 4 once their diagrams are promoted. Passing means:

- every generated clickable move token replays legally with `chess.js`;
- every reconstructable adjacent move line has clickable tokens;
- any SAN-looking prose that remains non-clickable is covered by reusable audit policy, not a hidden one-off excuse.

## Tests

Update local tests so Chapters 3 and 4 are no longer allowed to have diagram captions. Expected board counts:

- Chapter 3: 10 positions
- Chapter 4: 13 positions

The extraction report test should require promoted rows for Chapters 3 and 4 and should fail if any `Position 3.x`, `Analysis diagram 3.x`, `Position 4.x`, or `Analysis diagram 4.x` remains a caption.

Run the full relevant local suite before finishing:

- `npm run test:audit-san:advisory -- --all`
- `npm run test:audit-san`
- `npm test`
- `npm run test:content`
- `npm run lint`
- `npm run build`
- `git diff --check`

Do not add these tests to GitHub workflows.

## Non-Goals

Do not perform a full visual end-to-end pass. Targeted rendered PDF diagram inspection is part of source extraction and is allowed. Do not redesign the app UI in this pass. Do not include non-endgame/front-matter chapters.

## Acceptance Criteria

The pass is complete when Chapters 3 and 4 render 23 promoted board panels total, the single hashed payload contains those promoted positions, adjacent reconstructable move text is clickable and engine-playable, strict SAN audit has zero misses including Chapters 3 and 4, and the verification suite passes locally.
