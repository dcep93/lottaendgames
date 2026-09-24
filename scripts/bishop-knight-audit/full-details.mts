import {DatabaseSync} from 'node:sqlite';
import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {BASE, NONE, code, fen, canonical, transform, unpack, square, distance, pair, transforms, pack} from './encoding.mts';
import {transitionOrbit, applyEncodedWhiteMove} from './transition-orbits.mts';
import {piecePositionMotif as motif} from './position-motifs.mts';
import {getChess,validateMatePosition} from '../../app/src/mate/chess.ts';
import {getIdealKnightAndBishopWhiteMoves as white} from '../../app/src/mate/rules/bishopKnight.ts';
import {knightAndBishopSupportedDiagonal as support} from '../../app/src/mate/rules/bishopKnightDiagonalSupport.ts';
import {encodeMateReplay,decodeMateReplay} from '../../app/src/mate/share.ts';

// Postprocess the persisted full graph; never rerun the expensive census.
const dir=process.env.AUDIT_DIR!;
assert.ok(dir,'AUDIT_DIR is required');
const manifest=JSON.parse(readFileSync(dir+'/manifest.json','utf8'));
assert.equal(manifest.population,'all','Full details require --scope all');
const result=JSON.parse(readFileSync(dir+'/result.json','utf8'));
const db=new DatabaseSync(dir+'/census.sqlite',{readOnly:true});
assert.ok(db.prepare("SELECT value FROM meta WHERE key='graphComplete'").get());
const outcomes=readFileSync(dir+'/node-outcomes.bin');
const sizes=new Uint8Array(BASE).fill(99), weights=new Uint8Array(BASE);
const supportedRoots:{key:number,weight:number,size:number}[]=[];
for(const r of db.prepare('SELECT key,weight,supported FROM roots').iterate() as any){
    weights[r.key]=r.weight;
    if(r.supported!==99){
        supportedRoots.push({key:r.key,weight:r.weight,size:r.supported});
        for(let t=0;t<8;t++) sizes[transform(r.key,t)]=r.supported;
    }
}
const cycleBoards=new Map<number,any>(result.placements.boards.map((b:any)=>[b.key,b]));
const empty=()=>({orbits:0,physical:0});
const add=(c:{orbits:number,physical:number},w:number)=>{c.orbits++;c.physical+=w;};
const tally=()=>({total:empty(),directLoop:empty(),directLoopFromFreshStart:empty(),canLoop:empty(),noLoop:empty(),canMate:empty(),canFail:empty()});
const populations:any={all:tally(),supported:tally(),unsupported:tally(),'3':tally(),'5':tally(),'7':tally()};
for(const r of db.prepare('SELECT * FROM roots').iterate() as any){
    const children:number[]=JSON.parse(r.children);
    const flags=children.reduce((f,i)=>f|outcomes[i]!,0);
    for(const name of ['all',r.supported===99?'unsupported':'supported',...(r.supported===99?[]:[String(r.supported)])]){
        const t=populations[name];add(t.total,r.weight);
        if(cycleBoards.has(r.key))add(t.directLoop,r.weight);
        add(flags&1?t.canLoop:t.noLoop,r.weight);
        if((flags&4)||(r.flags&2))add(t.canMate,r.weight);
        if((flags&8)||(r.flags&4))add(t.canFail,r.weight);
    }
}
assert.equal(populations.all.total.physical,13660584);
assert.equal(populations.all.total.orbits,1707888);
assert.equal(populations.all.canLoop.physical,result.counts.canLoop);
const motifs=new Map<string,any>();
for(const b of cycleBoards.values()){
    const label=`${b.size===99?'Unsupported':b.size+'-diagonal'}; ${motif(b.key)}`;
    const m=motifs.get(label)??{label,...empty(),families:new Set<number>(),exampleKey:b.key};
    add(m,b.weight);for(const f of b.families)m.families.add(f);motifs.set(label,m);
}
const families=result.families.map((f:any)=>({...f,fromSupported:empty(),fromUnsupported:empty(),supportedCycleBoards:empty(),unsupportedCycleBoards:empty()}));
const familyById=new Map<number,any>(families.map((f:any)=>[f.id,f]));
for(const b of cycleBoards.values())for(const id of b.families)add(familyById.get(id)[b.size===99?'unsupportedCycleBoards':'supportedCycleBoards'],b.weight);
const memberships=JSON.parse(readFileSync(dir+'/root-family-membership.json','utf8'));
for(const r of memberships){
    for(const id of r.familyIds)add(familyById.get(id)[sizes[r.key]===99?'fromUnsupported':'fromSupported'],r.weight);
    const b=cycleBoards.get(r.key);
    if(b&&r.familyIds.some((id:number)=>b.families.includes(id)))for(const name of ['all',sizes[r.key]===99?'unsupported':'supported',...(sizes[r.key]===99?[]:[String(sizes[r.key])])])add(populations[name].directLoopFromFreshStart,r.weight);
}
console.log('Full root and loop partitions complete');

