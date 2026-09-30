import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {compareScoresByRules} from './selection';

const r4=knightAndBishopWhiteRules.find(rule=>rule.id==='r4')!;

test('r4 enforces Bc6 from Kc4 Be4 Nd4 against Ke5 over older destinations, across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('8/8/8/4k3/2KNB3/8/8/8 w - - 2 2', t);
  const san = (to: 'c6' | 'f5' | 'c2') => getChess(fen).move({from: transformSquare('e4', t), to: transformSquare(to, t)}).san;
  const preferred = scoreKnightAndBishopWhiteMove(fen, san('c6'));
  for (const to of ['f5', 'c2'] as const) {
   assert.ok(compareScoresByRules(preferred, scoreKnightAndBishopWhiteMove(fen, san(to)), [r4]) < 0);
  }
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('c6')]);
 }
});

test('r4 completes the king navigation goal before partial bishop progress, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/3K4/1k1N4/8/4B3/8 w - - 0 1',t);
  const san=(from:'d5'|'e2',to:'e5'|'d3'|'c4')=>getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const kingMove=san('d5','e5');
  const complete=scoreKnightAndBishopWhiteMove(fen,kingMove);
  for(const to of ['d3','c4'] as const){
   const partial=scoreKnightAndBishopWhiteMove(fen,san('e2',to));
   assert.ok(compareScoresByRules(complete,partial,[r4])<0,t.name);
  }
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[kingMove],t.name);
 }
});

test('r4 completes the king destination before the bishop destination, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/4k3/8/3K1B2/3N4/8/8/8 w - - 0 1',t);
  const king=getChess(fen).move({from:transformSquare('d5',t),to:transformSquare('e5',t)}).san;
  const bishop=getChess(fen).move({from:transformSquare('f5',t),to:transformSquare('e4',t)}).san;
  assert.ok(compareScoresByRules(scoreKnightAndBishopWhiteMove(fen,king),scoreKnightAndBishopWhiteMove(fen,bishop),[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[king],t.name);
  const board=getChess(fen);
  board.move(king);
  board.move({from:transformSquare('e7',t),to:transformSquare('d8',t)});
  const next=board.fen();
  const centralize=board.move({from:transformSquare('f5',t),to:transformSquare('e4',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(next),[centralize],t.name);
 }
});

test('r4 requires central king placement before routing an uncentralized knight, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS)for(const [start,enabled] of [
  ['B7/8/8/k7/3K4/5N2/8/8 w - - 0 1',true],
  ['B7/8/8/k7/5K2/5N2/8/8 w - - 0 1',false], // Kf4 must centralize before routing Nf3.
  ['B7/8/8/k7/6K1/5N2/8/8 w - - 0 1',false],
  ['B7/8/8/k7/3K4/8/5N2/8 w - - 0 1',false],
  ['B7/8/k7/8/3K4/5N2/8/8 w - - 0 1',true], // Bishop proximity does not gate r4.
 ] as const){
  const fen=transformFen(start,t);
  for(const san of getChess(fen).moves()){
   const score=scoreKnightAndBishopWhiteMove(fen,san);
   assert.equal(r4.applies!(score),score.stage===0 && enabled,`${t.name} ${san}`);
  }
 }
});

test('r4 reaches a protected opposite-color center, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/8/k7/3K4/5N2/8/8 w - - 0 1',t);
  const san=(from:'f3'|'d4',to:'e5'|'h2'|'e4'|'c4')=>getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const target=scoreKnightAndBishopWhiteMove(fen,san('f3','e5'));
  const away=scoreKnightAndBishopWhiteMove(fen,san('f3','h2'));
  const protectedKnight=scoreKnightAndBishopWhiteMove(fen,san('d4','e4'));
  const exposed=scoreKnightAndBishopWhiteMove(fen,san('d4','c4'));
  assert.equal(target.knightOppositeCentralDistance,0,t.name);
  assert.ok(away.knightOppositeCentralDistance>0,t.name);
  assert.equal(protectedKnight.knightOppositeCentralDistance,exposed.knightOppositeCentralDistance,t.name);
  assert.equal(protectedKnight.kingKnightAdjacencyPenalty,0,t.name);
  assert.equal(exposed.kingKnightAdjacencyPenalty,1,t.name);
  assert.ok(compareScoresByRules(target,protectedKnight,[r4])<0,t.name);
  assert.ok(compareScoresByRules(protectedKnight,exposed,[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('f3','e5')],t.name);
 }
});

