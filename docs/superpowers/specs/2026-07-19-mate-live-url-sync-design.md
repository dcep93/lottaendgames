# Mate Live URL Sync Design

## Goal

Keep the current Mate position represented directly in the address bar so reloading or copying the live URL restores the same board.

## URL representation

- Add a live-position hash: `#live=<current FEN>`.
- Store only the visible committed FEN. Reloading intentionally starts a new session at that position and does not restore prior Undo/Redo history.
- Keep existing `#fen=<starting FEN>` and `#fen=<starting FEN>&moves=<line>` links unchanged for starting-position sharing and explicit replay/debugging history.
- A live-position decoder accepts a legal non-terminal Mate position or a recognized terminal Mate outcome. Training Wheels live positions do not need to be original curated seeds.

## Synchronization

- After the workspace creates or commits a session, derive the canonical relative Mate URL from its material, mode, and current FEN.
- Replace the current browser-history entry rather than pushing a new entry. Chess moves must not pollute browser Back/Forward navigation.
- Sync generated starts, ordinary play, Play Best after its animation commits, Undo, Redo, Start Over, and historical move/reply replacements.
- Undo and Redo replace the live FEN with the newly visible snapshot. Their in-memory history remains available until reload.

## Ownership

- A pure helper converts the material, mode, and current FEN into the live relative URL.
- `MateWorkspace` emits that URL when its committed session changes.
- `App` owns the actual `history.replaceState` call, keeping browser mutation at the routing boundary.
- Route decoding validates live FEN data rather than trusting the URL. Existing replay validation is unchanged.

## Failure behavior

- If a derived URL already matches the current address, do nothing.
- Invalid external replay URLs retain the existing route fallback.
- Invalid or unsupported live FEN falls back through the existing Mate route behavior.

## Testing

- Test live FEN encoding, canonical decoding, Training Wheels resumption, terminal resumption, and invalid-state rejection.
- Test workspace emissions after initialization, play, Undo, Redo, and Start Over.
- Verify locally that moving and undoing replace `#live` with the current FEN and that reload restores the visible board without history.
