import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { BASE, NONE } from './encoding.mts';
const dir=process.env.AUDIT_DIR!, source=process.env.AUDIT_ROOTS_FROM!;
if(!dir||!source||!process.env.AUDIT_ROOT_HASH) throw new Error('Missing validated root-cache configuration');
const old=new DatabaseSync(source+'/census.sqlite',{readOnly:true});
assert.ok(old.prepare("SELECT value FROM meta WHERE key='rootsComplete'").get(),'Source root census is incomplete');
const totals=old.prepare('SELECT count(*) AS count,sum(weight) AS weight FROM roots').get() as any;
assert.equal(totals.count,1707888);assert.equal(totals.weight,13660584);
const db=new DatabaseSync(dir+'/census.sqlite');
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE IF NOT EXISTS roots(key INTEGER PRIMARY KEY,weight INTEGER,supported INTEGER,flags INTEGER,children TEXT); CREATE TABLE IF NOT EXISTS nodes(id INTEGER PRIMARY KEY,key INTEGER UNIQUE,payload TEXT);');
const populated=(db.prepare('SELECT count(*) AS n FROM roots').get() as any).n;
if(populated) {
 console.log('Existing checkpoint already has roots; continuing it unchanged');
} else {
 const nodes=new Map<number,number>();
 const oldNode=old.prepare('SELECT key FROM nodes WHERE id=?');
 const insertNode=db.prepare('INSERT INTO nodes VALUES (?,?,NULL)');
 const insertRoot=db.prepare('INSERT INTO roots VALUES (?,?,?,?,?)');
 const meta=db.prepare('INSERT OR REPLACE INTO meta VALUES (?,?)');
 db.exec('BEGIN');
 try {
  for(const r of old.prepare('SELECT * FROM roots').iterate() as any) {
   const children=JSON.parse(r.children).map((id:number)=>{
    const key=(oldNode.get(id) as any).key as number;
    assert.equal(key%BASE,NONE,'A starting root must have no return history');
    let next=nodes.get(key);
    if(next===undefined){next=nodes.size;nodes.set(key,next);insertNode.run(next,key);}
    return next;
   });
   insertRoot.run(r.key,r.weight,r.supported,r.flags,JSON.stringify(children));
  }
  meta.run('hash',process.env.AUDIT_HASH!);
  meta.run('rootsComplete','true');
  meta.run('rootCacheSource',source);
  meta.run('rootCacheFingerprint',process.env.AUDIT_ROOT_HASH!);
  db.exec('COMMIT');
 } catch(error){db.exec('ROLLBACK');throw error;}
 console.log('Reused all',totals.weight,'starting placements; all White policies will be rebuilt');
}
db.close();old.close();
