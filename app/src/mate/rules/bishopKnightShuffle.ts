import type {Square} from 'chess.js';
import {findPiece, squareCoords, squareFromCoords} from '../chess';
import {getSquareInFrontOfWhiteKingBetweenKings} from './bishopKnightGeometry';
import {knightAndBishopCenterProximityScore as centralDistance} from './bishopKnightStrategy';

/** Freeze the most central squares in Black's local shuffle behind the interposed knight. */
export function knightAndBishopShuffleTargets(fen:string): readonly Square[] {
  const white=findPiece(fen,'w','k'),black=findPiece(fen,'b','k'),knight=findPiece(fen,'w','n');
  if(!white||!black||!knight)return [];
  const w=squareCoords(white.square),b=squareCoords(black.square);
  const matches=(square:Square)=>{
    const p=squareCoords(square),dx=Math.abs(p.file-w.file),dy=Math.abs(p.rank-w.rank);
    return ((dx===0&&dy===2)||(dy===0&&dx===2)||dx*dy===2)
      && getSquareInFrontOfWhiteKingBetweenKings(white.square,square)===knight.square;
  };
  if(!matches(black.square)||centralDistance(black.square)>=centralDistance(white.square))return [];
  const squares:Square[]=[];
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
    const square=squareFromCoords(b.file+dx,b.rank+dy);
    if(square&&matches(square))squares.push(square);
  }
  const best=Math.min(...squares.map(centralDistance));
  return squares.filter(square=>centralDistance(square)===best);
}
