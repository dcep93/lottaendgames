Agent rules for this repo:

- Most app behavior should live in `app/src/app_x`; shared static assets belong in `app/public`.
- Deployment behavior lives in `.github/workflows`; keep those scripts close to the recent Firebase Hosting-only pattern unless the Firebase project needs a focused change.
- The app should generally use the FantasyFilmBall-like house style: dark/night base, warm brown surfaces and borders, pink title/accent moments, and occasional playful Comic Sans/Chalkboard-style display typography where it fits.
- Keep the app modular, polished, and well organized, with files not too big.
- For CSS sizing, prefer `rem` for layout, spacing, widths, heights, radii, and other app-level scale decisions so global resizing stays predictable from the root font size.
- Use `em` for element-local sizing that should track the component's own text, such as icon size, inline spacing, or typography-relative padding.
- Avoid defaulting to `px` unless exact fixed geometry is intentionally required.