test('r4 prefers bishop central proximity after knight placement and protection, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/8/k3N3/3K4/8/8/8 w - - 0 1',t);
  const san=(to:'c6'|'b7'|'d5'|'e4')=>getChess(fen).move({from:transformSquare('a8',t),to:transformSquare(to,t)}).san;
  const center=scoreKnightAndBishopWhiteMove(fen,san('d5'));
  const nearby=scoreKnightAndBishopWhiteMove(fen,san('c6'));
  const distant=scoreKnightAndBishopWhiteMove(fen,san('b7'));
  assert.equal(center.knightOppositeCentralDistance,nearby.knightOppositeCentralDistance,t.name);
  assert.equal(center.kingKnightAdjacencyPenalty,nearby.kingKnightAdjacencyPenalty,t.name);
  assert.ok(center.bishopCentralProximityScore<nearby.bishopCentralProximityScore,t.name);
  assert.ok(nearby.bishopCentralProximityScore<distant.bishopCentralProximityScore,t.name);
  assert.ok(compareScoresByRules(center,nearby,[r4])<0,t.name);
  assert.ok(compareScoresByRules(nearby,distant,[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('e4')],t.name);
 }
});

test('r4 stays inactive throughout the reported Kc6 boundary shuffle, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/2K5/1N6/8/8/k7/8 w - - 0 1',t);
  const ch=getChess(fen);
  ch.move({from:transformSquare('b5',t),to:transformSquare('d6',t)});
  ch.move({from:transformSquare('a2',t),to:transformSquare('b1',t)});
  for(const position of [fen,ch.fen()])for(const move of getChess(position).moves()){
   assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(position,move)),false,`${t.name} ${move}`);
  }
 }
});

test('r4 centralizes the bishop in the supplied Ba2 position, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/4N3/3K1k2/8/B7/8 w - - 22 12',t);
  const move=getChess(fen).move({from:transformSquare('a2',t),to:transformSquare('d5',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
 }
});

test('r4 stays active with the supplied bishop two steps from Black, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('2k5/8/2B5/3N4/4K3/8/8/8 w - - 2 2',t);
  for(const move of getChess(fen).moves())assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(fen,move)),true,`${t.name} ${move}`);
 }
});

test('r4 targets e5 rather than the occupied d4 square, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('2k1B3/8/8/8/3K4/2N5/8/8 w - - 2 2',t);
  const san=(to:'b5'|'e2'|'d5'|'e4')=>getChess(fen).move({from:transformSquare('c3',t),to:transformSquare(to,t)}).san;
  for(const to of ['b5','e2','d5','e4'] as const)assert.equal(scoreKnightAndBishopWhiteMove(fen,san(to)).knightOppositeCentralDistance,3,`${t.name} ${to}`);
  assert.deepEqual([...getIdealKnightAndBishopWhiteMoves(fen)].sort(),[san('d5'),san('e4')].sort(),t.name);
 }
});

test('r4 maneuvers the knight in the supplied Bc6 position, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('Bk6/8/8/3N4/4K3/8/8/8 w - - 0 1',t);
  const ch=getChess(fen);
  const move=ch.move({from:transformSquare('a8',t),to:transformSquare('c6',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
  ch.move({from:transformSquare('b8',t),to:transformSquare('c8',t)});
  const next=ch.fen();
  const expected=['f4','e3'].map(to=>getChess(next).move({from:transformSquare('d5',t),to:transformSquare(to as 'f4'|'e3',t)}).san);
  assert.deepEqual([...getIdealKnightAndBishopWhiteMoves(next)].sort(),expected.sort(),t.name);
 }
});

test('r4 puts king protection before a shorter knight route, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B6k/8/8/2N5/3K4/8/8/8 w - - 0 1',t);
  const score=(to:'e4'|'d7')=>scoreKnightAndBishopWhiteMove(fen,getChess(fen).move({from:transformSquare('c5',t),to:transformSquare(to,t)}).san);
  const protectedMove=score('e4'),shorterRoute=score('d7');
  assert.equal(protectedMove.kingKnightAdjacencyPenalty,0,t.name);
  assert.equal(shorterRoute.kingKnightAdjacencyPenalty,1,t.name);
  assert.ok(protectedMove.knightOppositeCentralDistance>shorterRoute.knightOppositeCentralDistance,t.name);
  assert.ok(compareScoresByRules(protectedMove,shorterRoute,[r4])<0,t.name);
 }
});

