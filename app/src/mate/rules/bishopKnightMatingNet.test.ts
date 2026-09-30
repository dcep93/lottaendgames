// Historical declaration tests. Current stage behavior is exhaustively checked in bishopKnightStages.test.ts.
import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {matingNetMoves} from './bishopKnightMatingNet';
import {matingNetLine,matingNetStart,matingNetBranchLine,matingNetBranchStart,matingNetBishopBranchLine,matingNetBishopBranchStart,matingNetKh2BranchLine,matingNetKf2BranchLine,matingNetKf1PartialLine,matingNetKg1BranchLine,matingNetCorrectedBishopLine} from './bishopKnightMatingNetLine';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from '../../../../scripts/bishop-knight-audit/historical-policy.mts';

// r1 accepts both arrivals in these positions; temporary r3 now resolves the tie.
function r3Tiebreak(fen: string, historical: string): string {
 for (const [source,from,to] of [
  ['8/8/8/8/2B5/6K1/6N1/6k1 w - - 0 1','c4','e2'],
  ['8/8/8/8/5N2/1B3K2/7k/8 w - - 0 1','b3','e6'],
  ['8/8/8/8/2B2N2/6K1/8/7k w - - 0 1','c4','e2'],
 ] as const) for (const t of SQUARE_TRANSFORMS) {
  if (transformFen(source,t).split(' ')[0] !== fen.split(' ')[0]) continue;
  const move=getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)});
  assert.ok(matingNetMoves(fen).includes(move.from+move.to));
  return move.san;
 }
 return historical;
}

test('r1 selects loaded seventh Bd5 by full destination across D4', () => {
 const board=getChess('8/8/8/4N3/3KB3/8/5k2/8 w - - 0 1');
 for(const san of 'Nc4 Kg3 Ke5 Kg4 Kf6 Kh4 Kf5 Kh5 Ne5 Kh6 Ng6 Kg7'.split(' ')) board.move(san);
 for(const transform of SQUARE_TRANSFORMS){
  const fen=transformFen(board.fen(),transform);
  const move=getChess(fen).move({from:transformSquare('e4',transform),to:transformSquare('d5',transform)});
  assert.deepEqual(matingNetMoves(fen),[move.from+move.to]);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,move.san).matingNetPenalty,0);
 }
});

test('r1 selects loaded seventh Kf4 by full destination across D4', () => {
 const board=getChess('8/8/8/4N3/3KB3/8/5k2/8 w - - 0 1');
 for(const san of 'Nc4 Kg3 Ke5 Kg4 Kf6 Kh4 Kf5 Kh5 Ne5 Kh4 Ng4 Kh5'.split(' ')) board.move(san);
 for(const transform of SQUARE_TRANSFORMS){
  const fen=transformFen(board.fen(),transform);
  const move=getChess(fen).move({from:transformSquare('f5',transform),to:transformSquare('f4',transform)});
  assert.deepEqual(matingNetMoves(fen),[move.from+move.to]);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,move.san).matingNetPenalty,0);
 }
});

test('r1 selects loaded eleventh Bd5 by full destination across D4', () => {
 const board=getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
 for(const san of 'Nc4 Kf2 Ke5 Ke1 Kf4 Kd1 Ke3 Kc1 Bd3 Kd1 Na3 Kc1 Nc2 Kd1 Be4 Kc1 Kd3 Kb1 Kc3 Kc1'.split(' ')) board.move(san);
 for(const transform of SQUARE_TRANSFORMS){
  const fen=transformFen(board.fen(),transform);
  const move=getChess(fen).move({from:transformSquare('e4',transform),to:transformSquare('d5',transform)});
  assert.deepEqual(matingNetMoves(fen),[move.from+move.to]);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,move.san).matingNetPenalty,0);
 }
});

test('r1 selects all 15 loaded White moves across D4 and finishes in checkmate',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of matingNetLine){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
   assert.equal(scoreKnightAndBishopWhiteMove(fen,expected.san).matingNetPenalty,0);
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/8/5BKN/8/7k b - - 35 18');
 }
});

