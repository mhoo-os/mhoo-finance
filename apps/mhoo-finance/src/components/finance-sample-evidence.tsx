import { useEffect, useState } from 'react';
import { AppPath, navigate } from 'twenty-sdk/front-component';
import { Button } from 'twenty-ui/input';
import { Callout, Loader } from 'twenty-ui/feedback';
import { H2Title } from 'twenty-ui/typography';
import { readSampleEvidence, type EvidenceState, displaySampleAmount } from 'src/investigation/sample-evidence';

export const FinanceSampleEvidence = ({ id }: { id: string }) => {
  const [state, setState] = useState<EvidenceState | { status: 'loading' }>({ status: 'loading' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void readSampleEvidence(id).then(result => { if (!cancelled) setState(result); });
    return () => { cancelled = true; };
  }, [id, retry]);
  return <section aria-label="Selected transaction evidence">
    <H2Title title="Trace this transaction" description="Read-only source inspection. This sample remains unclassified and excluded from totals." />
    {state.status === 'loading' && <Loader />}
    {state.status === 'failed' && <Callout variant="error" title="Evidence could not be read" description="The request failed or your role does not allow this evidence read. No source details are shown." />}
    {state.status === 'unavailable' && <Callout variant="warning" title="Sample unavailable" description="The record is unavailable to your role or no longer matches the sample scope. Refresh the sample list." />}
    {(state.status === 'failed' || state.status === 'unavailable') && <Button title="Retry evidence" onClick={() => setRetry(value => value + 1)} />}
    {state.status === 'ready' && <>
      <p><strong>{state.fact.name}</strong> · {displaySampleAmount(state.fact.exactAmountMinor ?? '', state.fact.sourceCurrency ?? '')}</p>
      <Button title="Open transaction record" onClick={() => navigate(AppPath.RecordShowPage, { objectNameSingular: 'financeFact', objectRecordId: id })} />
      <dl>
        <dt>Transaction date</dt><dd>{state.fact.transactionDate || 'Not supplied'}</dd>
        <dt>Exact source location</dt><dd>{state.fact.sourceLocation || 'Not supplied'}</dd>
        <dt>Source row identifier</dt><dd>{state.fact.sourceRowKey || 'Not supplied'}</dd>
        <dt>Original amount and sign convention</dt><dd>{state.fact.sourceAmount || 'Not supplied'} · {state.fact.sourceSignConvention || 'Not supplied'}</dd>
      </dl>
      {!state.linked && <Callout variant="warning" title="Source artifact not available" description="The link is missing or unavailable to your role. The transaction alone does not establish original-file custody." />}
      {state.fact.artifact && <>
        <dl>
          <dt>Original filename</dt><dd>{state.fact.artifact.originalFileName || 'Not supplied'}</dd>
          <dt>Recorded SHA-256</dt><dd style={{ overflowWrap: 'anywhere' }}>{state.fact.artifact.contentHash || 'Not supplied'}</dd>
          <dt>Acquired</dt><dd>{state.fact.artifact.acquiredAt || 'Not supplied'}</dd>
          <dt>Artifact state</dt><dd>{state.fact.artifact.status || 'Unknown'}</dd>
        </dl>
        <Callout variant="warning" title={state.hasOriginal ? 'Original-file reference recorded' : 'Original file unavailable in this workspace'} description={state.hasOriginal ? 'Open the source record to inspect its Files field. A reference does not prove file availability, verified contents or complete account history.' : 'Only source metadata is available here. Retain and upload the original export through the governed evidence intake before claiming complete custody.'} />
        <Button title="Open source artifact" onClick={() => navigate(AppPath.RecordShowPage, { objectNameSingular: 'sourceArtifact', objectRecordId: state.fact.artifact!.id })} />
      </>}
      <details><summary>Recorded original row values</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{state.fact.rawValues || 'No original row values recorded'}</pre></details>
    </>}
  </section>;
};
