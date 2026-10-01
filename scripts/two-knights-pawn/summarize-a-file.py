import re,json,urllib.parse,hashlib
from pathlib import Path
import chess
root=Path(__file__).parent;text=(root/'work/a-file-results.txt').read_text();rows=[];entry=None
for line in text.splitlines():
 if 'START ' in line:
  m=re.search(r'START (\d+) (\d+) (\d+) (\d+) (\d+) setup=(\d+)',line);p,w,a,n,k,setup=map(int,m.groups());b=chess.Board(None)
  for sq,pc in [(p,'p'),(w,'K'),(a,'N'),(n,'N'),(k,'k')]:b.set_piece_at(sq,chess.Piece.from_symbol(pc))
  entry={'fen':b.fen(),'certified':setup!=65535};rows.append(entry)
  if setup!=65535:
   m=re.search(r'mate=(\d+) quiet=(\d+) later=(\d+)',line);mate,quiet,later=map(int,m.groups());entry.update(setupWhiteMoves=setup,worstCaseMateWhiteMoves=mate,maxInitialQuietPlies=quiet,maxLaterQuietPlies=later)
 elif line.startswith('LINE'):
  moves=[];phases=[];transitions=[]
  for token in line.split()[1:]:
   code,phase=map(int,token.split(':'));m=chess.Move(code//64,code%64);assert m in b.legal_moves
   if not phases or phases[-1]!=phase:transitions.append({'ply':len(moves),'phase':phase,'fen':b.fen()})
   phases.append(phase);moves.append(b.san(m));b.push(m)
  assert b.is_checkmate();entry.update(moves=moves,phases=phases,transitions=transitions)
  entry['url']='http://localhost:5173/mate/two-knights-pawn#fen='+entry['fen'].replace(' ','_')+'&moves='+','.join(urllib.parse.quote(s,safe='') for s in moves)+'&cursor=0'
  print(entry['fen'],entry['worstCaseMateWhiteMoves'],' '.join(moves));print('TRANSITIONS',transitions)
audit = re.search(r'AUDIT white=(\d+) clock_failures=(\d+) max_mate=(\d+) memo=(\d+)', text)
white, failures, longest, states = map(int, audit.groups())
verified = (root/'work/a-file-verification.txt').read_text()
v = re.search(r'Verified (\d+) phase/cage states, (\d+) legal edges, (\d+) promotion replies', verified)
assert v and int(v[1]) == states
report={'scope':'Offline exploration; no production rule or lookup changes. Pawn on h2-h7, Black king restricted to files a-e. No captures. Promotions only when every choice permits immediate mate. Lock is a corner plus one neighboring a/b-file square (or tighter), with the blockading knight removed from the geometric control test. r1 remains in that same cage; r2 keeps a knight blockade; r3 cannot enter r1 before a qualifying blockade.','sourceSha256':hashlib.sha256(b''.join((root/f).read_bytes() for f in ['geometry.hpp','promotion.hpp','explore-a-file.cpp'])).hexdigest(),'whiteStarts':white,'a8h7WhiteStarts':int(re.search(r'A8_H7 certified starts (\d+)',text)[1]),'freshClockFailures':failures,'maxPolicyMateWhiteMoves':longest,'verifiedPhaseStates':states,'verifiedEdges':int(v[2]),'verifiedPromotionReplies':int(v[3]),'examples':rows}
(root/'a-file-exploration.json').write_text(json.dumps(report,indent=2)+'\n')
