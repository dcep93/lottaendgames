# Lotta Endgames Vite Stub Design

## Goal

Initialize `lottaendgames` as a small Vite React TypeScript app that follows the recent repo patterns while staying intentionally stubbed. The repo should be ready for Firebase Hosting deployment, but it must not include Firebase Auth, Realtime Database, database rules, database targets, or a Firebase runtime dependency.

## Context

`lottaendgames` is currently an empty git repo. `fantasyfilmball` provides the requested app shape: a Vite app under `app/`, real app code under `app/src/app_x`, and GitHub workflow scripts that record build metadata before building and deploying.

Recent hosting-only repos such as `bacondegrees420` and `pleasedateme` provide the better deployment reference for this project. Their Firebase deploy scripts generate only Hosting config and `.firebaserc`, with no database rules or Firebase database targets.

## Architecture

The repo will contain a Vite React TypeScript app in `app/`.

The React entrypoint will stay thin:

- `app/src/main.tsx` renders `AppX`.
- `app/src/App.tsx` re-exports `./app_x`.
- `app/src/app_x/index.tsx` contains the initial stub UI.
- `app/src/app_x/config/sha_x.json` starts with empty build metadata and is overwritten by CI.
- `app/src/app_x/config/sha_x.ts` may expose a tiny helper for reading the metadata in future app code.

The stub UI should be modest and clearly temporary, while still carrying the intended house style.

## Styling

The default visual direction is FantasyFilmBall-like:

- dark/night base;
- warm brown panels, surfaces, and borders;
- pink title or accent moments;
- occasional playful Comic Sans, Chalkboard, or similar display typography where it fits;
- modular, polished components;
- `rem` for app-level spacing and sizing;
- `em` for element-local sizing that should track text.

This should be recorded in `AGENTS.md` so future work treats the brown/pink/playful-display-type vibe as the house style, not merely generic night mode.

## Deployment

The repo will include `.github/workflows` with the split-script pattern used by recent repos:

- `workflow.yaml`
- `record_sha.sh`
- `build_react.sh`
- `deploy_to_firebase.sh`

`record_sha.sh` writes to `app/src/app_x/config/sha_x.json`.

`build_react.sh` keeps the reference Vite creation comment, installs dependencies in `app/`, builds the app, and removes `node_modules` afterward.

`deploy_to_firebase.sh` accepts the service account JSON through `${{ secrets.SA_KEY }}`. It keeps the hosting setup comments from recent repos, authenticates with `gcloud`, verifies the service account project id is `lottaendgames`, generates a Hosting-only `firebase.json`, generates a simple `.firebaserc`, and deploys to Firebase Hosting only.

There will be no `database.rules.json`, no database deploy target, no database setup comments, and no Auth or Identity Toolkit setup.

## Repository Guidance

Add root `AGENTS.md` with these rules:

- most app behavior belongs in `app/src/app_x`;
- shared static assets belong in `app/public`;
- deployment behavior lives in `.github/workflows`;
- keep workflow scripts close to the recent hosting-only pattern unless the Firebase project requires a focused change;
- keep the app modular and files reasonably small;
- use the brown/pink/playful FantasyFilmBall-style direction;
- prefer `rem` for app-level layout and `em` for text-relative local sizing.

Add a root `.gitignore` for service account files and generated Firebase files. Use the standard Vite app `.gitignore` inside `app/`.

## Verification

After implementation, run these checks inside `app/`:

- `npm install`
- `npm run build`
- `npm run lint`

If the chosen package template includes a test script, run it too.

## Out Of Scope

This initialization will not build actual endgame features, chess/game logic, user accounts, persistent storage, Firebase database rules, or production content beyond a small placeholder screen.
