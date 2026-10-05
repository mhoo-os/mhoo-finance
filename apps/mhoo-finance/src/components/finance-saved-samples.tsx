import { AppPath, navigate } from 'twenty-sdk/front-component';
import { FinanceSampleEvidence } from 'src/components/finance-sample-evidence';
import { SAMPLE_FILTER, displaySampleAmount } from 'src/investigation/sample-evidence';
import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { Callout, Loader } from 'twenty-ui/feedback';
import { Button } from 'twenty-ui/input';
import { H2Title } from 'twenty-ui/typography';

type Sample = {
  id: string;
  name: string;
  exactAmountMinor: string;
  sourceCurrency: string;
  account: string;
};

export const FinanceSavedSamples = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<Sample[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setSelectedId(null);
    setState('loading');
    const load = async () => {
      try {
        const result = await new CoreApiClient().query({
          financeFacts: {
            __args: {
              first: 60,
              filter: SAMPLE_FILTER,
            },
            pageInfo: { hasNextPage: true },
            edges: {
              node: {
                id: true,
                name: true,
                exactAmountMinor: true,
                sourceCurrency: true,
                financialAccount: { accountLabel: true },
              },
            },
          },
        });
        if (cancelled) return;
        setRows(
          (result.financeFacts?.edges ?? []).map(({ node }) => ({
            id: node.id,
            name: node.name,
            exactAmountMinor: node.exactAmountMinor ?? '',
            sourceCurrency: node.sourceCurrency ?? '',
            account:
              node.financialAccount?.accountLabel ?? 'Account not linked',
          })),
        );
        setHasMore(result.financeFacts?.pageInfo.hasNextPage ?? false);
        setState('ready');
      } catch {
        if (!cancelled) setState('failed');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return (
    <section aria-label="Saved CSV samples">
      <H2Title
        title="Saved CSV samples"
        description="Read from this workspace. Samples remain unreviewed and excluded from financial totals."
      />
      <Button
        title="Refresh samples"
        onClick={() => setRefresh((value) => value + 1)}
      />
      {state === 'loading' && <Loader />}
      {state === 'failed' && (
        <Callout
          variant="error"
          title="Samples could not be read"
          description="The request failed or your role does not allow this read. No financial totals are shown. You can retry with Refresh samples."
        />
      )}
      {state === 'ready' && (
        <>
          <Callout
            variant="warning"
            title={`${rows.length}${hasMore ? '+' : ''} saved samples`}
            description="Partial CSV selection, not complete account history. Amounts preserve the recorded sign; no income, spending or balance totals are calculated."
          />
          {rows.length === 0 && (
            <p>No unreviewed sample rows are available to your role.</p>
          )}
          {selectedId ? <>
            <Button title="Back to saved samples" onClick={() => setSelectedId(null)} />
            <FinanceSampleEvidence key={selectedId} id={selectedId} />
          </> : rows.map((row) => (
            <div
              key={row.id}
              style={{ padding: '12px 0', borderBottom: '1px solid #ddd' }}
            >
              <strong>{row.name}</strong>
              <div>{row.account}</div>
              <div>
                {displaySampleAmount(row.exactAmountMinor, row.sourceCurrency)} ·
                Unclassified · Excluded
              </div>
              <Button title="Inspect source evidence" onClick={() => setSelectedId(row.id)} />
            </div>
          ))}
          <Button title="Open transaction table" onClick={() => navigate(AppPath.RecordIndexPage, { objectNamePlural: 'financeFacts' })} />
          {hasMore && (
            <p>
              Showing the first 60 matching rows. Open Finance facts for the
              full list.
            </p>
          )}
        </>
      )}
    </section>
  );
};
