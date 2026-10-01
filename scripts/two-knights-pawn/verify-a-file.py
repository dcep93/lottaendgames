"""Independent python-chess verification of the offline a-file policy graph."""
import sys
import mmap
from pathlib import Path
import chess

root = Path(sys.argv[1])
pairs = [(a, b) for a in range(64) for b in range(a + 1, 64)]
pair_ids = {pair: i for i, pair in enumerate(pairs)}
cages = [{56, 57}, {56, 48}, {0, 1}, {0, 8}]
rows = {}
for line in (root / 'proof.txt').read_text().splitlines():
    i, bt, stage, cage, plies, quiet, later, move = map(int, line.split())
    rows[i, bt, stage, cage] = (plies, quiet, later, move)

def board(i, bt):
    k = i % 64
    i //= 64
    a, n = pairs[i % 2016]
    i //= 2016
    w = i % 64
    p = (i // 64 + 1) * 8 + 7
    b = chess.Board(None)
    for sq, symbol in [(w, 'K'), (a, 'N'), (n, 'N'), (k, 'k'), (p, 'p')]:
        b.set_piece_at(sq, chess.Piece.from_symbol(symbol))
    b.turn = not bt
    return b

def index(b):
    a, n = sorted(b.pieces(chess.KNIGHT, chess.WHITE))
    p = next(iter(b.pieces(chess.PAWN, chess.BLACK)))
    return (((p // 8 - 1) * 64 + b.king(chess.WHITE)) * 2016 + pair_ids[a, n]) * 64 + b.king(chess.BLACK)

seeds = {}
for line in (root / 'lock-seeds.txt').read_text().splitlines():
    i, bt, cage = map(int, line.split())
    seeds[i, bt] = cage
    b = board(i, bt)
    pawn = next(iter(b.pieces(chess.PAWN, chess.BLACK)))
    blocker = pawn - 8
    assert blocker in b.pieces(chess.KNIGHT, chess.WHITE)
    b.remove_piece_at(blocker)
    guard = next(iter(b.pieces(chess.KNIGHT, chess.WHITE)))
    forbidden = set(b.attacks(guard)) | set(b.attacks(b.king(chess.WHITE))) | {b.king(chess.WHITE), pawn}
    region = {b.king(chess.BLACK)}
    frontier = list(region)
    while frontier:
        square = frontier.pop()
        for nxt in chess.SquareSet(chess.BB_KING_ATTACKS[square]):
            if nxt not in forbidden and nxt not in region:
                region.add(nxt)
                frontier.append(nxt)
    assert guard not in region and region <= cages[cage]
    assert (56 if cage < 2 else 0) in region
lock = []
for name in ['lock-w.bin', 'lock-b.bin']:
    f = open(root / name, 'rb')
    lock.append(mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ))

def successor(b, stage, cage):
    i, bt = index(b), int(not b.turn)
    if stage == 3 and int.from_bytes(lock[bt][2*i:2*i+2], 'little') != 65535:
        stage = 2
    if stage == 2 and (i, bt) in seeds:
        stage, cage = 1, seeds[i, bt]
    key = (i, bt, stage, cage if stage == 1 else 0)
    assert key in rows, (b.fen(), key)
    return key

edges = promotions = 0
for key, data in rows.items():
    i, bt, stage, cage = key
    plies, quiet, later, code = data
    b = board(i, bt)
    assert b.is_valid(), b.fen()
    assert b.king(chess.BLACK) % 8 < 5
    if stage == 1:
        assert b.king(chess.BLACK) in cages[cage]
    if stage == 2:
        assert next(iter(b.pieces(chess.PAWN, chess.BLACK))) - 8 in b.pieces(chess.KNIGHT, chess.WHITE)
    if b.is_checkmate():
        assert bt and plies == 0 and b.king(chess.BLACK) % 8 == 0
        continue
    assert not b.is_stalemate()
    moves = list(b.legal_moves) if bt else [chess.Move(code // 64, code % 64)]
    worst = q = l = 0
    for move in moves:
        assert move in b.legal_moves and not b.is_capture(move), (b.fen(), move)
        zeroing = b.is_zeroing(move)
        b.push(move)
        edges += 1
        assert b.king(chess.BLACK) % 8 < 5
        if stage == 1:
            assert b.king(chess.BLACK) in cages[cage]
        if move.promotion:
            promotions += 1
            mates = []
            for wm in list(b.legal_moves):
                b.push(wm)
                if b.is_checkmate() and len(b.pieces(chess.KNIGHT, chess.WHITE)) == 2 and b.king(chess.BLACK) % 8 == 0:
                    mates.append(wm)
                b.pop()
            assert mates
            worst = max(worst, 2)
        else:
            child = successor(b, stage, cage)
            cp, cq, cl, _ = rows[child]
            worst = max(worst, cp + 1)
            if zeroing:
                l = max(l, cq, cl)
            else:
                if cp:
                    q = max(q, cq + 1)
                l = max(l, cl)
        b.pop()
    assert (worst, q, l) == (plies, quiet, later), (key, data, (worst, q, l))
print(f'Verified {len(rows)} phase/cage states, {edges} legal edges, {promotions} promotion replies; all minimax durations and clock bounds agree.')