// Loss identity includes the supported White result BEFORE Black's reply.
// Reclassifying the board after that reply would violate the UI's phase contract.
type Loss={key:string,boards:number[],weight:number,size:number,moved:string,motif:string,outcomes:number,terminal:string,history:boolean,fresh:boolean; previousWhite?:number};
const losses=new Map<string,Loss>();
const terminalCache=new Map<number,{post:number,terminal:string,outcomes:number}[]>();
function terminalWhiteMoves(k:number){
    if(terminalCache.has(k))return terminalCache.get(k)!;
    const ch=getChess(fen(k)), branches=[];
    for(const san of white(ch.fen())){
        ch.move(san);const legal=ch.moves({verbose:true});
        if(!legal.length)branches.push({post:code(ch.fen()),terminal:ch.isCheckmate()?'mate':'stalemate',outcomes:ch.isCheckmate()?4:8});
        else if(legal.some(m=>m.captured))branches.push({post:code(ch.fen()),terminal:'capture available',outcomes:8});
        ch.undo();
    }
    terminalCache.set(k,branches);return branches;
}
function recordLoss(before:number,current:number,post:number,outcome:number,terminal:string,history:boolean,previousWhite?:number){
    if(sizes[before]===99||sizes[post]!==99)return;
    const o=transitionOrbit([before,current,post]);
    const existing=losses.get(o.key);
    if(existing){existing.outcomes|=outcome;existing.history ||=history;existing.fresh ||=!history;if(existing.previousWhite===undefined&&previousWhite!==undefined){let t=0;while([before,current,post].map(k=>transform(k,t)).join(',')!==o.key)t++;existing.previousWhite=transform(previousWhite,t);}return;}
    const a=unpack(o.boards[1]!),b=unpack(o.boards[2]!);
    const moved='KBN'[a.findIndex((s,i)=>s!==b[i])]!;
    let t=0;while([before,current,post].map(k=>transform(k,t)).join(',')!==o.key)t++;
    losses.set(o.key,{...o,size:sizes[before]!,moved,motif:motif(o.boards[0]!),outcomes:outcome,terminal,history,fresh:!history,...(previousWhite===undefined?{}:{previousWhite:transform(previousWhite,t)})});
}
// Every supported post-White board is a root. Enumerating all its legal replies
// covers support-loss contexts completely without reconstructing prior history.
const supportedHistoryNodes=new Set<number>();
const getNode=db.prepare('SELECT id,payload FROM nodes WHERE key=?');
for(const root of supportedRoots){
    const ch=getChess(fen(root.key,'b'));
    if(!ch.moves().length)continue;
    for(const san of ch.moves()){
        const move=ch.move(san);
        if(!move.captured){
            const current=code(ch.fen()),node=getNode.get(pair(current,NONE)) as any;
            assert.ok(node,'Fresh supported root child is absent');supportedHistoryNodes.add(node.id);
            const payload=JSON.parse(node.payload);
            // Canonical node move codes must be brought into the root's orientation.
            const canonCurrent=canonical(current);
            let orient=0;while(transform(canonCurrent,orient)!==current)orient++;
            for(const [child,post,w] of payload.edges){
                if(sizes[post]!==99)continue;
                const actualPost=transform(applyEncodedWhiteMove(canonCurrent,w),orient);
                recordLoss(root.key,current,actualPost,outcomes[child]!, '',false);
            }
            if(payload.flags)for(const t of terminalWhiteMoves(current))recordLoss(root.key,current,t.post,t.outcomes,t.terminal,false);
        }
        ch.undo();
    }
}
// Continue from every supported root through all legal Black replies.
// This distinguishes a supported-origin cycle from merely containing support on the cycle.
const getNodeById=db.prepare('SELECT payload FROM nodes WHERE id=?');
const supportReach=new Uint8Array(result.graph.nodes),queue=[...supportedHistoryNodes];
for(const id of queue)supportReach[id]=1;
for(let h=0;h<queue.length;h++){
    const p=JSON.parse((getNodeById.get(queue[h]!) as any).payload);
    for(const [child] of p.edges)if(!supportReach[child]){supportReach[child]=1;queue.push(child);}
}
for(const f of families)f.reachableAfterAnySupportedPosition=f.nodeIds.some((id:number)=>supportReach[id]);
// Normalize example orientation: light bishop nearer a8 than h1, then knight nearer d3.
function displayBoards(boards:number[]){
    const opts=Array.from({length:8},(_,t)=>boards.map(k=>transform(k,t)));
    const euclidean2=(a:number,b:number)=>((a&7)-(b&7))**2+((a>>3)-(b>>3))**2;
    const score=(v:number[])=>{const [,b,n]=unpack(v[1]!) as [number,number,number,number];return [((b&7)+(b>>3))%2===1?0:1, euclidean2(b,56)<euclidean2(b,7)?0:1, euclidean2(n,19),v[1]!];};
    opts.sort((a,b)=>{const x=score(a),y=score(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]!-y[i]!;return 0;});return opts[0]!;
}
for(const f of families){
    const phaseBoard=getChess(f.witness.fen);
    let chosen:any;
    for(let phase=0;phase<f.witness.moves.length;phase+=2){
        if(phase){phaseBoard.move(f.witness.moves[phase-2]);phaseBoard.move(f.witness.moves[phase-1]);}
        const original=code(phaseBoard.fen()),normalized=displayBoards([original,original])[1]!;
        let t=0;while(transform(original,t)!==normalized)t++;
        const src=getChess(fen(original)),dst=getChess(fen(normalized));
        const rotated=[...f.witness.moves.slice(phase),...f.witness.moves.slice(0,phase)];
        const moves=rotated.map((san:string)=>{
            const m=src.move(san);
            const from=m.from.charCodeAt(0)-97+(Number(m.from[1])-1)*8;
            const to=m.to.charCodeAt(0)-97+(Number(m.to[1])-1)*8;
            return dst.move({from:square(transforms[t]![from]!) as any,to:square(transforms[t]![to]!) as any}).san;
        });
        assert.equal(code(dst.fen()),normalized,'Loop must return to the same physical board');
        const hash=encodeMateReplay(fen(normalized),moves,0);
        if(!decodeMateReplay(hash,'bishop-knight').ok)continue;
        const replay=getChess(fen(normalized));
        let verified=true;
        for(const san of [...moves,...moves,...moves]){
            const before=replay.fen();
            if(replay.turn()==='w') verified &&=white(before).includes(san);
            else verified &&=getChess(before).moves().includes(san);
            replay.move(san);
        }
        const candidate={...f.witness,fen:fen(normalized),moves,url:'http://localhost:5173/mate/bishop-knight'+hash,freshLoadVerified:verified};
        chosen??=candidate;
        if(verified){chosen=candidate;break;}
    }
    f.witness=chosen??{...f.witness,url:null,replayUnavailable:'No cycle phase passes the app fresh-start validator; a lead-in is required'};
}

