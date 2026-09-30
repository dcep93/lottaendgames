/** Test-only replay of the pre-stage declaration policy. Never imported by the app. */
import {getChess,findPiece,squaredEuclideanDistance} from '../../app/src/mate/chess';
import {bishopKnightRuleSet as currentRuleSet,scoreKnightAndBishopWhiteMove as currentScore} from '../../app/src/mate/rules/bishopKnight';
import {matingNetMoves} from '../../app/src/mate/rules/bishopKnightMatingNet';
import {sevenCageMoves} from '../../app/src/mate/rules/bishopKnightSevenCage';
import {isBoardEdge} from '../../app/src/mate/rules/bishopKnightGeometry';
import {selectIdealMoves} from '../../app/src/mate/rules/selection';
import type {OrderedRule} from '../../app/src/mate/rules/types';

function historicalScore(fen:string,san:string,base:ReturnType<typeof currentScore>,net:readonly string[],cage:readonly string[]){
 const board=getChess(fen),move=board.move(san);
 const black=findPiece(board.fen(),'b','k')!.square;
 const distance=(piece:'k'|'b'|'n')=>{const p=findPiece(board.fen(),'w',piece);return p?squaredEuclideanDistance(p.square,black):99;};
 const historical={stage:0 as const,
  matingNetPenalty:net.length&&!net.includes(move.from+move.to)?1:0,
  sevenCagePenalty:cage.length&&!cage.includes(move.from+move.to)?1:0,
  kingEdgePenalty:Number(move.piece==='k'&&isBoardEdge(move.to)),
  kingBlackDistanceSquared:distance('k'),bishopBlackDistanceSquared:distance('b'),knightBlackDistanceSquared:distance('n')};
 return Object.defineProperties(Object.create(Object.getPrototypeOf(base),Object.getOwnPropertyDescriptors(base)),Object.getOwnPropertyDescriptors(historical)) as typeof base & typeof historical;
}
export function scoreKnightAndBishopWhiteMove(fen:string,san:string){return historicalScore(fen,san,currentScore(fen,san),matingNetMoves(fen),sevenCageMoves(fen));}
type Score=ReturnType<typeof scoreKnightAndBishopWhiteMove>;
const rules:OrderedRule<Score>[]=currentRuleSet.whiteRules.map(rule=>rule.id==='r2'?{...rule,compare:(a:Score,b:Score)=>a.sevenCagePenalty-b.sevenCagePenalty||a.kingEdgePenalty-b.kingEdgePenalty}:rule);
rules.splice(5,0,{id:'r3',shortLabel:'rule r3',helpText:'Historical proximity tie-break',compare:(a,b)=>a.kingBlackDistanceSquared-b.kingBlackDistanceSquared||a.bishopBlackDistanceSquared-b.bishopBlackDistanceSquared||a.knightBlackDistanceSquared-b.knightBlackDistanceSquared});
export const knightAndBishopWhiteRules=rules;
const scoreWhiteCandidates=(fen:string,moves:readonly string[])=>{
 const net=matingNetMoves(fen),cage=sevenCageMoves(fen);
 return currentRuleSet.scoreWhiteCandidates!(fen,moves).map(({san,score})=>({san,score:historicalScore(fen,san,score,net,cage)}));
};
export const bishopKnightRuleSet={...currentRuleSet,whiteRules:rules,scoreWhite:scoreKnightAndBishopWhiteMove,scoreWhiteCandidates};
export function getIdealKnightAndBishopWhiteMoves(fen:string){return [...selectIdealMoves(scoreWhiteCandidates(fen,getChess(fen).moves()),rules)];}
