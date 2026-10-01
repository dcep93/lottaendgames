import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Chess} from '../../app/node_modules/chess.js/dist/esm/chess.js';
const sq=(i:number)=>'abcdefgh'[i%8]+String(1+(i>>3));
const pairs:number[][]=[];for(let a=0;a<64;a++)for(let b=a+1;b<64;b++)pairs.push([a,b]);
let count=0;for(const [id,...moves] of JSON.parse(fs.readFileSync(new URL('./work/promotions.json',import.meta.url),'utf8'))){let n=id;const k=n%64;n=Math.floor(n/64);const [a,b]=pairs[n%2016];const w=Math.floor(n/2016)%64;for(let type=0;type<4;type++){const c=new Chess();c.clear();for(const [p,t,color] of [[k,'k','b'],[w,'k','w'],[a,'n','w'],[b,'n','w'],[7,'qrbn'[type],'b']] as const)c.put({type:t,color},sq(p));const m=moves[type];c.move({from:sq(m>>6),to:sq(m%64)});assert(c.isCheckmate(),`${id} ${type}`);count++;}}
console.log(`Verified ${count} promotion finishing edges with chess.js.`);
