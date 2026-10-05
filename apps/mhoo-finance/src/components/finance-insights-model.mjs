export const DAY = 86400000;
export const dateDay = date => Math.floor(Date.parse(date + 'T00:00:00Z') / DAY);
export const dayDate = day => new Date(day * DAY).toISOString().slice(0, 10);
export function summarize(facts) {
  // This mirrors the Workspace aggregate contract: inclusion is explicit and a
  // superseded source is never a current contribution.  Pending records remain
  // visible when the source explicitly marked them included.
  const included = facts.filter(f => f.includedInTotals && f.status !== 'SUPERSEDED');
  let incoming = 0n, outgoing = 0n;
  const currencies = new Set(included.map(f => f.currency).filter(Boolean));
  if (currencies.size !== 1) return { available: false, reason: 'Currency unavailable or mixed' };
  const currency = [...currencies][0];
  for (const fact of included) {
    if (!/^\d+$/.test(fact.amountMinor ?? '') || !['in', 'out'].includes(fact.direction)) return { available: false, reason: 'Unsupported amount or direction' };
    if (fact.direction === 'in') incoming += BigInt(fact.amountMinor); else outgoing += BigInt(fact.amountMinor);
  }
  if (incoming > BigInt(Number.MAX_SAFE_INTEGER) || outgoing > BigInt(Number.MAX_SAFE_INTEGER)) return {available:false,reason:'Amounts exceed preview plotting precision'};
  return { available: included.length > 0, currency, incoming: Number(incoming)/100, outgoing: Number(outgoing)/100, net: Number(incoming-outgoing)/100, count: included.length };
}
export function scopeFacts(data, start, end, account = 'all') {
  return data.facts.filter(f => f.date >= start && f.date <= end && (account === 'all' || f.accountId === account));
}
export function monthly(facts, start, end) {
  const result=[];
  let date = new Date(start.slice(0,7)+'-01T00:00:00Z');
  while (date.toISOString().slice(0,10) <= end) {
    const key=date.toISOString().slice(0,7);
    result.push({key,label:date.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'}),...summarize(facts.filter(f=>f.date.startsWith(key)))});
    date.setUTCMonth(date.getUTCMonth()+1);
  }
  return result;
}