test('r1 matches full destinations from other sources and moving pieces, not nearby formations',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  for(const [source,from,to] of [
   ['8/8/8/8/8/1NK5/B7/3k4 w - - 0 1','b3','d4'],
   ['8/8/8/8/3N4/1K6/B7/3k4 w - - 0 1','b3','c3'],
  ] as const){
   const fen=transformFen(source,transform);const move=getChess(fen).move({from:transformSquare(from,transform),to:transformSquare(to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
 }
 assert.deepEqual(matingNetMoves(matingNetStart.replace(' w ',' b ')),[]);
 assert.deepEqual(matingNetMoves('8/8/8/8/8/2K5/B1N5/7k w - - 0 1'),[]);
 assert.deepEqual(matingNetMoves('7R/8/8/8/8/2K5/B1N5/3k4 w - - 0 1'),[]);
});

test('r1 precedes r2 after universal safety priorities and includes the GIF',()=>{
 const ids=knightAndBishopWhiteRules.map(r=>r.id);
 assert.equal(ids[ids.indexOf('no stalemate')+1],'r1');assert.equal(ids[ids.indexOf('r1')+1],'r2');
 assert.equal(knightAndBishopWhiteRules.find(r=>r.id==='r1')!.helpText,'Execute the mating net.');
 const diagram=bishopKnightRuleSet.help.noteBoards.find(b=>b.id==='bishop-knight-rule-r1-net')!;
 assert.equal(diagram.animationSrc,'/mate/bishop-knight/r1-mating-net.gif');
});

test('r1 prefers the loaded Be4/Kg3/Nh3/Black Kh1 mating destination across D4',()=>{
 const target='8/8/8/8/4B3/6KN/8/7k b - - 23 12';
 assert.ok(getChess(target).isCheckmate());
 for(const transform of SQUARE_TRANSFORMS) for(const [source,from,to] of [
  ['8/8/8/8/8/3B2KN/8/7k w - - 22 12','d3','e4'],
  ['8/8/8/8/4B3/5K1N/8/7k w - - 0 1','f3','g3'],
 ] as const){
  const fen=transformFen(source,transform),b=getChess(fen);
  const move=b.move({from:transformSquare(from,transform),to:transformSquare(to,transform)});
  assert.equal(b.fen().split(' ').slice(0,4).join(' '),transformFen(target,transform).split(' ').slice(0,4).join(' '));
  assert.ok(b.isCheckmate());
  assert.deepEqual(matingNetMoves(fen),[move.from+move.to]);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
 }
});

test('r1 selects all 12 White moves in the loaded Be4 mate branch, across D4',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetBranchStart);
  for(const san of matingNetBranchLine){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[r3Tiebreak(fen,expected.san)],`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
   assert.equal(scoreKnightAndBishopWhiteMove(fen,expected.san).matingNetPenalty,0);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/4B3/6KN/8/7k b - - 23 12');
 }
});


test('r1 selects the entire loaded Bb3 branch across D4, including Kf3 and Bc4+',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetBishopBranchStart);
  for(const san of matingNetBishopBranchLine){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[r3Tiebreak(fen,expected.san)],`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
   assert.equal(scoreKnightAndBishopWhiteMove(fen,expected.san).matingNetPenalty,0);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
 }
});


