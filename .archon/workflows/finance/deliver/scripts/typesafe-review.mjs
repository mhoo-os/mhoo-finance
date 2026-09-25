import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {buildEvaluationReviewEnvelope,composeEvaluationReview,validateDecisionResponse,requestEvaluationReview} from './room-typesafe.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const git = args => execFileSync('git',args,{encoding:'utf8',maxBuffer:4*1024*1024});
export function validate(input,receipt,now=Date.now()) {
  const envelope=buildEvaluationReviewEnvelope(input);
  if(receipt?.requestId!==input.requestId || receipt.inputHash!==hash({state:envelope.state,questions:envelope.questions}) ||
    receipt.schemaVersion!==envelope.schemaVersion || receipt.caller!=='delivery-room' || receipt.provider!=='direct-typesafe' ||
    !Number.isFinite(Date.parse(receipt.timestamp)) || Math.abs(now-Date.parse(receipt.timestamp))>300000) throw Error('RECEIPT_BINDING_INVALID');
  validateDecisionResponse({model:receipt.model,answers:receipt.decisions},envelope);
  const p=receipt.decisions.next_step.probabilities;
  const keys=Object.keys(envelope.questions.next_step.criteria);
  if(Object.keys(p).length!==keys.length || keys.some(k=>!Number.isFinite(p[k])||p[k]<0||p[k]>1) || Math.abs(keys.reduce((sum,k)=>sum+p[k],0)-1)>.02) throw Error('PROBABILITIES_INVALID');
  return composeEvaluationReview(receipt,input);
}

export function packet({base,work,green,summary}) {
  if(!base || !work?.trim() || !['true','false'].includes(green)) throw Error('INPUT_REQUIRED');
  // Pin committed source; no agent-generated summary can substitute for this binding.
  const head=git(['rev-parse','HEAD']).trim();
  const baseHead=git(['rev-parse','--verify',base+'^{commit}']).trim();
  if(git(['diff','--no-ext-diff','HEAD','--']).trim()) throw Error('UNCOMMITTED_SOURCE');
  const paths=git(['diff','--name-only','-z',baseHead+'...'+head,'--']).split('\0').filter(Boolean);
  const eligible=paths.filter(p=>/\.(?:[cm]?[jt]sx?|py|sql|css|html)$/.test(p) && !/(secret|credential|token|\.env|node_modules|dist\/)/i.test(p));
  let excerpt='';
  for(const path of eligible) {
    const diff=git(['diff','--no-ext-diff','--no-textconv','--unified=3',baseHead+'...'+head,'--',path]);
    excerpt+=(diff.slice(0,9000-excerpt.length));
    if(excerpt.length>=9000) break;
  }
  if(!excerpt) throw Error('NO_REVIEWABLE_SOURCE');
  const sourceDigest=hash({baseHead,head,paths,excerpt});
  const input={requestId:'finance-'+hash({sourceDigest,work,green,summary}).slice(0,40),sourceDigest,
    goal:('Assess only the bounded diff excerpt against this work order. Evidence is PARTIAL; never infer omitted implementation, tests, live Sandbox behavior or whole-product completion. '+work).slice(0,3900),
    files:{'bounded-change-excerpt.diff':excerpt},
    test:{passed:green==='true',sourceDigest,provenance:'Upstream Archon agent check report, not independently verified by this TypeSafe node',summary:String(summary||'').slice(0,1000)},
    check:['node','upstream-check-report-not-a-rerun']};
  buildEvaluationReviewEnvelope(input);
  return {input,head,baseHead,coverage:'partial',changedPathCount:paths.length};
}

export async function run(env=process.env,{request=requestEvaluationReview,makePacket=packet}={}) {
  if(!env.ARTIFACTS_DIR) throw Error('ARTIFACTS_REQUIRED');
  const data=makePacket({base:env.BASE_BRANCH,work:env.INPUTS_WORK||env.ARGUMENTS,green:env.INPUTS_GREEN,summary:env.INPUTS_SUMMARY});
  const dir=join(env.ARTIFACTS_DIR,'typesafe'); await mkdir(dir,{recursive:true,mode:0o700});
  const file=join(dir,data.input.requestId+'.json');
  let prior;
  try {prior=JSON.parse(await readFile(file,'utf8'));} catch(error) {if(error.code!=='ENOENT') throw error;}
  if(prior) {
    if(prior.status!=='complete' || prior.inputHash!==hash(data.input)) throw Error('PRIOR_ATTEMPT_HELD');
    return {...validate(data.input,prior.receipt),receipt:file,head:data.head,coverage:'partial'};
  }
  await writeFile(file,JSON.stringify({status:'pending',head:data.head,inputHash:hash(data.input)})+'\n',{flag:'wx',mode:0o600});
  // Pending remains on transport/validation failure: no silent retry of an uncertain call.
  const receipt=await request(data.input);
  const advice=validate(data.input,receipt);
  const latest=makePacket({base:env.BASE_BRANCH,work:env.INPUTS_WORK||env.ARGUMENTS,green:env.INPUTS_GREEN,summary:env.INPUTS_SUMMARY});
  if(hash(latest)!==hash(data)) throw Error('SOURCE_CHANGED');
  await writeFile(file+'.complete',JSON.stringify({...data,status:'complete',inputHash:hash(data.input),receipt},null,2)+'\n',{flag:'wx',mode:0o600});
  await rename(file+'.complete',file);
  return {...advice,receipt:file,head:data.head,coverage:'partial'};
}
