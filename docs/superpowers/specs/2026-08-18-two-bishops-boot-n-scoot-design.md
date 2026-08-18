# Two Bishops Boot Scoot N Block Design

## Rule and order

Add this priority immediately after `edge flank`:

> **boot scoot n block** — When the kings are in opposition and a bishop controls the secondary squeeze diagonal on the side closer to the kings, moat use a bishop to boot the king towards that squeeze diagonal. Then scoot to opposition on the next position. Finally, block the king's escape. (See gif)

The rule applies in both phases. Existing universal safeguards and `edge flank`
remain earlier; Rule S and every later priority remain after it.

## Stateless three-stage geometry

The evaluator recognizes all three stages from the current board, without move
history.

### Bishop boot

When the kings are in direct opposition, derive both existing opposition
squeeze geometries. A geometry is prepared when one bishop controls its
secondary diagonal and that diagonal is on the side closer to the kings. For
vertical opposition, compare the kings' shared file with the a-file and h-file
walls. For horizontal opposition, compare their shared rank with the first-
rank and eighth-rank walls. Retain only the squeeze geometry on the nearer
side.

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
opposition. The nearer-side squeeze geometry determines the moat anchor. The
move completes this stage only when one bishop controls that geometry's primary
diagonal, the other bishop controls a derived secondary diagonal, and White's
king moved closer to the anchored primary diagonal. Bishop edge placement and
distance from White's king do not choose the anchor.

### Block the escape

When no scoot qualifies from a knight-separated position, derive the direct
opposition created by the available White king move. If a bishop instead
controls the nearer-side geometry's secondary diagonal while the other bishop
controls a derived primary diagonal, the position is the block stage rather
than a reverse scoot. The block must be a nonchecking bishop move that forces
every Black reply either into direct opposition or farther from the current
King moat.

In the supplied line, `Bg4` completes the bishop boot. After `...Kc2`, `Kc4`
completes the scoot. After `...Kd2`, the anchored `a3` bishop switches from the
primary to the secondary role, so `Bc5` blocks the escape.

The waiting-bishop line behaves the same way: `Bh5` completes the boot,
`Kc4` takes opposition after `...Kc2`, and `Bc5` blocks after `...Kd2`.
Although h5 is also an edge square, it must not displace a3 as the qualifying
primary-diagonal anchor.

## Guide note and animation

Replace the existing moat-opposition note with:

> Moat modifier means Black may widen the King moat instead of satisfying the rule's requested response.

Add an animated guide figure titled `boot scoot n block` immediately after the edge
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
- Assert `Bg4`, `Kc4`, and `Bc5` are uniquely ideal with reason
  `boot scoot n block`.
- Assert `Bh5`, `Kc4`, and `Bc5` are uniquely ideal in the supplied line, with
  every White move explained by `boot scoot n block`.
- Assert an initial boot is accepted only when its controlled secondary
  squeeze diagonal is on the board-wall side nearer the opposed kings. In the
  supplied loop, `Bg3` is rejected because e-file kings are closer to the
  h-file wall while the prepared diagonal is on the a-file side.
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