test('r1 selects all 13 White moves in the loaded Kh2 branch across D4',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of matingNetKh2BranchLine){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[r3Tiebreak(fen,expected.san)],`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/4B3/6KN/8/7k b - - 31 16');
 }
});


test('r1 selects Kd3 after Nd4 Ke1 by full destination across D4',()=>{
 const target='8/8/8/8/3N4/3K4/B7/4k3 b - - 9 5';
 for(const transform of SQUARE_TRANSFORMS) for(const [source,from,to] of [
  ['8/8/8/8/3N4/2K5/B7/4k3 w - - 8 5','c3','d3'],
  ['8/8/8/8/3N4/8/B1K5/4k3 w - - 0 1','c2','d3'],
  ['8/8/8/5N2/8/3K4/B7/4k3 w - - 0 1','f5','d4'],
 ] as const){
  const fen=transformFen(source,transform),board=getChess(fen);
  const expected=board.move({from:transformSquare(from,transform),to:transformSquare(to,transform)});
  assert.equal(board.fen().split(' ').slice(0,4).join(' '),transformFen(target,transform).split(' ').slice(0,4).join(' '));
  assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san]);
  assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
 }
});


test('r1 preserves the Kf2/Be6 branch with the newly declared Ng2 finish across D4',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  // Latest declaration replaces the direct Bc4 finish with Ng2/Bc4+/Kg3.
  for(const san of [...matingNetKf2BranchLine.slice(0,14),'Ng2','Kf1','Bc4+','Kg1','Kg3','Kh1','Nf4','Kg1','Nh3+','Kh1','Bd5#']){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/3B4/8/6KN/8/7k b - - 31 16');
 }
});


test('r1 preserves historical Kf1/Bf5 destinations except superseded early Ke3',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of matingNetKf1PartialLine){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   // This historical source now prefers the user's corrected Ne2 order.
   // Continue replaying the old legal route to retain its downstream coverage.
   if(before.split(' ').slice(0,4).join(' ')==='8/8/8/8/3N4/3K4/B7/5k2 w - -'){
    const corrected=getChess(fen).move({from:transformSquare('d4',transform),to:transformSquare('e2',transform)});
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[corrected.san]);
    assert.deepEqual(matingNetMoves(fen),[corrected.from+corrected.to]);
    continue;
   }
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
  }
  assert.equal(board.fen(),'8/8/8/5B2/8/5K2/4N2k/8 w - - 20 11');
 }
});


test('r1 selects loaded 4.Ke3 with Black still on f1, by full destination across D4',()=>{
 const source='8/8/8/8/8/3K4/B3N3/5k2 w - - 12 7';
 const target='8/8/8/8/8/4K3/B3N3/5k2 b - - 13 7';
 for(const transform of SQUARE_TRANSFORMS){
  const fen=transformFen(source,transform),board=getChess(fen);
  const expected=board.move({from:transformSquare('d3',transform),to:transformSquare('e3',transform)});
  assert.equal(board.fen(),transformFen(target,transform));
  assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san]);
  assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
 }
 const replay=getChess(matingNetStart);
 for(const san of ['Nd4','Ke1','Kd3','Kf2','Ne2','Kf1','Ke3','Ke1']){
  if(replay.turn()==='w')assert.deepEqual(getIdealKnightAndBishopWhiteMoves(replay.fen()),[san]);
  replay.move(san);
 }
 assert.equal(replay.fen(),'8/8/8/8/8/4K3/B3N3/4k3 w - - 14 8');
});


test('r1 preserves historical Kg1 branch except corrected early Ne2 and Ng2 finish',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  // Latest declaration replaces the direct Bc4 finish with Ng2/Bc4+/Kg3.
  for(const san of [...matingNetKg1BranchLine.slice(0,14),'Ng2','Kf1','Bc4+','Kg1','Kg3','Kh1','Nf4','Kg1','Nh3+','Kh1','Bd5#']){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   // This historical source now prefers the user's corrected Ne2 order.
   // Continue replaying the old legal route to retain its downstream coverage.
   if(before.split(' ').slice(0,4).join(' ')==='8/8/8/8/3N4/3K4/B7/5k2 w - -'){
    const corrected=getChess(fen).move({from:transformSquare('d4',transform),to:transformSquare('e2',transform)});
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[corrected.san]);
    assert.deepEqual(matingNetMoves(fen),[corrected.from+corrected.to]);
    continue;
   }
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/3B4/8/6KN/8/7k b - - 31 16');
 }
});


test('r1 selects the corrected Be6/Bf5/Be4/Ke3/Bd3 path across D4',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of matingNetCorrectedBishopLine){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
  }
  assert.equal(board.fen(),'8/8/8/8/8/3BK3/4N3/4k3 w - - 22 12');
  const corrected=transformFen('8/8/8/8/8/3K4/B3N1k1/8 w - - 12 7',transform);
  const oldMove=getChess(corrected).move({from:transformSquare('d3',transform),to:transformSquare('e3',transform)});
  assert.ok(!getIdealKnightAndBishopWhiteMoves(corrected).includes(oldMove.san));
 }
});


test('r1 selects loaded 5.Ke3 after Be6 Kh1 across D4 and ignores counters',()=>{
 const source='8/8/4B3/8/8/3K4/4N3/7k w - - 14 8';
 const target='8/8/4B3/8/8/4K3/4N3/7k b - - 15 8';
 for(const transform of SQUARE_TRANSFORMS){
  const fen=transformFen(source,transform),board=getChess(fen);
  const expected=board.move({from:transformSquare('d3',transform),to:transformSquare('e3',transform)});
  assert.equal(board.fen(),transformFen(target,transform));
  assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san]);
  assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
 }
 const replay=getChess(matingNetStart);
 for(const san of ['Nd4','Ke1','Kd3','Kf2','Ne2','Kg2','Be6','Kh1','Ke3']){
  if(replay.turn()==='w')assert.deepEqual(getIdealKnightAndBishopWhiteMoves(replay.fen()),[san]);
  replay.move(san);
 }
 assert.equal(replay.fen(),target);
});


test('r1 covers the loaded Be6 Kf1 Ke3 line through Nh3 across D4',()=>{
 const line=['Nd4','Ke1','Kd3','Kf2','Ne2','Kg2','Be6','Kf1','Ke3','Ke1','Bb3','Kf1','Nf4','Ke1','Ng2+','Kf1','Kf3','Kg1','Kg3','Kh1','Bc4','Kg1','Bd3','Kh1','Nf4','Kg1','Nh3+','Kh1'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(r3Tiebreak(fen,expected.san)),`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to),`${fen}: r1 must cover ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'0 1')),matingNetMoves(fen));
   if(san==='Ke3')assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[r3Tiebreak(fen,expected.san)]);
  }
  assert.equal(board.fen(),'8/8/8/8/8/3B2KN/8/7k w - - 34 18');
 }
});


test('r1 selects Kg3 after Nf4 Kh1 and the complete Be4 mate route across D4',()=>{
 const start='8/8/4B3/8/8/5K2/4N2k/8 w - - 0 1';
 const line=['Nf4','Kh1','Kg3','Kg1','Bc4','Kh1','Bd3','Kg1','Nh3+','Kh1','Be4#'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(start);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(r3Tiebreak(fen,expected.san)),`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to),`${fen}: r1 ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
   if(san==='Kg3')assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[r3Tiebreak(fen,expected.san)]);
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/4B3/6KN/8/7k b - - 11 6');
 }
});


test('r1 retains the historical Ng2 route after the superseded initial Be6',()=>{
 const start='8/8/8/8/2B2N2/5K2/7k/8 w - - 0 1';
 const line=['Be6','Kg1','Ng2','Kf1','Bc4+','Kg1','Kg3','Kh1','Nf4','Kg1','Nh3+','Kh1','Bd5#'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(start);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   // New Bd3 destination priority applies from Bc4 too, superseding Be6.
   if(before===start){
    const corrected=getChess(fen).move({from:transformSquare('c4',transform),to:transformSquare('d3',transform)});
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[corrected.san]);
    assert.deepEqual(matingNetMoves(fen),[corrected.from+corrected.to]);
    continue;
   }
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(expected.san),`${fen}: ${expected.san}`);
   assert.ok(matingNetMoves(fen).includes(expected.from+expected.to),`${fen}: r1 ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
   if(['Ng2','Bc4+','Kg3'].includes(san))assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san]);
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/3B4/8/6KN/8/7k b - - 13 7');
 }
});


