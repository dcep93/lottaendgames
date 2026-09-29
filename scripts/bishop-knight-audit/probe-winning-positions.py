"""Batch local Syzygy probes for the full audit's forced-mate eligibility filter.
Input: JSON array of [board-and-turn key, FEN]. Clocks reset by the caller.
Requires python-chess and KBNvK/KBvK/KNvK WDL tables.
"""
import hashlib
import json
import pathlib
import sys
import chess
import chess.syzygy

folder = pathlib.Path(sys.argv[1])
results = {}
with chess.syzygy.open_tablebase(str(folder), load_dtz=False) as tablebase:
    for key, fen in json.load(sys.stdin):
        board = chess.Board(fen)
        valid = board.is_valid()
        wdl = tablebase.probe_wdl(board) if valid else None
        # Syzygy is from the side-to-move perspective. +/-1 are 50-move draws.
        winning = valid and wdl == (2 if board.turn == chess.WHITE else -2)
        results[str(key)] = {"valid": valid, "wdl": wdl, "whiteWins": winning}
print(json.dumps({"pythonChessVersion": chess.__version__,
                  "tables": {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                             for p in sorted(folder.glob('*.rtbw'))},
                  "results": results}))