test('r4 finishes king navigation before bishop progress, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/5k2/8/8/3NK3/8/8/8 w - - 0 1',t);
  const san=(from:'e4'|'a8',to:'e5'|'c6'|'d5')=>getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const king=san('e4','e5'),bishop=san('a8','c6');
  assert.ok(compareScoresByRules(scoreKnightAndBishopWhiteMove(fen,king),scoreKnightAndBishopWhiteMove(fen,bishop),[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[king],t.name);
 }
});


test('r4 targets an unoccupied opposite-color central king square rather than leaving the center, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/5k2/8/3B4/3NK3/8/8/8 w - - 0 1',t);
  const score=(to:'e5'|'e3')=>scoreKnightAndBishopWhiteMove(fen,getChess(fen).move({from:transformSquare('e4',t),to:transformSquare(to,t)}).san);
  assert.equal(score('e5').bishopKingCentralNavigationScore,0,t.name);
  // d4 is occupied by the knight, so Ke3 is measured toward e5.
  assert.equal(score('e3').bishopKingCentralNavigationScore,4,t.name);
  assert.ok(compareScoresByRules(score('e5'),score('e3'),[r4])<0,t.name);
 }
});

test('r4 preserves the central king and middle-16 knight before maneuvering, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/4K3/8/k2N4/B7/8 w - - 2 2', t);
    const san = (from: 'a2' | 'd3' | 'e5', to: 'g8' | 'd5' | 'c4' | 'c1' | 'e6') => getChess(fen).move({
      from: transformSquare(from, t), to: transformSquare(to, t),
    }).san;
    const retained = scoreKnightAndBishopWhiteMove(fen, san('a2', 'g8'));
    for (const move of [san('d3', 'c1'), san('e5', 'e6')]) {
      const leaving = scoreKnightAndBishopWhiteMove(fen, move);
      assert.equal(leaving.centralSetupBoundaryPenalty, 1, `${t.name} ${move}`);
      assert.ok(compareScoresByRules(retained, leaving, [r4]) < 0, `${t.name} ${move}`);
    }
    assert.equal(retained.centralSetupBoundaryPenalty, 0, t.name);
    const centralized = scoreKnightAndBishopWhiteMove(fen, san('a2', 'd5'));
    assert.equal(compareScoresByRules(retained, centralized, [r4]), 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('a2', 'c4')], t.name);
  }
});

test('r4 selects the two declared navigation steps from the loaded line, across D4', () => {
  const line = getChess('8/8/3k4/8/2KN4/8/8/7B w - - 0 1');
  const first = line.fen();
  for (const san of ['Bd5', 'Ke5', 'Kc5', 'Kf4']) line.move(san);
  for (const [fen, from, to] of [[first, 'h1', 'd5'], [line.fen(), 'c5', 'd6']] as const) {
    for (const transform of SQUARE_TRANSFORMS) {
      const position = transformFen(fen, transform);
      const move = getChess(position).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      const score = scoreKnightAndBishopWhiteMove(position, move);
      assert.equal(score.startsWithCentralKingAndMiddle16Knight, false);
      assert.equal(score.declaredCentralNavigationPenalty, 0);
      assert.equal(r4.applies!(score), true);
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(position), [move], transform.name);
    }
  }
});

test('r4 selects the declared Kd3, Kc4, and Ke5 steps from the loaded line, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/8/3k1B2/3N4/4K3/8/8 w - - 0 1', t));
    const line = [
      ['e3', 'd3'], ['d5', 'e5'],
      ['d3', 'c4'], ['e5', 'f4'],
      ['c4', 'd5'], ['f4', 'e3'],
      ['d5', 'e5'],
    ] as const;
    for (const [i, [from, to]] of line.entries()) {
      const fen = board.fen();
      const san = board.move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
      if (![0, 2, 6].includes(i)) continue;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).declaredCentralNavigationPenalty, 0, `${t.name} ${san}`);
      assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(san), `${t.name} ${san}`);
    }
  }
});

