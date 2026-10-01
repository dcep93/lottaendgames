# Custom KNN / h-pawn tablebase

Run `npm run generate:two-knights-pawn` from `app/`. Requires Python 3,
`clang++` with C++17, and the app's installed `tsx` / `chess.js`. Calculation is
fully offline. Temporary arrays and verification output live in ignored `work/`.

See [the rules, coverage and results](../../docs/two-knights-h-pawn.md).

## Pipeline

- `custom_geometry.hpp`: legal noncapture moves and reverse edges; fixed queen
  attacks; interchangeable-knight indexing.
- `custom_tablebase.cpp`: mate seeds, breadth-first retrograde, exhaustive
  forward Bellman checks, reverse-edge checks, full forward reachability,
  reachable-only binary export and independent-verifier fixtures.
- `generate.py`: compile, run, gzip, checksum, update runtime metadata/fixtures,
  remove superseded generated assets, and run independent verification.
- `verify-custom.mts`: compare native fixture moves to independently filtered
  chess.js legal moves; verify index agreement and custom terminal behavior;
  replay the complete root worst-resistance witness.

`python3 scripts/two-knights-pawn/generate.py --export-only` repackages an
already audited build. It refuses cached output whose recorded solver-source
hash differs from current source. A normal rebuild refreshes that provenance.

## Indexed graph

Squares use a1=0. Sort knight squares a<b and rank the unordered pair as
`a*(127-a)/2 + b-a-1` (2016 possibilities). Material layers are 0=Qh1,
1=ph2, 2=ph3 and 3=ph4. Side is 0=White, 1=Black.

```
board = ((layer*64 + whiteKing)*2016 + knightPair)*64 + blackKing
id = board*2 + side
```

There are 66,060,288 index slots. Legal nodes exclude occupied-square collisions,
adjacent kings and a side that just moved having left its own king in check.
Moves cannot capture; Qh1 has attacks but no moves. Pawn advances may give check
or promote, and every such legal defense must be handled. Terminal states use
the filtered permitted move list.

Distances count **plies**, not White turns. Black checkmates start at zero.
White needs one solved successor and uses min+1. Black requires every successor
solved and uses max+1. A FIFO retrograde frontier processes increasing distance;
Black's final processed child provides the maximum. Stalemates and White
checkmates never seed the White-winning attractor.

The no-forced-mate remainder is closed under all White moves and at least one
Black defense. A separate BFS from the default root follows every permitted
move, not merely the chosen policy, and establishes export membership.

## Binary format: KNNHDTM1

All integers are little endian. The 32-byte header contains:

| Offset | Contents |
|---:|---|
| 0 | Eight ASCII bytes `KNNHDTM1` |
| 8 | uint32 indexed slot count |
| 12 | uint32 reachable record count |
| 16 | uint32 bitmap byte length |
| 20 | uint32 version, currently 1 |
| 24, 28 | Reserved uint32 zeros |

The header is followed by a presence bitmap, least-significant bit first, then
uint16 distances for set bits in increasing ID order. Value 65534 means no
forced White mate; 65535 is invalid in an export. An absent bit is outside
coverage. A small browser prefix/popcount index gives the compact value offset.

Metadata includes raw/compressed lengths, raw SHA-256, solver-source hash,
root FEN and audit statistics. Download/decompression/checksum failure is
separate from an absent position or a no-forced-mate position.

## Local lookup benchmark

Run `app/node_modules/.bin/tsx scripts/two-knights-pawn/benchmark.mts` from the
repository root. It measures decompression/installation, lookups including FEN
parsing, and full root recommendations, without a browser game-tree search.
Results are saved under ignored `work/custom-tablebase-data/benchmark.json`.

## Historical a-file experiment

`explore-a-file.cpp`, `geometry.hpp`, `promotion.hpp`, `verify-a-file.py` and
`summarize-a-file.py` are retained for the separate historical strategy
experiment. They are **not** used by the active trainer or generation command;
their old capture/promotion/cage assumptions differ from the custom game above.
The old served three-stage policy and its generation pipeline are removed.
