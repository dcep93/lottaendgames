import {findPiece, getEndgamePiecePlacements, squareCoords, squareFromCoords} from '../chess';

const center=(p:{file:number;rank:number})=>(p.file-3.5)**2+(p.rank-3.5)**2;

/** Hop across the king, or advance the king before Black can force the reverse hop. */
export function knightAndBishopR5Move(fen: string): string | undefined {
  const king=findPiece(fen,'w','k'), knight=findPiece(fen,'w','n'), black=findPiece(fen,'b','k');
  if(!king || !knight || !black)return undefined;
  const w=squareCoords(king.square), n=squareCoords(knight.square), b=squareCoords(black.square);
  const dx=n.file-w.file, dy=n.rank-w.rank;
  if(Math.abs(dx)+Math.abs(dy)===1){
    // Reverse the hop: the knight starts where r5 would send it back.
    for(const side of [-1,1]){
      const forward={file:dy*side,rank:dx*side};
      const nextN={file:w.file-dx+forward.file,rank:w.rank-dy+forward.rank};
      const nextB={file:nextN.file+forward.file,rank:nextN.rank+forward.rank};
      const nextKnight=squareFromCoords(nextN.file,nextN.rank);
      const nextBlack=squareFromCoords(nextB.file,nextB.rank);
      const target=squareFromCoords(w.file+forward.file,w.rank+forward.rank);
      const pieces=getEndgamePiecePlacements(fen);
      if(!nextKnight || !nextBlack || !target)continue;
      if(Math.max(Math.abs(b.file-nextB.file),Math.abs(b.rank-nextB.rank))!==1)continue;
      if(center(nextB)>=center(w))continue;
      if(pieces.some(p=>[nextKnight,nextBlack,target].includes(p.square)))continue;
      if(Math.max(Math.abs(b.file-w.file-forward.file),Math.abs(b.rank-w.rank-forward.rank))<=1)continue;
      const bishop=findPiece(fen,'w','b');
      if(bishop){
        const c=squareCoords(bishop.square),fx=nextB.file-c.file,fy=nextB.rank-c.rank;
        if(Math.abs(fx)===Math.abs(fy)){
          const between=(p:{file:number;rank:number})=>
            (p.file-c.file)*Math.sign(fx)>0 && (p.file-c.file)*Math.sign(fx)<Math.abs(fx) &&
            (p.file-c.file)*Math.sign(fx)===(p.rank-c.rank)*Math.sign(fy);
          if(!between(w)&&!between(nextN))continue;
        }
      }
      return king.square+target;
    }
    return undefined;
  }
  if(Math.abs(dx)!==1 || Math.abs(dy)!==1)return undefined;
  if(Math.abs(b.file-n.file)+Math.abs(b.rank-n.rank)!==1)return undefined;
  if((b.file-w.file)**2+(b.rank-w.rank)**2!==5)return undefined;
  if(center(b)>=center(w))return undefined;
  const target=b.file===n.file
    ? squareFromCoords(w.file-dx,w.rank)
    : squareFromCoords(w.file,w.rank-dy);
  if(!target || getEndgamePiecePlacements(fen).some(p=>p.square===target))return undefined;
  return knight.square+target;
}