test('r4 selects the declared Bc2 and Kc4 destinations from the loaded line, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/8/3k4/3N4/2KB4/8/8 w - - 0 1', t));
    const line = [['d3', 'c2'], ['d5', 'e5'], ['c3', 'c4']] as const;
    for (const [i, [from, to]] of line.entries()) {
      const fen = board.fen();
      const san = board.move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
      if (i === 1) continue;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).declaredCentralNavigationPenalty, 0, `${t.name} ${san}`);
      assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(san), `${t.name} ${san}`);
    }
  }
});

test('r4 selects the declared Bc6 destination from the loaded position, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/8/2kNB3/4K3/8/8 w - - 0 1', t);
    const san = getChess(fen).move({from: transformSquare('e4', t), to: transformSquare('c6', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).declaredCentralNavigationPenalty, 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], t.name);
  }
});

test('r4 chooses Bc6 with Black on e5 and keeps the declaration bishop-only, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/4k3/3NB3/4K3/8/8 w - - 0 1', t);
    const san = getChess(fen).move({from: transformSquare('e4', t), to: transformSquare('c6', t)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], t.name);
    const retreatFen = transformFen('8/8/2B5/4k3/3N4/5K2/8/8 w - - 0 1', t);
    const retreat = getChess(retreatFen).move({from: transformSquare('f3', t), to: transformSquare('e3', t)}).san;
    assert.notEqual(scoreKnightAndBishopWhiteMove(retreatFen, retreat).declaredCentralNavigationPenalty, 0, t.name);
  }
});

test('r4 chooses Bc6 with Black on c5, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/2k5/3NB3/4K3/8/8 w - - 0 1', t);
    const san = getChess(fen).move({from: transformSquare('e4', t), to: transformSquare('c6', t)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], t.name);
  }
});

test('r4 selects the declared Bb3 destination from the loaded position, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3k4/3B4/3NK3/8/8/8 w - - 0 1', t);
    const san = getChess(fen).move({from: transformSquare('d5', t), to: transformSquare('b3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).declaredCentralNavigationPenalty, 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], t.name);
  }
});

test('declared destination matching stays exact when general navigation applies', () => {
  const fen = '8/8/1k6/8/2KN4/8/8/7B w - - 0 1';
  for (const san of getChess(fen).moves()) {
    const score = scoreKnightAndBishopWhiteMove(fen, san);
    assert.equal(score.declaredCentralNavigationPenalty, undefined);
    assert.equal(score.startsWithProtectedOppositeCentralKnight, true);
  }
});

test('r4 recognizes declared destination diagrams from every legal White source, across D4', () => {
  const destinations = [
    '8/8/3k4/3B4/2KN4/8/8/8 b - - 1 1',
    '8/8/3K4/3B4/3N1k2/8/8/8 b - - 5 3',
    '8/8/8/3k1B2/3N4/3K4/8/8 b - - 1 1',
    '8/8/8/4kB2/2KN4/8/8/8 b - - 3 2',
    '8/8/8/4KB2/3N4/4k3/8/8 b - - 7 4',
    '8/8/8/3k4/3N4/2K5/2B5/8 b - - 1 1',
    '8/8/8/4k3/2KN4/8/2B5/8 b - - 3 2',
    '8/8/2B5/8/2kN4/4K3/8/8 b - - 1 1',
    '8/8/2B5/4k3/3N4/4K3/8/8 b - - 1 1',
    '8/8/2B5/2k5/3N4/4K3/8/8 b - - 1 1',
    '8/8/3k4/8/3NK3/1B6/8/8 b - - 1 1',
  ];
  let incoming = 0;
  for (const destination of destinations) {
    const result = getChess(destination);
    for (const piece of result.board().flat().filter(piece => piece?.color === 'w')) {
      if (!piece) continue;
      // The Bc6 declarations apply only to bishop arrivals.
      if (result.get('c6')?.type === 'b' && piece.type !== 'b') continue;
      // The Ke5 declaration must not reward a bishop retreat into its diagram.
      if (result.get('e5')?.type === 'k' && result.get('e3')?.color === 'b' && piece.type !== 'k') continue;
      for (let file = 0; file < 8; file++) for (let rank = 1; rank <= 8; rank++) {
        const source = `${'abcdefgh'[file]}${rank}` as import('chess.js').Square;
        if (result.get(source)) continue;
        const before = getChess(destination.replace(' b ', ' w '));
        before.remove(piece.square);
        before.put({type: piece.type, color: 'w'}, source);
        // A legal White-to-move predecessor cannot already check Black.
        if (getChess(before.fen().replace(' w ', ' b ')).isCheck()) continue;
        const move = before.moves({verbose: true}).find(move => move.from === source && move.to === piece.square);
        if (!move) continue;
        incoming++;
        for (const transform of SQUARE_TRANSFORMS) {
          const fen = transformFen(before.fen(), transform);
          const san: string = getChess(fen).move({from: transformSquare(source, transform), to: transformSquare(piece.square, transform)}).san;
          // The newer exact Bc6 instruction supersedes these older destinations.
          const superseded = before.fen().split(' ')[0] === '8/8/8/4k3/2KNB3/8/8/8';
          assert.equal(scoreKnightAndBishopWhiteMove(fen, san).declaredCentralNavigationPenalty, superseded ? 1 : 0);
          const preferred = getIdealKnightAndBishopWhiteMoves(fen);
          // Two declared destinations can be reachable from the same source;
          // later r4 criteria still break that tie.
          assert.ok(preferred.includes(san) || (preferred.length > 0 && preferred.every(candidate =>
            scoreKnightAndBishopWhiteMove(fen, candidate).declaredCentralNavigationPenalty === 0)), `${fen}: ${san}`);
        }
      }
    }
  }
  assert.ok(incoming > 20);
});

