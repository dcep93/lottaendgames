# Lotta Endgames

Vite React app for Lotta Endgames.

## Local Development

```sh
npm install
npm run dev
```

## Deployment

GitHub Actions deploys the Vite `dist` directory to Firebase Hosting with the
service account JSON stored in the `SA_KEY` secret.

## Analytics

Google Analytics (GA4) can use the web stream linked to the existing Firebase
project. Firebase Analytics is available on the no-cost Spark plan; this
integration does not require enabling billing or upgrading to Blaze.

1. In Firebase project settings → Integrations, enable Google Analytics if needed.
   Register a web app if the project has no web stream, then copy its `G-…`
   measurement ID.
2. In the linked GA4 web stream, **turn off Enhanced measurement**. The app sends
   its own page views and events. Automatic history tracking would count live FEN
   changes as visits, and automatic link tracking could collect shared positions.
3. The Firebase-linked measurement ID `G-MW95V6RNBY` is configured in
   `.env.production` as `VITE_GA_MEASUREMENT_ID`. Vite loads it for production
   builds, including GitHub Actions, so no repository variable is required.
   IDs are public, not credentials. An explicit build environment variable can
   override it; an empty/invalid value disables analytics.
4. Deploy, visit the production site, and verify events in GA4 Realtime.
   Receiving events in the real account must be verified after deployment.

Tracked events: `page_view`, `training_started`, `training_completed`,
`training_info_opened`, and `reason_hints_enabled`. Starts require an accepted
move. Completions mean White checkmated Black and are counted once per game;
undo/redo, history edits, and imported replays do not generate completions.
Start Over permits a new start/completion. Completions include `mating_set`,
`training_style`, `duration_seconds`, `white_moves`, and `used_play_best`.
Register the categorical parameters as event-scoped custom dimensions in GA4
to break reports down by material, training style, or assistance.

URLs exclude board/replay fragments and arbitrary query parameters; the initial
page retains only UTM campaign tags. No FEN, PGN, or individual move events are
sent by this integration. Development and localhost are disabled. Google tag
loading is asynchronous and blocked analytics does not stop the app. This is
standard GA4 browser analytics (including its analytics cookies), not anonymous
server-side counting; configure your site's privacy/consent requirements before
enabling collection.

Run `npm run test:analytics` for the analytics regression tests.

References: [Firebase setup](https://firebase.google.com/docs/analytics/web/get-started),
[Firebase pricing](https://firebase.google.com/pricing),
[manual GA4 page views](https://developers.google.com/analytics/devguides/collection/ga4/views).
