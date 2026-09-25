import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {run} from '../../deliver/scripts/typesafe-review.mjs';
const source='export const sum=(a,b)=>a+b;';
const check='import assert from "node:assert/strict"; const sum=(a,b)=>a+b; assert.equal(sum(2,3),5); assert.equal(sum(-2,2),0);';
execFileSync('node',['--input-type=module','-e',check]);
const sourceDigest=createHash('sha256').update(source+check).digest('hex');
const input={requestId:'finance-smoke-'+sourceDigest.slice(0,30),sourceDigest,goal:'The function sum adds two integers, including a negative plus a positive. Synthetic smoke test only.',files:{'sum.mjs':source,'sum.test.mjs':check},test:{passed:true,sourceDigest,provenance:'node assertions executed in this script'},check:['node','--input-type=module','-e',check]};
try {
  const result=await run(process.env,{makePacket:()=>({input,head:'synthetic-smoke',coverage:'bounded-synthetic'})});
  console.log(JSON.stringify({...result,smoke:true}));
} catch {
  console.error('TYPESAFE_SMOKE_HELD'); process.exitCode=1;
}