test('r4 waits for a central-four king before the protected knight maneuver, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/8/2k1N3/4K3/8/7B w - - 0 1', transform);
    const move = getChess(fen).move({from: transformSquare('e4', transform), to: transformSquare('d2', transform)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).protectedCentralManeuverPenalty, undefined);
  }
});

test('r4 continues to bishop navigation with the protected central knight and Kc4, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3k4/8/2KN4/8/8/1B6 w - - 0 1', transform);
    const move = getChess(fen).move({from: transformSquare('b1', transform), to: transformSquare('e4', transform)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.startsWithCentralKingAndMiddle16Knight, false);
    assert.equal(score.protectedCentralManeuverPenalty, undefined);
    assert.equal(score.startsWithProtectedOppositeCentralKnight, true);
    assert.equal(r4.applies!(score), true);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move], transform.name);
  }
});


test('r4 waits for the protected opposite-color central knight before bishop navigation, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  for(const start of [
   '6B1/8/3k4/8/8/4K3/5N2/8 w - - 2 2',
   '6B1/8/3k4/8/3K4/2N5/8/8 w - - 0 1',
  ]){
   const fen=transformFen(start,t);
   for(const move of getChess(fen).moves()){
    const score=scoreKnightAndBishopWhiteMove(fen,move);
    assert.equal(score.startsWithProtectedOppositeCentralKnight,false,t.name);
    assert.equal(score.bishopKingCentralCompletionPenalty,0,`${t.name} ${move}`);
    assert.equal(score.bishopKingCentralNavigationScore,0,`${t.name} ${move}`);
   }
  }
  const fen=transformFen('6B1/8/3k4/8/8/4K3/5N2/8 w - - 2 2',t);
  for (const move of getChess(fen).moves())
    assert.equal(scoreKnightAndBishopWhiteMove(fen,move).protectedCentralManeuverPenalty,undefined,t.name);
 }
});

test('Bc6 declaration does not pull the king back to e3 instead of Ke5, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/2B5/8/2kNK3/8/8/8 w - - 2 2', t);
    const san = getChess(fen).move({from: transformSquare('e4', t), to: transformSquare('e5', t)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], t.name);
  }
});

test('Ke5 declaration does not pull the bishop out of the center: Bd5 over Bd3, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/4N3/3KBk2/8/8/8 w - - 2 2', t);
    const bishopMove = (to: 'd5' | 'd3') => getChess(fen).move({
      from: transformSquare('e4', t), to: transformSquare(to, t),
    }).san;
    const central = bishopMove('d5'), retreat = bishopMove('d3');
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [central], t.name);
    assert.ok(r4.compare!(scoreKnightAndBishopWhiteMove(fen, central), scoreKnightAndBishopWhiteMove(fen, retreat)) < 0);
  }
});
