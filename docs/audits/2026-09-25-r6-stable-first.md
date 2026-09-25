# r6 stable bishop protection first — targeted recheck

The resulting position now determines r6's first priority: a knight protected by a stable bishop wins over an unprotected knight. Two protected candidates tie under r6. Otherwise the existing geometric drift and central-16 preferences apply. The displayed rule uses the requested wording.

The loaded Kh8/Ba4/Nd1 versus Kc5 position chooses **Kg7**, preserving bishop protection. Establishing protection with a bishop move also counts. Consequently r6 now selects **Bc2** ahead of r6.5's **Be8** in Kh8/Ba4/Nd1 versus Kb4.

## Scope and results

This is **not a full audit or a total loop estimate**. Rechecked all 746 D4-distinct four-ply cycles from the fresh d003cdc full audit under the current preferred White policy: **11 survive**, versus 698 before this change. No Black preference filter is used.

A targeted search then varied static pieces around the surviving bishop shuffles (432 candidates, no additional cycles), and tested king shuffles around Ba8/Nd5 and related bishop placements (1,112 candidate lines). It found **100 additional D4-distinct four-ply cycles**, involving **43 positions**, where the king shuffles while the knight remains stably bishop-protected. These were absent from the 746-cycle baseline. This brings the verified set to **at least 111 four-ply cycles**, not a domain-wide count.

The largest motif **in this targeted set** is therefore protected-knight king shuffling. The accompanying JSON includes ten examples and two bishop-shuffle examples. All twelve were independently replayed to check preferred White moves, legal Black replies, exact closure, D4 distinction, and exclusion of terminal/degenerate placements at every ply.

## Validation

- 63 focused tests pass, including D4 protection, drift geometry, safety-priority, and exclusion regressions.
- TypeScript and Vite production build pass.
- Existing stable-defense semantics retained: x-ray bishop control counts; adjacency to an edge bishop does not.
