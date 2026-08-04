# Two Bishops Degenerate Edge Repair Design

## Goal

Treat the supplied Phase 2 edge formation as a Degenerate position and recommend the geometric equivalent of `Be2` before Sequester runs.

## Geometry

For a corner and either incident edge, recognize this D4-symmetric arrangement:

- Black is two edge squares from the corner.
- White's king is two squares inward and one edge square from that corner.
- The bishops occupy the third and fourth inward squares on the corner's rank/file.

Repair it by moving the farther bishop to the square three inward and one along the edge. In the supplied orientation this is `d1-e2` (`Be2`).

## Architecture

Represent a Degenerate repair as an origin plus an optional exact destination. Existing repairs continue to accept their current safe moves from the selected bishop. This new repair supplies both origin and destination, so only the transformed `Be2` survives Degenerate.

Add a third Degenerate diagram using the supplied position and repair arrow. Keep the rendered rule text `repair degenerate positions`.

## Verification

Assert the exact move in the supplied position and every D4 transform, preserve existing Degenerate tests, regenerate/check diagrams, run focused Two Bishops tests and TypeScript, then run the fail-fast loop gate. Do not run the full mate suite, commit, push, deploy, or synchronize the plan archive.
