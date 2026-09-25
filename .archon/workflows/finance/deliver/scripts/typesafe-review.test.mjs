import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {run,validate} from './typesafe-review.mjs';
import {buildEvaluationReviewEnvelope} from './room-typesafe.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const input={requestId:'test-review',sourceDigest:'a'.repeat(64),goal:'Return the sum of two integers.',files:{'sum.mjs':'export const sum=(a,b)=>a+b;'},test:{passed:true,sourceDigest:'a'.repeat(64)},check:['node','--test']};
function receipt(){const e=buildEvaluationReviewEnvelope(input);return {requestId:input.requestId,inputHash:hash({state:e.state,questions:e.questions}),schemaVersion:e.schemaVersion,caller:'delivery-room',provider:'direct-typesafe',model:'jev-test',timestamp:new Date().toISOString(),decisions:{goal_satisfied:{type:'noul',noul:.9},coverage_sufficient:{type:'noul',noul:.1},next_step:{type:'choice',choice:'improve_checks',confidence:.9,probabilities:{ready_for_independent_review:.03,repair_source:.03,improve_checks:.9,other_or_unknown:.04}}}};}
test('negative semantic advice reaches review without claiming acceptance',()=>{const r=validate(input,receipt());assert.equal(r.nextStep,'improve_checks');assert.equal(r.accepted,false);});
for(const [name,mutate] of Object.entries({stale:r=>r.timestamp='2000-01-01',foreign:r=>r.inputHash='b'.repeat(64),unavailable:r=>r.provider='unavailable',missing:r=>delete r.decisions.goal_satisfied,probability:r=>r.decisions.next_step.probabilities.repair_source=-1})) test('rejects '+name,()=>{const r=receipt();mutate(r);assert.throws(()=>validate(input,r));});
test('uncertain calls are preserved and not retried',async()=>{const dir=await mkdtemp(join(tmpdir(),'finance-typesafe-'));let calls=0;const opts={makePacket:()=>({input,head:'b'.repeat(40)}),request:async()=>{calls++;throw Error('network');}};try{await assert.rejects(run({ARTIFACTS_DIR:dir},opts));await assert.rejects(run({ARTIFACTS_DIR:dir},opts));assert.equal(calls,1);}finally{await rm(dir,{recursive:true,force:true});}});
test('valid repeated consumption reuses one bound receipt',async()=>{const dir=await mkdtemp(join(tmpdir(),'finance-typesafe-'));let calls=0;const opts={makePacket:()=>({input,head:'b'.repeat(40)}),request:async()=>{calls++;return receipt();}};try{const r=await run({ARTIFACTS_DIR:dir},opts);await run({ARTIFACTS_DIR:dir},opts);assert.equal(calls,1);assert.equal(JSON.parse(await readFile(r.receipt)).status,'complete');assert.equal(r.coverage,'partial');}finally{await rm(dir,{recursive:true,force:true});}});
test('source change during request holds completion',async()=>{const dir=await mkdtemp(join(tmpdir(),'finance-typesafe-'));let reads=0;try{await assert.rejects(run({ARTIFACTS_DIR:dir},{makePacket:()=>({input,head:String(reads++)}),request:async()=>receipt()}),/SOURCE_CHANGED/);}finally{await rm(dir,{recursive:true,force:true});}});