test('r1 selects Kf3 with Bc2 Nf4 after Kg1 across D4',()=>{
 const start='8/8/8/8/8/4K3/2B1N3/5k2 w - - 0 1';
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(start);
  for(const san of ['Nf4','Kg1','Kf3']){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.equal(board.fen(),'8/8/8/8/5N2/5K2/2B5/6k1 b - - 3 2');
 }
});


test('r1 prefers the corrected Nd4 Ke1 Kd3 Kf1 Ne2 order across D4',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of ['Nd4','Ke1','Kd3','Kf1','Ne2']){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.equal(board.fen(),'8/8/8/8/8/3K4/B3N3/5k2 b - - 11 6');
 }
});


test('r1 selects the loaded Bd5 Ke3 Bd3 route across D4',()=>{
 const start='8/8/8/8/8/3K4/B3Nk2/8 w - - 12 7';
 const line=['Bd5','Ke1','Ke3','Kd1','Bb3+','Ke1','Bc2','Kf1','Nf4','Ke1','Ng2+','Kf1','Kf3','Kg1','Kg3','Kh1','Bd3','Kg1','Be2','Kh1','Nf4','Kg1','Nh3+','Kh1'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(start);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.equal(board.fen(),'8/8/8/8/8/6KN/4B3/7k w - - 36 19');
 }
});


