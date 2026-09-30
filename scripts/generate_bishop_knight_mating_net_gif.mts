import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {getChess} from '../app/src/mate/chess.ts';
import {r1Start,bishopKnightStageMoves,bishopKnightStagePosition} from '../app/src/mate/rules/bishopKnightStages.ts';
const require=createRequire(new URL('../app/package.json',import.meta.url));
const sharp=require('sharp'),{renderToStaticMarkup}=require('react-dom/server'),{defaultPieces}=require('react-chessboard');
const output=fileURLToPath(new URL('../app/public/mate/bishop-knight/r1-mating-net.gif',import.meta.url));
const board=getChess(r1Start),frames:string[]=[],durations:number[]=[];
const matingNetLine:string[]=[];
const replay=getChess(r1Start);
while(!replay.isCheckmate()){
 assert.ok(matingNetLine.length<200,'Mating net did not finish');
 const legal=replay.moves({verbose:true});
 const chosen=replay.turn()==='w'
  ? legal.find(move=>bishopKnightStageMoves(replay.fen()).moves.includes(move.from+move.to))
  : [...legal].sort((a,b)=>(bishopKnightStagePosition(b.after)?.remaining??-1)-(bishopKnightStagePosition(a.after)?.remaining??-1))[0];
 assert.ok(chosen,'Missing continuation');
 matingNetLine.push(replay.move(chosen).san);
}
const pieceSvg=new Map<string,string>();
for(const key of ['wK','wB','wN','bK'])pieceSvg.set(key,renderToStaticMarkup(defaultPieces[key]({})).replace('width="100%" height="100%"','width="64" height="64"'));
async function frame(caption:string,last:readonly string[]=[],duration=900){
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="576" height="576"><rect width="576" height="576" fill="#241a16"/><text x="288" y="23" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#fff1df">'+caption+'</text>';
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const square='abcdefgh'[col]+(8-row),x=32+col*64,y=32+row*64;
  svg+=`<rect x="${x}" y="${y}" width="64" height="64" fill="${last.includes(square)?'#ec94b8':(row+col)%2?'#a87353':'#e8cfad'}"/>`;
  const p=board.get(square as any);if(p)svg+=`<g transform="translate(${x},${y})">${pieceSvg.get(p.color+p.type.toUpperCase())}</g>`;
 }
 for(let i=0;i<8;i++)svg+=`<text x="${64+i*64}" y="564" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#e8cfad">${'abcdefgh'[i]}</text><text x="16" y="${70+i*64}" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#e8cfad">${8-i}</text>`;
 svg+='</svg>';frames.push((await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64'));durations.push(duration);
}
await frame('r1 · Execute the mating net',[],1400);
for(let i=0;i<matingNetLine.length;i++){
 const m=board.move(matingNetLine[i]!);await frame(`${Math.floor(i/2)+1}${i%2?'…':'.'} ${m.san}${board.isCheckmate()?' · Checkmate':''}`,[m.from,m.to],board.isCheckmate()?3200:900);
}
assert.ok(board.isCheckmate());assert.equal(frames.length,matingNetLine.length+1);
const result=spawnSync('python3',['-c',`import sys,json,base64,io\nfrom PIL import Image\nd=json.load(sys.stdin)\nf=[Image.open(io.BytesIO(base64.b64decode(x))).convert('RGB') for x in d['frames']]\nb=io.BytesIO()\nf[0].save(b,format='GIF',save_all=True,append_images=f[1:],duration=d['durations'],loop=0,disposal=2,optimize=False)\nsys.stdout.buffer.write(b.getvalue())`],{input:JSON.stringify({frames,durations}),maxBuffer:20_000_000});
assert.equal(result.status,0,result.stderr.toString());
if(process.argv.includes('--check'))assert.deepEqual(readFileSync(output),result.stdout,'Regenerate r1 GIF');
else{mkdirSync(fileURLToPath(new URL('../app/public/mate/bishop-knight/',import.meta.url)),{recursive:true});writeFileSync(output,result.stdout);}
console.log(`Verified ${frames.length} frames, ${matingNetLine.length} legal plies, final checkmate: ${output}`);