function findSetupWhite(before:number):{board:number,best:boolean}|undefined{
    const dest=unpack(before) as [number,number,number,number];
    let fallback:number|undefined;
    for(let i=0;i<3;i++)for(let squareIndex=0;squareIndex<64;squareIndex++){
        if(dest.includes(squareIndex))continue;
        const pieces=[...dest] as [number,number,number,number];pieces[i]=squareIndex;
        if(distance(pieces[0],pieces[3])<=1)continue;
        const board=pack(...pieces),f=fen(board);
        if(!validateMatePosition('bishop-knight',f).ok)continue;
        const ch=getChess(f),move=ch.moves({verbose:true}).find(m=>m.from===square(squareIndex)&&m.to===square(dest[i]!));
        if(!move)continue;
        ch.move(move.san);if(code(ch.fen())!==before)continue;
        fallback??=board;
        if(white(f).includes(move.san))return {board,best:true};
    }
    return fallback===undefined?undefined:{board:fallback,best:false};
}
const events=[...losses.values()].map(l=>{
    const boards=displayBoards(l.boards),current=boards[1]!,post=boards[2]!;
    let t=0;while(l.boards.map(k=>transform(k,t)).join(',')!==boards.join(','))t++;
    let previous=l.previousWhite===undefined?undefined:transform(l.previousWhite,t);
    const a=unpack(current),b=unpack(post),i=a.findIndex((s,i)=>s!==b[i]);
    const ch=getChess(fen(current));
    const san=ch.move({from:square(a[i]!) as any,to:square(b[i]!) as any}).san;
    assert.equal(code(ch.fen()),post);
    assert.ok(white(fen(current)).includes(san),'Loss witness must be best');
    const after=ch.fen();
    const alternatives=getChess(fen(current)),bestMoves=new Set(white(alternatives.fen()));
    const supportedLegalAlternatives:{san:string,size:number,best:boolean,safe:boolean,stalemate:boolean,capturePossible:boolean}[]=[];
    for(const candidate of alternatives.moves()){
        alternatives.move(candidate);const size=sizes[code(alternatives.fen())]!;
        assert.equal(support(alternatives.fen()).size,size,'Census support must match the production classifier');
        if(size!==99){const capturePossible=alternatives.moves({verbose:true}).some(m=>m.captured),stalemate=alternatives.isStalemate();supportedLegalAlternatives.push({san:candidate,size,best:bestMoves.has(candidate),safe:!capturePossible&&!stalemate,stalemate,capturePossible});}
        alternatives.undo();
    }
    let startFen=fen(current),moves=[san],lossPly=1,setupIsBest=true;
    if(!decodeMateReplay(encodeMateReplay(startFen,[san,...(ch.moves().length?[getChess(after).moves()[0]!]:[])],0),'bishop-knight').ok){
        if(previous===undefined||!validateMatePosition('bishop-knight',fen(previous)).ok){
            const setup=findSetupWhite(boards[0]!);
            if(!setup)return {...l,sourceKey:canonical(l.boards[0]!),beforeWhiteResult:fen(boards[0]!,'b'),fen:fen(current),move:san,after,supportedLegalAlternatives,startFen,moves,lossPly,setupIsBest:false,url:null,replayUnavailable:'No legal UI-admissible one-White-move predecessor; census-only example'};
            previous=setup.board;setupIsBest=setup.best;
        }
        const prefix=getChess(fen(previous!)),fromPieces=unpack(previous!),toPieces=unpack(boards[0]!);
        const changed=fromPieces.findIndex((s,i)=>s!==toPieces[i]);
        const first=prefix.move({from:square(fromPieces[changed]!) as any,to:square(toPieces[changed]!) as any}).san;
        const reply=prefix.move({from:square(boards[0]!&63) as any,to:square(current&63) as any}).san;
        assert.equal(code(prefix.fen()),current);
        moves=[first,reply,san];startFen=fen(previous!);lossPly=3;
    }
    if(ch.moves().length){const reply=getChess(after).moves()[0]!;moves.push(ch.move(reply).san);}
    const hash=encodeMateReplay(startFen,moves,0);
    assert.ok(decodeMateReplay(hash,'bishop-knight').ok,'Loss replay link must decode: '+JSON.stringify({startFen,moves,terminal:l.terminal}));
    return {...l,sourceKey:canonical(l.boards[0]!),beforeWhiteResult:fen(boards[0]!,'b'),fen:fen(current),move:san,after,supportedLegalAlternatives,startFen,moves,lossPly,setupIsBest,url:'http://localhost:5173/mate/bishop-knight'+hash};
});
const lossTotals=(ev:typeof events)=>{
    const sources=new Set(ev.map(e=>e.sourceKey));
    const decisions=new Map(ev.map(e=>{const o=transitionOrbit(e.boards.slice(1));return [o.key,o.weight];}));
    return {whiteDecisions:{orbits:decisions.size,physical:[...decisions.values()].reduce((s,w)=>s+w,0)},events:{orbits:ev.length,physical:ev.reduce((s,e)=>s+e.weight,0)},sourcePositions:{orbits:sources.size,physical:[...sources].reduce((s,k)=>s+weights[k]!,0)}};
};
const lossGroups=new Map<string,typeof events>();
for(const e of events.filter(e=>e.terminal!=='mate')){
    const key=`${e.size}-diagonal; ${e.motif}; ${e.moved} moves`;
    if(!lossGroups.has(key))lossGroups.set(key,[]);lossGroups.get(key)!.push(e);
}
const lossMotifs=[...lossGroups].map(([label,ev])=>({label,...lossTotals(ev),canLoop:lossTotals(ev.filter(e=>e.outcomes&1)),canFail:lossTotals(ev.filter(e=>e.outcomes&8)),example:ev.find(e=>e.url)??ev[0]})).sort((a,b)=>b.sourcePositions.orbits-a.sourcePositions.orbits||b.events.orbits-a.events.orbits);
const summary={policyFingerprint:manifest.fingerprint,populations,graph:result.graph,
    loopFamilies:{total:families.length,withSupportedCycle:families.filter((f:any)=>f.supportedCycleBoards.orbits).length,reachableFromSupportedStart:families.filter((f:any)=>f.fromSupported.orbits).length,reachableAfterAnySupportedPosition:families.filter((f:any)=>f.reachableAfterAnySupportedPosition).length,unsupportedOnly:families.filter((f:any)=>!f.supportedCycleBoards.orbits&&!f.reachableAfterAnySupportedPosition).length},
    positionMotifs:[...motifs.values()].map(m=>({...m,families:[...m.families]})).sort((a,b)=>b.orbits-a.orbits),
    supportLoss:{all:lossTotals(events),nonMating:lossTotals(events.filter(e=>e.terminal!=='mate')),mating:lossTotals(events.filter(e=>e.terminal==='mate')),playableExamples:lossTotals(events.filter(e=>e.url)),censusOnlyExamples:lossTotals(events.filter(e=>!e.url)),noLegalSupportPreservingMove:lossTotals(events.filter(e=>e.terminal!=='mate'&&!e.supportedLegalAlternatives.length)),legalSupportPreservingMoveExists:lossTotals(events.filter(e=>e.terminal!=='mate'&&e.supportedLegalAlternatives.length)),safeSupportPreservingMoveExists:lossTotals(events.filter(e=>e.terminal!=='mate'&&e.supportedLegalAlternatives.some(a=>a.safe))),noSafeSupportPreservingMove:lossTotals(events.filter(e=>e.terminal!=='mate'&&!e.supportedLegalAlternatives.some(a=>a.safe))),canLoop:lossTotals(events.filter(e=>e.outcomes&1)),canMate:lossTotals(events.filter(e=>e.outcomes&4)),canFail:lossTotals(events.filter(e=>e.outcomes&8)),bySize:[3,5,7].map(size=>({size,...lossTotals(events.filter(e=>e.size===size&&e.terminal!=='mate'))})),motifs:lossMotifs},families};
writeFileSync(dir+'/support-loss-events.json',JSON.stringify(events,null,2));
writeFileSync(dir+'/full-details.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({...summary,families:undefined,positionMotifs:undefined,supportLoss:{...summary.supportLoss,motifs:undefined}},null,2));
db.close();
