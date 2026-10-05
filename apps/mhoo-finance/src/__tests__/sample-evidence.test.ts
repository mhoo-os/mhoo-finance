import { describe, expect, it, vi } from 'vitest';
import { displaySampleAmount, readSampleEvidence, fetchSampleEvidence, SAMPLE_FILTER } from 'src/investigation/sample-evidence';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('twenty-client-sdk/core', () => ({ CoreApiClient: class { query = query; } }));

const fact = {
  id: 'sample-1', name: 'Synthetic purchase', classification: 'UNCLASSIFIED' as const,
  includedInTotals: false, exclusionReason: SAMPLE_FILTER.exclusionReason.eq,
  sourceRowKey: 'row-19', sourceLocation: 'synthetic.csv:19', sourceAmount: '1.23',
  sourceSignConvention: 'outflow-positive', rawValues: '{"amount":"1.23"}',
  transactionDate: '2026-01-02', exactAmountMinor: '-123', sourceCurrency: 'USD',
  artifact: { id: 'artifact-1', originalFileName: 'synthetic.csv', contentHash: 'abc',
    status: 'PARTIAL' as const, acquiredAt: '2026-01-03', originalFiles: [] },
};

describe('permission-aware sample evidence presentation', () => {
  it('queries only the selected sample through the generated client with nested evidence', async () => {
    query.mockResolvedValueOnce({ financeFacts: { edges: [{ node: fact }] } });
    expect(await fetchSampleEvidence('sample-1')).toEqual(fact);
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ financeFacts: expect.objectContaining({
      __args: { first: 1, filter: { ...SAMPLE_FILTER, id: { eq: 'sample-1' } } },
      edges: { node: expect.objectContaining({ artifact: expect.objectContaining({ originalFiles: { fileId: true, label: true } }) }) },
    }) }));
  });
  it('retains exact row linkage but reports that the original file is missing', async () => {
    expect(await readSampleEvidence('sample-1', async () => fact)).toMatchObject({
      status: 'ready', linked: true, hasOriginal: false,
      fact: { sourceLocation: 'synthetic.csv:19', artifact: { id: 'artifact-1' } },
    });
  });
  it('does not invent evidence for a missing or inaccessible artifact relation', async () => {
    expect(await readSampleEvidence('sample-1', async () => ({ ...fact, artifact: undefined }))).toMatchObject({ status: 'ready', linked: false, hasOriginal: false });
  });
  it('returns no details and performs no broader retry on a permission or network failure', async () => {
    const denied = vi.fn().mockRejectedValue(new Error('private provider/server detail'));
    expect(await readSampleEvidence('sample-1', denied)).toEqual({ status: 'failed' });
    expect(denied).toHaveBeenCalledTimes(1);
  });
  it('returns no details for unavailable, mismatched or newly reviewed records', async () => {
    expect(await readSampleEvidence('sample-1', async () => null)).toEqual({ status: 'unavailable' });
    for (const change of [{ id: 'other' }, { includedInTotals: true }, { classification: 'REVENUE' as const }, { exclusionReason: '' }]) {
      expect(await readSampleEvidence('sample-1', async () => ({ ...fact, ...change }))).toEqual({ status: 'unavailable' });
    }
  });
  it('does not claim file availability from metadata alone', async () => {
    const result = await readSampleEvidence('sample-1', async () => ({ ...fact, artifact: { ...fact.artifact, originalFiles: [{ fileId: 'reference-1', label: 'synthetic.csv' }] } }));
    expect(result).toMatchObject({ status: 'ready', hasOriginal: true });
    expect(result).not.toHaveProperty('verified');
  });
});

describe('exact sample amount display', () => {
  it('formats signed USD without losing integer precision', () => {
    expect(displaySampleAmount('-123', 'USD')).toBe('-1.23 USD');
    expect(displaySampleAmount('9007199254740993123', 'USD')).toBe('90071992547409931.23 USD');
    expect(displaySampleAmount('0', 'USD')).toBe('0.00 USD');
  });
  it('does not assume a currency exponent or accept malformed amounts', () => {
    expect(displaySampleAmount('100', 'JPY')).toBe('100 minor units · JPY');
    expect(displaySampleAmount('1.5', 'USD')).toBe('Amount unavailable');
  });
});
