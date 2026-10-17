/** Observation-only decision contract. It never changes the deterministic baseline. */
export async function observeDecision({ envelope, baseline, decide, compare }) {
  if (!envelope || envelope.mode !== 'shadow' || typeof envelope.requestId !== 'string') throw new Error('FINANCE_SHADOW_REQUIRED');
  try {
    const receipt = await decide(envelope);
    if (!receipt || receipt.mode !== 'shadow' || receipt.requestId !== envelope.requestId) throw new Error('DECISION_RECEIPT_INVALID');
    if (!receipt.decisions || receipt.fallback) return { applied: false, baseline, receipt, agrees: null, status: 'unavailable' };
    return { applied: false, baseline, receipt, agrees: compare(baseline, receipt), status: 'observed' };
  } catch {
    return { applied: false, baseline, receipt: null, agrees: null, status: 'unavailable' };
  }
}

export function buildFinanceEvidenceShadowEnvelope({ requestId, summary }) {
  if (typeof requestId !== 'string' || requestId.length === 0 || typeof summary !== 'string') throw new Error('Invalid shadow request');
  return {
    requestId,
    schemaVersion: 'finance-evidence-route-v1',
    purpose: 'Compare a typed observation with the deterministic finance evidence route.',
    mode: 'shadow',
    state: { summary },
    questions: {
      route: { type: 'choice', instructions: 'Choose the bounded evidence route.', criteria: { investigate: 'Evidence is missing, conflicting, or uncertain.', ready: 'Explicit prerequisites are present.', other: 'Neither route is supported.' } },
      completeness: { type: 'score', instructions: 'Rate only described evidence completeness.', criteria: ['Required evidence missing', 'Partially supported', 'Explicitly complete'] },
      eligible: { type: 'boolean', instructions: 'Are every named prerequisite explicitly present?' },
    },
  };
}
