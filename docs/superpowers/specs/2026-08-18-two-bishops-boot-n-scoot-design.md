# Two Bishops Boot N Scoot Design

## Rule and order

Add this priority immediately after `edge flank`:

> **boot n scoot** — When the kings are in opposition and a bishop controls the secondary squeeze diagonal, use a bishop boot to scoot towards that moat diagonal then take opposition from the next position. You'll be able to force a king push soon.

The rule applies in both phases. Existing universal safeguards and `edge flank`
remain earlier; Rule S and every later priority remain after it.

## Stateless two-stage geometry

The evaluator recognizes both stages from the current board, without move
history.

### Bishop boot

When the kings are in direct opposition, derive both existing opposition
squeeze geometries. A geometry is prepared when one bishop controls its
secondary diagonal.

A bishop move completes the boot for a prepared geometry when it moves the
other bishop, preserves the secondary controller, and every legal Black king
reply does at least one of the following:

- moves strictly closer to the prepared secondary diagonal; or
- increases its orthogonal distance from the King moat halfway between the
  starting kings.

The second outcome is the moat modifier.

### Take opposition

When the kings are a knight's move apart, evaluate each legal White king move
that takes direct opposition. Derive both squeeze bundles from the resulting
opposition. The move completes this stage only when one bishop controls the
bundle's primary diagonal, the other controls its matching secondary diagonal,
and White's king moved closer to that secondary diagonal. This recognizes the
position immediately after the scoot without also claiming a later return
toward the wrong squeeze bundle.

### Boot after the moat modifier

When the kings are a knight's move apart, derive each square where Black could
return to direct opposition with White's king. For each resulting squeeze
bundle whose secondary diagonal is already controlled, a quiet bishop move
completes the boot when it moves the other bishop, preserves the secondary
controller, and every legal Black reply either takes direct opposition or
increases its orthogonal distance from the current King moat.

This stage recognizes the continuation after Black uses the moat modifier.
Checking bishop moves do not count as boots.

In the supplied line, `Bg4` completes the bishop boot. After `...Kc2`, `Kc4`
completes the opposition stage. After `...Kd2`, the existing Rule T selects
`Bc5`; Boot N Scoot does not claim that third White move.

In the second supplied line, `Ke4` completes the opposition stage. After
`...Kf2`, `Bc7` is the quiet boot that preserves the prepared secondary
diagonal and forces Black either back to opposition or farther from the moat.

## Guide note and animation

Replace the existing moat-opposition note with:

> Moat modifier means Black may widen the King moat instead of satisfying the rule's requested response.

Add an animated guide figure titled `boot n scoot` immediately after the edge
flank figure. Render the supplied line on a full board in this order:

1. `8/8/4B3/8/3K4/B7/3k4/8 w - - 14 8`
2. `Bg4`
3. `...Kc2`
4. `Kc4`
5. `...Kd2`
6. `Bc5`

Show each of the first five frames for one second, then hold the final frame
for five seconds. The complete GIF therefore lasts ten seconds, with the move
progression occupying the first five seconds.

Extend the note-board presentation model with optional animation source and
alternative text. Animated figures render an image instead of a static board,
while all existing static diagrams remain unchanged. Generate and check the
GIF deterministically from a repository script.

## Verification

- Assert the exact rule order and rendered wording.
- Assert `Bg4` and then `Kc4` are uniquely ideal with reason `boot n scoot`.
- Assert `Bc5` remains uniquely ideal under Rule T.
- Assert `Ke4` and then `Bc7` are uniquely ideal under `boot n scoot`.
- Treat every White move in the rendered GIF sequence as an executable best-
  move assertion, so guide drift fails the test suite.
- Cover translations, rotations, reflections, both stages, both phases, and
  negative geometry cases.
- Verify the replacement note, animation metadata, GIF dimensions, frame
  sequence, one-second progression frames, and five-second final hold.
- Run the focused rules and presentation suites, lint, build, animation and
  diagram drift checks, and `git diff --check`.
- Find and open a strict Phase 1 loop, treating entry into Phase 2 as
  termination.
