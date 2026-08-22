# Two Bishops Minimal Training Info

## Design

Hide every Two Bishops help note and note-board diagram. Keep the underlying historical diagram data dormant for possible reuse when selected heuristics are rebuilt.

Training Info renders only the active White priorities (`mate`, `pieces safe`, `no stalemate`, `prepare mate`, and `king closer`) and the unchanged Black priorities.

## Verification

Render the Two Bishops guide and assert that it contains no Notes section, note boards, or legacy animation while retaining the active rule descriptions. Revalidate and reload a production loop at `cursor=0`.
