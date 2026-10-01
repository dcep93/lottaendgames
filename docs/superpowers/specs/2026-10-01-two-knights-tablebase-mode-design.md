# Two knights: complete reachable tablebase mode

## Approved behavior

Replace the two-knights-versus-pawn stage policy with an exact tablebase for
the user's custom game. The default starting FEN is
`k7/8/8/8/3KN2p/7N/8/8 w - - 0 1`.

Coverage includes positions reached through **any permitted move** from this
start, including suboptimal White moves and suboptimal Black replies. It is
not limited to a selected optimal policy. Board state and side to move identify
a position; move counters do not affect its evaluation.

## Rules

- No captures by either side. Captures are prohibited moves, rather than legal
  defensive replies counted as failures.
- Ignore the fifty-move rule in the solver, trainer and replay validation for
  this mode. Repeated positions do not acquire a finite distance to mate.
- Both White knights can move. There is no fixed blockader, corner target,
  forbidden king file, blockade requirement or r1/r2/r3 ordering.
- The Black pawn moves normally down the h-file and promotes only to a queen
  on h1. The promoted queen never moves or captures, but its normal blocked-ray
  attacks still give check and prevent White's king entering attacked squares.
- Kings and knights attack normally. A move must obey check restrictions as
  well as the custom prohibitions. Determine checkmate and stalemate from the
  permitted move list, not the unrestricted chess.js move list.
- Black promotion is never omitted because it spoils White's win. White must
  handle every permitted Black reply, including all promoted-queen positions.

## Values and recommendations

Use exact minimax distance in plies to checkmate of Black. A Black-checkmated
position has distance zero. White minimizes successor distance plus one;
Black maximizes it plus one. A Black state is winning for White only when
every permitted successor is winning for White. Stalemate, White checkmate,
and positions outside White's winning attractor have no forced White mate.

For a winning White state, choose one deterministic shortest move. For a
winning Black state, identify **all** replies attaining the maximum distance.
Preserve the ability to inspect or play other permitted moves. After a mistake,
recompute from that state's table entry; do not remain bound to a previous line.

In a state without forced White mate, say **No forced mate**. Do not invent a
winning move or claim missing data. Keep permitted manual play available;
Black's drawing/otherwise win-denying replies must remain distinguishable from
replies that restore a White forced mate. No secondary optimization for these
non-winning positions is promised.

Missing, corrupt, loading, and outside-coverage data remain separate statuses.
An out-of-coverage pasted FEN must not be called drawn merely because it is
absent from the shipped table.

## Solver and data

Calculate the custom tablebase offline with compact indexed arrays and cached
retrograde results. The knights are interchangeable. No board reflections are
needed or assumed. The material layers reachable from this start are Black
h4, h3, h2, and a stationary queen on h1; White always retains KNN.

The offline solver may examine unreachable states to establish exact values,
but compute an independent forward reachability set from the starting FEN,
following all permitted moves and stopping at actual terminal states. Export
only reachable positions, including those without forced mate. Verify that
every nonterminal exported successor is covered.

Use a compact binary format with explicit value/status sentinels and versioned,
checksummed metadata. A position's move choices may be derived from successor
distances rather than duplicating move lists in the asset. This must recover
all optimal Black replies exactly and a stable White tie-break. Measure the
resulting download size, resident memory and lookup cost; do not put the graph
into a large JavaScript/JSON object or run searches during board interaction.

Existing sparse policy infrastructure can be replaced or adapted to the
measured data density. Loading must complete before recommendations are used.
Cold shared-link parsing must not depend on a loaded table. Shared lines use
the same custom move restrictions and must preserve the supplied board/FEN;
do not reset the clock to make a line load.

## App integration and cleanup

Replace the two-knights default start and active recommendation data. Remove
stage labels, r1/r2/r3 selection logic and stage-specific help text. Present
tablebase distance, optimal choices and no-forced-mate status plainly. Existing
Play Best, Black replies, Undo, Redo and replay links must work with the new
policy. Black queen moves, underpromotions and captures must not be offered
through any input path. Old links outside the new coverage need an explicit
unsupported explanation rather than an unexplained redirect.

Retire obsolete active two-knights stage assets and generation entry points;
retain useful historical analysis separately where it is still referenced.
Update documentation to identify this as a custom-rule tablebase, not ordinary
Syzygy/DTM chess. Do not alter bishop-and-knight data, two-bishop behavior or
book content.

## Verification and completion evidence

1. Independently validate legal moves, attacks, queen ray blocking, king safety,
   promotion, capture exclusions and custom terminal states.
2. Check forward/reverse edge consistency and exhaustive minimax equations.
   Prove finite winning distances decrease under selected White moves and
   every Black reply. Check closure of the non-winning remainder.
3. Verify all-permitted-move reachability and export closure, including mistakes
   and promoted states. Missing records must never masquerade as non-wins.
4. Compare runtime and generator values and optimal move sets, especially every
   tied best Black reply. Test manual deviations, cold replay links, supplied
   clocks beyond 100, and no-forced-mate positions.
5. Run targeted relevant tests and the app build. Report starting distance,
   reachable winning/non-winning/terminal counts, asset size and lookup
   performance. Load and verify a worst-resistance line from the new start.

No implementation is present in this design-only checkpoint.
