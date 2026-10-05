import { CoreApiClient } from 'twenty-client-sdk/core';

export const SAMPLE_FILTER = {
  exclusionReason: { eq: 'SAMPLE_ONLY_UNRECONCILED_DO_NOT_PUBLISH' },
  includedInTotals: { eq: false },
  classification: { eq: 'UNCLASSIFIED' },
} as const;

// Presentation only: retain arbitrary-precision integer text, never Number().
export const displaySampleAmount = (minor: string, currency: string): string => {
  if (!/^-?(0|[1-9]\d*)$/.test(minor)) return 'Amount unavailable';
  if (currency !== 'USD') return `${minor} minor units · ${currency || 'Currency unavailable'}`;
  const negative = minor.startsWith('-');
  const digits = (negative ? minor.slice(1) : minor).padStart(3, '0');
  return `${negative ? '-' : ''}${digits.slice(0, -2)}.${digits.slice(-2)} USD`;
};

export type EvidenceFact = {
  id: string; name?: string; classification?: string; includedInTotals?: boolean;
  exclusionReason?: string; sourceRowKey?: string; sourceLocation?: string;
  sourceAmount?: string; sourceSignConvention?: string; rawValues?: string;
  transactionDate?: string; exactAmountMinor?: string; sourceCurrency?: string;
  artifact?: { id: string; originalFileName?: string; contentHash?: string;
    status?: string; acquiredAt?: string;
    originalFiles?: ({ fileId: string; label: string } | undefined)[] };
};

export const fetchSampleEvidence = async (id: string): Promise<EvidenceFact | null> => {
  const result = await new CoreApiClient().query({
    financeFacts: {
      __args: { first: 1, filter: { ...SAMPLE_FILTER, id: { eq: id } } },
      edges: { node: {
        id: true, name: true, classification: true, includedInTotals: true,
        exclusionReason: true, sourceRowKey: true, sourceLocation: true,
        sourceAmount: true, sourceSignConvention: true, rawValues: true,
        transactionDate: true, exactAmountMinor: true, sourceCurrency: true,
        artifact: { id: true, originalFileName: true, contentHash: true,
          status: true, acquiredAt: true, originalFiles: { fileId: true, label: true } },
      } },
    },
  });
  return result.financeFacts?.edges[0]?.node ?? null;
};

type Fact = EvidenceFact;
export type EvidenceState =
  | { status: 'unavailable' | 'failed' }
  | { status: 'ready'; fact: Fact; linked: boolean; hasOriginal: boolean };

export const readSampleEvidence = async (
  id: string,
  read: typeof fetchSampleEvidence = fetchSampleEvidence,
): Promise<EvidenceState> => {
  try {
    const fact = await read(id);
    // Refetch the selected record; never present another row or a changed scope.
    // These checks protect presentation. Twenty enforces actual permissions.
    if (!fact || fact.id !== id || fact.classification !== 'UNCLASSIFIED' ||
      fact.includedInTotals !== false ||
      fact.exclusionReason !== SAMPLE_FILTER.exclusionReason.eq) return { status: 'unavailable' };
    return { status: 'ready', fact, linked: Boolean(fact.artifact?.id),
      hasOriginal: Boolean(fact.artifact?.originalFiles?.some(file => file?.fileId)) };
  } catch {
    // Do not retry with a broader query or return cached/raw error evidence.
    return { status: 'failed' };
  }
};