test('r1 selects loaded Ke3 after Be4 Kf1 and the full Bf3 mate line across D4',()=>{
 const line=['Nd4','Ke1','Kd3','Kf2','Ne2','Kg2','Be6','Kf3','Bf5','Kf2','Be4','Kf1','Ke3','Ke1','Bc2','Kf1','Nf4','Kg1','Kf3','Kf1','Ng2','Kg1','Kg3','Kf1','Bd3+','Kg1','Be2','Kh1','Nf4','Kg1','Nh3+','Kh1','Bf3#'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/8/5BKN/8/7k b - - 39 20');
 }
});


test('r1 selects loaded Bd3 after Kf3 Kh2 through Be4 mate across D4',()=>{
 const line=['Nd4','Ke1','Kd3','Kf2','Ne2','Ke1','Ke3','Kd1','Bb3+','Ke1','Bc2','Kf1','Nf4','Kg1','Kf3','Kh2','Bd3','Kh1','Kg3','Kg1','Nh3+','Kh1','Be4#'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/4B3/6KN/8/7k b - - 29 15');
 }
});


test('r1 selects loaded Kg3 Bd3 after Kf3 Kh1 through Bf3 mate across D4',()=>{
 const line=['Nd4','Ke1','Kd3','Kf2','Ne2','Ke1','Ke3','Kd1','Bb3+','Ke1','Bc2','Kf1','Nf4','Kg1','Kf3','Kh1','Kg3','Kg1','Bd3','Kh1','Be2','Kg1','Nh3+','Kh1','Bf3#'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/8/5BKN/8/7k b - - 31 16');
 }
});


test('r1 selects loaded Bf5 Kf3 Nf4 Bd3 route through Be4 mate across D4',()=>{
 const start='8/8/4B3/8/8/4K3/4N1k1/8 w - - 0 1';
 const line=['Bf5','Kh2','Kf3','Kh1','Nf4','Kh2','Bd3','Kh1','Kg3','Kg1','Nh3+','Kh1','Be4#'];
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(start);
  for(const san of line){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.ok(board.isCheckmate());
  assert.equal(board.fen(),'8/8/8/8/4B3/6KN/8/7k b - - 13 7');
 }
});


test('r1 selects Bd5 instead of returning to Ba2 from the loaded loop across D4',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const board=getChess(matingNetStart);
  for(const san of ['Nd4','Ke1','Kd3','Kf2','Ne2','Kf3','Be6','Kf2','Bd5']){
   const before=board.fen(),move=board.move(san);if(move.color!=='w')continue;
   const fen=transformFen(before,transform);
   const expected=getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san],`${fen}: ${expected.san}`);
   assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
   assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  }
  assert.equal(board.fen(),'8/8/8/3B4/8/3K4/4Nk2/8 b - - 15 8');
 }
});

test('r1 selects Bc4 instead of Nd4 from its declared position, across D4 and counters',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/3B4/8/2K5/2N5/3k4 w - - 0 1',transform);
  const expected=getChess(fen).move({from:transformSquare('d5',transform),to:transformSquare('c4',transform)});
  const rejected=getChess(fen).move({from:transformSquare('c2',transform),to:transformSquare('d4',transform)});
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san]);
  assert.ok(!matingNetMoves(fen).includes(rejected.from+rejected.to));
  assert.deepEqual(matingNetMoves(fen),[expected.from+expected.to]);
  assert.deepEqual(matingNetMoves(fen.replace(/\d+ \d+$/,'87 50')),matingNetMoves(fen));
  const other=transformFen('8/8/8/8/2B5/N1K5/8/3k4 w - - 0 1',transform);
  const arrival=getChess(other).move({from:transformSquare('a3',transform),to:transformSquare('c2',transform)});
  assert.ok(matingNetMoves(other).includes(arrival.from+arrival.to));
 }
});
