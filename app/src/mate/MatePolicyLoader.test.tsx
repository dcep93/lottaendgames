import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import TestRenderer,{act} from 'react-test-renderer';
import MatePolicyLoader from './MatePolicyLoader';
import data from './rules/bishopKnightSetupData.json';
import {loadBishopKnightSetup} from './rules/bishopKnightSetup';

test('KBN session stays unmounted through loading and failure, then mounts after retry',async()=>{
 (globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
 const original=globalThis.fetch;let renderer:TestRenderer.ReactTestRenderer|undefined;
 let attempts=0,mounted=0,finish!:()=>void;
 const pending=new Promise<void>(resolve=>{finish=resolve;});
 globalThis.fetch=async()=>{
  attempts++;if(attempts===1)return new Response(null,{status:503});
  await pending;
  return new Response(Uint8Array.from(readFileSync(new URL('../../public'+data.url,import.meta.url))).buffer);
 };
 function Session(){React.useEffect(()=>{mounted++;},[]);return <div>Ready board</div>;}
 try{
  await act(async()=>{renderer=TestRenderer.create(<MatePolicyLoader><Session/></MatePolicyLoader>);});
  assert.equal(mounted,0);assert.equal(renderer!.root.findAllByProps({role:'alert'}).length,1);
  await act(async()=>renderer!.root.findByType('button').props.onClick());
  assert.equal(mounted,0);assert.equal(renderer!.toJSON(),null);
  await act(async()=>{finish();await loadBishopKnightSetup();});
  assert.equal(mounted,1);assert.equal(attempts,2);assert.equal(renderer!.root.findByType('div').children[0],'Ready board');
 }finally{
  globalThis.fetch=original;if(renderer)await act(async()=>renderer!.unmount());
 }
});
