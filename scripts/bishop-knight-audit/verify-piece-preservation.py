"""Independently validate every generated r5.2 move against local Syzygy WDL."""
import argparse
import json
from pathlib import Path

import chess
import chess.syzygy

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--tables', required=True)
parser.add_argument('--data', default='app/src/mate/rules/bishopKnightPiecePreservationData.json')
args = parser.parse_args()
rows = json.loads(Path(args.data).read_text())['moves']
seen = set()
with chess.syzygy.open_tablebase(args.tables, load_dtz=False) as tables:
    for source, encoded in rows:
        assert source not in seen
        seen.add(source)
        board = chess.Board(None)
        board.turn = chess.WHITE
        placements = [(source >> 18, chess.KING, chess.WHITE),
                      ((source >> 12) & 63, chess.BISHOP, chess.WHITE),
                      ((source >> 6) & 63, chess.KNIGHT, chess.WHITE),
                      (source & 63, chess.KING, chess.BLACK)]
        for square, piece, color in placements:
            board.set_piece_at(square, chess.Piece(piece, color))
        assert board.is_valid(), board.fen()
        assert tables.probe_wdl(board) == 2, board.fen()
        move = chess.Move(encoded >> 6, encoded & 63)
        assert move in board.legal_moves, (board.fen(), move.uci())
        board.push(move)
        assert tables.probe_wdl(board) == -2, (source, move.uci(), board.fen())
print(json.dumps({'entries': len(rows), 'legal': True, 'allPreserveWin': True}))
