import {findPiece, getEndgamePiecePlacements, squareCoords, squareFromCoords} from '../chess';

const center=(p:{file:number;rank:number})=>(p.file-3.5)**2+(p.rank-3.5)**2;

/** Check to break inward opposition, then advance beside the knight or wait with the bishop. */
export function knightAndBishopR5OppositionMoves(fen:string): readonly string[] | undefined {
  const king=findPiece(fen,'w','k'),knight=findPiece(fen,'w','n'),black=findPiece(fen,'b','k'),bishop=findPiece(fen,'w','b');
  if(!king||!knight||!black)return undefined;
  const w=squareCoords(king.square),n=squareCoords(knight.square),b=squareCoords(black.square);
  const occupied=new Set(getEndgamePiecePlacements(fen).map(p=>p.square));
  const bx=b.file-w.file,by=b.rank-w.rank;
  if((bx===0&&Math.abs(by)===2)||(by===0&&Math.abs(bx)===2)){
    const inward={file:w.file+Math.sign(bx),rank:w.rank+Math.sign(by)};
    // An inward knight already gives the king a useful side to slide behind.
    const canSlideBehindKnight=center(n)<center(w) && [
      {file:n.file,rank:w.rank}, {file:w.file,rank:n.rank},
    ].some(p=>{
      const to=squareFromCoords(p.file,p.rank);
      return to && !occupied.has(to) && center(p)<center(w)
        && Math.max(Math.abs(p.file-w.file),Math.abs(p.rank-w.rank))===1
        && Math.max(Math.abs(p.file-n.file),Math.abs(p.rank-n.rank))===1
        && Math.max(Math.abs(p.file-b.file),Math.abs(p.rank-b.rank))>1;
    });
    if(center(inward)<center(w) && !canSlideBehindKnight){
      const checks:string[]=[];
      for(const [dx,dy] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]){
        const x=n.file+dx!,y=n.rank+dy!,to=squareFromCoords(x,y);
        if(to&&!occupied.has(to)&&Math.abs(x-w.file)+Math.abs(y-w.rank)===1
          &&Math.abs(x-b.file)*Math.abs(y-b.rank)===2)checks.push(knight.square+to);
      }
      if(checks.length)return checks;
    }
  }
  const dx=n.file-w.file,dy=n.rank-w.rank;
  if(Math.abs(dx)+Math.abs(dy)!==1)return undefined;
  const knightBehind=center(n)>center(w);
  for(const side of [-1,1]){
    const fx=dy*side,fy=dx*side;
    const forward=bx*fx+by*fy,lateral=bx*dx+by*dy;
    if(forward<2||forward>3||Math.abs(lateral)>(knightBehind?2:1))continue;
    // With the knight behind, advance from the king while retaining its defense.
    const origin=knightBehind?w:n;
    const next={file:origin.file+fx,rank:origin.rank+fy},to=squareFromCoords(next.file,next.rank);
    if(!to||occupied.has(to)||center(next)>=center(w))continue;
    const c=bishop && squareCoords(bishop.square);
    // If advancing leaves the bishop hanging, save it with the waiting move first.
    const bishopHanging=c && Math.max(Math.abs(c.file-b.file),Math.abs(c.rank-b.rank))===1
      && Math.max(Math.abs(c.file-next.file),Math.abs(c.rank-next.rank))>1
      && Math.abs(c.file-n.file)*Math.abs(c.rank-n.rank)!==2;
    if(Math.max(Math.abs(next.file-b.file),Math.abs(next.rank-b.rank))>1 && !bishopHanging)return [king.square+to];
    return ['b']; // Allow bishop waits; r5 scoring prefers the farthest from Black.
  }
  return undefined;
}
