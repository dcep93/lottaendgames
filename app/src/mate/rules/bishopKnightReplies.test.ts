import assert from 'node:assert/strict';
import test from 'node:test';
import {findPiece, getChess, SQUARE_TRANSFORMS, transformFen} from '../chess';
import {bishopKnightBlackReplies} from './bishopKnightReplies';

const fixtures = [
  '4K3/8/2N1k3/8/8/8/8/7B b - - 0 1',
  '7K/8/8/8/8/8/1Bk5/7N b - - 0 1', // bishop capture
  '7K/8/8/8/8/8/1Nk5/3B4 b - - 0 1', // knight capture
  'k7/1BK5/2N5/8/8/8/8/8 b - - 0 1', // checkmate
  'k7/2K5/2N5/2B5/8/8/8/8 b - - 0 1', // stalemate
  '8/8/8/8/8/2K5/2BN4/1k6 b - - 0 1', // check
];

test('lightweight KBNvK replies match chess.js, including captures and terminal positions, across D4',()=>{
  assert.ok(getChess(fixtures[1]!).moves({verbose:true}).some(move=>move.captured==='b'));
  assert.ok(getChess(fixtures[2]!).moves({verbose:true}).some(move=>move.captured==='n'));
  assert.ok(getChess(fixtures[3]!).isCheckmate());
  assert.ok(getChess(fixtures[4]!).isStalemate());
  assert.ok(getChess(fixtures[5]!).isCheck());
  for(const f of fixtures) for(const t of SQUARE_TRANSFORMS){
    const fen=transformFen(f,t),chess=getChess(fen),before=chess.fen();
    const expected=chess.moves({verbose:true}).map(({san,from,to,piece,captured})=>({san,from,to,piece,captured}));
    const actual=bishopKnightBlackReplies(chess,findPiece(fen,'b','k')?.square);
    assert.deepEqual(actual,expected,fen);
    assert.equal(chess.fen(),before);
    for(const reply of actual){assert.equal(chess.move(reply).san,reply.san);chess.undo();}
    assert.equal(chess.fen(),before);
  }
});

test('reply generation retains general-position fallback',()=>{
  const chess=getChess('r3k2r/8/8/8/8/8/8/4K3 b kq - 0 1');
  assert.deepEqual(bishopKnightBlackReplies(chess,'e8'),chess.moves({verbose:true}));
});
