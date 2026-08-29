# Two Bishops Rule r4 Bc5 Entry Design

## Goal

From `3KBB2/1k6/8/8/8/8/8/8 w - - 0 1`, uniquely prefer `Bc5` and report it as rule r4 under every board rotation and reflection.

## Selected approach

Add a small symmetry-expanded r4 entry-exception map separate from the certified r4 mating-kernel map. Rule r4 activation and scoring consult the exception first. The resulting position is then evaluated normally on later turns unless it independently satisfies r4.

This preserves the existing mating-kernel audit: the requested position is deliberately labeled r4 even though it is not being asserted as a member of the fully enumerated forced-mate kernel.

## Alternatives rejected

- Adding the position to the certified kernel would falsely require every Black reply to already have an enumerated r4 continuation.
- Broadening r4 geometry would affect unrelated positions and recreate earlier over-activation bugs.
- Relabeling the move without changing selection would not guarantee `Bc5` is uniquely preferred.

## Verification

Add focused tests for unique `Bc5`, r4 attribution, and all D4 symmetries. Keep the certified-kernel audit unchanged, run the focused Two Bishops suite, then run the cached early-exit loop search and load a genuine non-r4 loop at cursor 0.
