import assert from 'node:assert/strict'
import {fork} from 'node:child_process'
import {createHash} from 'node:crypto'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {DatabaseSync} from 'node:sqlite'
import {getChess} from '../../app/src/mate/chess.ts'
import {twoBishopsRuleSet, twoBishopsWhiteRules} from '../../app/src/mate/rules/twoBishops.ts'
import {measureRuleRelevance} from './rule-relevance.mts'
import {createTwoBishopsDevelopmentFingerprints} from './development-cache.mts'

type Row = {id: number; key: string}
type Stat = {filteringPositions: number; relevantPositions: number; restoredMoves: number; examples: {fen: string; selected: string[]; newlyAdmitted: string[]}[]}
const emptyStats = (): Record<string, Stat> => Object.fromEntries(twoBishopsWhiteRules.map(rule => [rule.id,{filteringPositions:0,relevantPositions:0,restoredMoves:0,examples:[]}]))
const args=process.argv.slice(2)
const option=(name:string)=>args.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3)
if(args.includes('--worker')) {
 process.on('message',(rows:Row[])=>{
  const stats=emptyStats()
  for(const row of rows){
   const fen=`${row.key} 0 1`
   const candidates=twoBishopsRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves())
   const result=measureRuleRelevance(candidates,twoBishopsWhiteRules)
   for(const id of result.filtering)stats[id]!.filteringPositions++
   for(const [id,moves] of result.relevant){const stat=stats[id]!;stat.relevantPositions++;stat.restoredMoves+=moves.length;if(stat.examples.length<3)stat.examples.push({fen,selected:result.winners,newlyAdmitted:moves})}
  }
  process.send!({count:rows.length,stats})
 })
} else {
 const census=option('census')
 if(!census)throw new Error('Pass --census=path/to/graph.sqlite from a completed exhaustive census')
 const scope=option('scope')??'roots'
 assert.ok(scope==='roots'||scope==='all')
 const workers=Number(option('workers')??6),limit=Number(option('limit')??0)
 assert.ok(Number.isInteger(workers)&&workers>0&&workers<=16)
 assert.ok(Number.isInteger(limit)&&limit>=0)
 const output=resolve(option('output')??'tmp/two-bishops-rule-relevance.json')
 mkdirSync(dirname(output),{recursive:true})
 const database=new DatabaseSync(resolve(census),{readOnly:true})
 const rows=database.prepare(`SELECT id,key FROM nodes ${scope==='roots'?'WHERE is_root=1':''} ORDER BY id`).all() as Row[]
 database.close()
 const population=rows.length
 // A spread across the whole census is useful for timing probes; full runs have no limit.
 const selected=limit>0&&limit<rows.length?Array.from({length:limit},(_,i)=>rows[Math.floor(i*rows.length/limit)]!):rows
 const sourcePaths=['../../app/src/mate/rules/twoBishops.ts','../../app/src/mate/rules/selection.ts','../../app/src/mate/chess.ts','./rule-relevance.mts']
 const sourceSha256=createHash('sha256').update(Buffer.concat(sourcePaths.map(p=>readFileSync(new URL(p,import.meta.url))))).digest('hex')
 const started=Date.now(),stats=emptyStats();let cursor=0,completed=0
 const progress=()=>({completed,total:selected.length,elapsedSeconds:Math.round((Date.now()-started)/1000)})
 const timer=setInterval(()=>console.error(JSON.stringify(progress())),30000)
 try{
 await Promise.all(Array.from({length:workers},()=>new Promise<void>((done,reject)=>{
  const child=fork(fileURLToPath(import.meta.url),['--worker'],{stdio:['ignore','ignore','inherit','ipc']})
  let finished=false
  const send=()=>{if(cursor>=selected.length){finished=true;child.disconnect();done();return}const batch=selected.slice(cursor,cursor+100);cursor+=batch.length;child.send(batch)}
  child.on('error',reject)
  child.on('exit',code=>{if(!finished)reject(new Error(`Worker exited with ${code}`))})
  child.on('message',(result:{count:number;stats:Record<string,Stat>})=>{
   completed+=result.count
   for(const [id,value] of Object.entries(result.stats)){const sum=stats[id]!;sum.filteringPositions+=value.filteringPositions;sum.relevantPositions+=value.relevantPositions;sum.restoredMoves+=value.restoredMoves;sum.examples.push(...value.examples.slice(0,Math.max(0,3-sum.examples.length)))}
   send()
  })
  send()
 })))
 }finally{clearInterval(timer)}
 assert.equal(completed,selected.length)
 const result={definition:'Keep earlier rules; omit this rule; apply all later rules. Relevant if a move excluded by the full policy survives.',scope,population,positions:completed,complete:completed===population,unit:'equally weighted symmetry-canonical White-to-move positions',census:resolve(census),fingerprints:createTwoBishopsDevelopmentFingerprints(),sourceSha256,elapsedMs:Date.now()-started,rules:twoBishopsWhiteRules.map(rule=>({id:rule.id,name:rule.shortLabel,...stats[rule.id],percent:100*stats[rule.id]!.relevantPositions/completed}))}
 writeFileSync(output,JSON.stringify(result,null,2)+'\n')
 console.log(JSON.stringify({...progress(),output}))
}
