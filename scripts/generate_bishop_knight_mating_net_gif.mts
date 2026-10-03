import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../app/src/mate/chess.ts';
const require=createRequire(new URL('../app/package.json',import.meta.url));
const sharp=require('sharp'),{renderToStaticMarkup}=require('react-dom/server'),{defaultPieces,defaultArrowOptions}=require('react-chessboard');
const boardCss=readFileSync(new URL('../app/src/app_x/styles.css',import.meta.url),'utf8');
const boardColor=(name:string)=>{const value=boardCss.match(new RegExp(`--leg-board-${name}:\\s*(#[a-fA-F0-9]+)`))?.[1];assert.ok(value);return value;};
const light=boardColor('light'),dark=boardColor('dark');
const output=fileURLToPath(new URL('../app/public/mate/bishop-knight/r1-mating-net.gif',import.meta.url));
const matingNetStart='8/8/8/8/2B5/2K5/2N5/2k5 w - - 0 1';
// Reflect the previous a1–h8 presentation across a8–h1: together, a 180° rotation.
const reflection=SQUARE_TRANSFORMS.find(transform=>transform.name==='rotate180')!;
const sourceBoard=getChess(matingNetStart);
const board=getChess(transformFen(matingNetStart,reflection)),frames:string[]=[],durations:number[]=[];
const playbackSpeed=1.3;
// User-specified demonstration; keep the exact replies rather than choosing a policy line.
const matingNetLine=[
 'Ba2','Kd1','Nd4','Kc1','Ne2+','Kd1','Kd3','Ke1',
 'Ke3','Kd1','Bb3+','Ke1','Bc2','Kf1','Nf4','Ke1',
 'Ng2+','Kf1','Kf3','Kg1','Kg3','Kf1','Bd3+','Kg1',
 'Be2','Kh1','Nf4','Kg1','Nh3+','Kh1','Bf3#',
];
const pieceSvg=new Map<string,string>();
for(const key of ['wK','wB','wN','bK'])pieceSvg.set(key,renderToStaticMarkup(defaultPieces[key]({})).replace('width="100%" height="100%"','width="64" height="64"'));
async function frame(last:readonly string[]=[],duration=900){
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">';
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const square='abcdefgh'[col]+(8-row),x=col*64,y=row*64;
  svg+=`<rect x="${x}" y="${y}" width="64" height="64" fill="${(row+col)%2?dark:light}"/>`;
  if(last.includes(square))svg+=`<rect x="${x}" y="${y}" width="64" height="64" fill="${defaultArrowOptions.color}" fill-opacity="0.4"/>`;
  const p=board.get(square as any);if(p)svg+=`<g transform="translate(${x},${y})">${pieceSvg.get(p.color+p.type.toUpperCase())}</g>`;
 }
 svg+='</svg>';frames.push((await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64'));durations.push(Math.round(duration/playbackSpeed/10)*10);
}
await frame([],1400);
for(let i=0;i<matingNetLine.length;i++){
 const original=sourceBoard.move(matingNetLine[i]!);assert.equal(original.san,matingNetLine[i]);
 const m=board.move({from:transformSquare(original.from,reflection),to:transformSquare(original.to,reflection)});
 assert.equal(board.fen(),transformFen(sourceBoard.fen(),reflection));
 await frame([m.from,m.to],board.isCheckmate()?3200:900);
}
assert.ok(board.isCheckmate());assert.equal(frames.length,matingNetLine.length+1);
const result=spawnSync('python3',['-c',`import sys,json,base64,io\nfrom PIL import Image\nd=json.load(sys.stdin)\nf=[Image.open(io.BytesIO(base64.b64decode(x))).convert('RGB') for x in d['frames']]\nb=io.BytesIO()\nf[0].save(b,format='GIF',save_all=True,append_images=f[1:],duration=d['durations'],loop=0,disposal=2,optimize=False)\nsys.stdout.buffer.write(b.getvalue())`],{input:JSON.stringify({frames,durations}),maxBuffer:20_000_000});
assert.equal(result.status,0,result.stderr.toString());
if(process.argv.includes('--check'))assert.deepEqual(readFileSync(output),result.stdout,'Regenerate r1 GIF');
else{mkdirSync(fileURLToPath(new URL('../app/public/mate/bishop-knight/',import.meta.url)),{recursive:true});writeFileSync(output,result.stdout);}
console.log(`Verified ${frames.length} frames, ${matingNetLine.length} legal plies, final checkmate: ${output}`);
