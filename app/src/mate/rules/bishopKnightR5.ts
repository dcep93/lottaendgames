import {findPiece, getEndgamePiecePlacements, squareCoords, squareFromCoords} from '../chess';

/** Hop across the king when Black obstructs its inward step beside the knight. */
export function knightAndBishopR5Move(fen: string): string | undefined {
  const king=findPiece(fen,'w','k'), knight=findPiece(fen,'w','n'), black=findPiece(fen,'b','k');
  if(!king || !knight || !black)return undefined;
  const w=squareCoords(king.square), n=squareCoords(knight.square), b=squareCoords(black.square);
  const dx=n.file-w.file, dy=n.rank-w.rank;
  if(Math.abs(dx)!==1 || Math.abs(dy)!==1)return undefined;
  if(Math.abs(b.file-n.file)+Math.abs(b.rank-n.rank)!==1)return undefined;
  if((b.file-w.file)**2+(b.rank-w.rank)**2!==5)return undefined;
  const center=(p:{file:number;rank:number})=>(p.file-3.5)**2+(p.rank-3.5)**2;
  if(center(b)>=center(w))return undefined;
  const target=b.file===n.file
    ? squareFromCoords(w.file-dx,w.rank)
    : squareFromCoords(w.file,w.rank-dy);
  if(!target || getEndgamePiecePlacements(fen).some(p=>p.square===target))return undefined;
  return knight.square+target;
}
