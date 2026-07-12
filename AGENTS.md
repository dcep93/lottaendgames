Agent rules for this repo:

- Most app behavior should live in `app/src/app_x`; shared static assets belong in `app/public`.
- Deployment behavior lives in `.github/workflows`; keep those scripts close to the recent Firebase Hosting-only pattern unless the Firebase project needs a focused change.
- The app should generally use the FantasyFilmBall-like house style: dark/night base, warm brown surfaces and borders, pink title/accent moments, and occasional playful Comic Sans/Chalkboard-style display typography where it fits.
- Keep the app modular, polished, and well organized, with files not too big.
- Do not spend time on full visual end-to-end passes for this project unless explicitly requested for a narrow surface.
- For CSS sizing, prefer `rem` for layout, spacing, widths, heights, radii, and other app-level scale decisions so global resizing stays predictable from the root font size.
- Use `em` for element-local sizing that should track the component's own text, such as icon size, inline spacing, or typography-relative padding.
- Avoid defaulting to `px` unless exact fixed geometry is intentionally required.
- Chapter IDs and labels live in `app/src/app_x/chapterManifest.json`; the viewer and `scripts/build_chapter_payload.py` both consume that manifest.
- When changing `app/src/app_x/moveParser.ts`, `app/src/app_x/moveParser.test.ts`, `app/src/app_x/contentAudit.test.ts`, or `app/src/app_x/pdf/chapter_*.json`, regenerate the hashed runtime payload and `app/src/app_x/chapterPayloadManifest.ts` with `python3 scripts/build_chapter_payload.py`, then run `npm test` and `npm run test:content` from `app/`. If chapters 10-13 or their OCR cleanup rules change, rerun `python3 scripts/normalize_chapters_10_13.py` first; it also rebuilds the public payload. A single chapter payload under 2 MB is acceptable. The content audit is a local/Codex check; do not add it to the GitHub workflow unless explicitly asked.
