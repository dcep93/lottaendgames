import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Chess} from '../../app/node_modules/chess.js/dist/esm/chess.js';
const BAD=6*64*2016*64;
const sq=(i:number)=>'abcdefgh'[i%8]+String(1+(i>>3));
export function index(chess:Chess){const pieces=chess.board().flat().filter(Boolean);if(pieces.length!==5||pieces.some(p=>!['k','p','n'].includes(p!.type)))return BAD;const p=pieces.find(p=>p!.type==='p');const ns=pieces.filter(p=>p!.type==='n').map(p=>toIndex(p!.square)).sort((a,b)=>a-b);const w=pieces.find(p=>p!.type==='k'&&p.color==='w'),b=pieces.find(p=>p!.type==='k'&&p.color==='b');if(!p||p.square[0]!=='h'||ns.length!==2)return BAD;const pair=ns[0]*(127-ns[0])/2+(ns[1]-ns[0]-1);return (((Number(p.square[1])-2)*64+toIndex(w!.square))*2016+pair)*64+toIndex(b!.square);}
function toIndex(s:string){return s.charCodeAt(0)-97+8*(Number(s[1])-1);}
let count=0;
for(const line of fs.readFileSync(new URL('./work/geometry.txt',import.meta.url),'utf8').trim().split('\n')){const [header,white,black]=line.split('|');const [id,p,w,n1,n2,b,vw,vb]=header.trim().split(' ').map(Number);for(const [turn,valid,list] of [['w',vw,white],['b',vb,black]] as const){if(!valid)continue;const chess=new Chess();chess.clear();for(const [s,type,color] of [[p,'p','b'],[w,'k','w'],[n1,'n','w'],[n2,'n','w'],[b,'k','b']] as const)chess.put({type,color},sq(s));const fen=chess.fen().replace(' w ',` ${turn} `);chess.load(fen);const actual=new Set<number>();for(const m of chess.moves({verbose:true})){if(turn==='w'&&m.captured)continue;chess.move(m);actual.add(m.promotion&&!m.captured?BAD+1:index(chess));chess.undo();}const expected=new Set(list.trim()?list.trim().split(' ').map(Number):[]);assert.deepEqual(actual,expected,`${id} ${fen}`);count++;}}
console.log(`Verified ${count} native legal-move lists against chess.js.`);
