import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {bishopKnightSetupReady,bishopKnightSetupMoves,loadBishopKnightSetup} from './bishopKnightSetup';
import {bishopKnightStageMoves} from './bishopKnightStages';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves as preferred} from './bishopKnight';
import {explainMove} from './selection';
import data from './bishopKnightSetupData.json';
const bytes=readFileSync(new URL('../../../public'+data.url,import.meta.url));
const copy=()=>Uint8Array.from(bytes).buffer;

test('loading is shared, verified, cached, and retryable after network or corrupt-data failures',async()=>{
 assert.equal(bishopKnightSetupReady(),false);
 await assert.rejects(loadBishopKnightSetup(async()=>new Response(null,{status:503})),/Could not load/);
 await assert.rejects(loadBishopKnightSetup(async()=>new Response(new ArrayBuffer(data.bytes))),/checksum/);
 let calls=0;let release!:()=>void;const waiting=new Promise<void>(resolve=>{release=resolve;});
 const fetcher:typeof fetch=async url=>{calls++;assert.equal(url,data.url);await waiting;return new Response(copy());};
 const first=loadBishopKnightSetup(fetcher),second=loadBishopKnightSetup(fetcher);assert.equal(first,second);
 assert.equal(bishopKnightSetupReady(),false);release();await first;assert.equal(calls,1);assert.equal(bishopKnightSetupReady(),true);
 await loadBishopKnightSetup(async()=>{throw new Error('Must not fetch twice');});
});

test('setup lookup declines goals, Black turns, and other material; ignores clocks',()=>{
 const source='N7/3B4/8/8/8/6k1/8/7K w - - 0 1';
 assert.ok(bishopKnightSetupMoves(source));
 assert.deepEqual(bishopKnightSetupMoves(source.replace('0 1','81 42')),bishopKnightSetupMoves(source));
 assert.equal(bishopKnightSetupMoves(source.replace(' w ',' b ')),undefined);
 assert.equal(bishopKnightSetupMoves('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1'),undefined);
 const b=getChess(source);b.put({type:'r',color:'w'},'b2');assert.equal(bishopKnightSetupMoves(b.fen()),undefined);
});

test('r3 moves are legal, symmetry-equivalent, preserve pieces, and reduce rank against every reply',()=>{
 for(const source of [
  'N7/3B4/8/8/8/6k1/8/7K w - - 0 1',
  '8/8/7N/8/8/8/8/K1kB4 w - - 0 1',
  '8/8/N7/8/8/8/B1k5/K7 w - - 0 1',
  '8/8/8/8/4k1N1/2K4B/8/8 w - - 4 3',
 ]){
  const expected=bishopKnightSetupMoves(source)!;assert.ok(expected);assert.ok(expected.distance<=12);
  for(const t of SQUARE_TRANSFORMS){
   const f=transformFen(source,t),lookup=bishopKnightSetupMoves(f)!;
   assert.equal(lookup.distance,expected.distance);
   assert.deepEqual([...lookup.moves].sort(),expected.moves.map(m=>transformSquare(m.slice(0,2) as 'a1',t)+transformSquare(m.slice(2) as 'a1',t)).sort());
   for(const uci of lookup.moves){
    const b=getChess(f);b.move({from:uci.slice(0,2),to:uci.slice(2)});const replies=b.moves({verbose:true});assert.ok(replies.length);
    for(const r of replies){assert.ok(!r.captured);const rank=bishopKnightSetupMoves(r.after)?.distance??0;assert.ok(rank<lookup.distance);}
   }
   if(bishopKnightStageMoves(f).stage===0){
    const moves=preferred(f);assert.ok(moves.length);
    for(const san of moves){const b=getChess(f);const m=b.move(san);assert.ok(b.isCheckmate()||lookup.moves.includes(m.from+m.to));}
   }
  }
 }
});

test('r3 respects the framework priority and is attributed without bypassing selection',()=>{
 assert.deepEqual(bishopKnightRuleSet.whiteRules.map(r=>r.id),['mate','minors safe','no stalemate','r1','r2','r3']);
 assert.doesNotMatch(JSON.stringify(bishopKnightRuleSet.help), /\br[4-9](?:\.|\b)/);
 const source='N7/3B4/8/8/8/6k1/8/7K w - - 0 1';
 const scores=bishopKnightRuleSet.scoreWhiteCandidates!(source,getChess(source).moves());
 for(const san of preferred(source))assert.equal(explainMove(scores,bishopKnightRuleSet.whiteRules,san)?.id,'r3');
});
