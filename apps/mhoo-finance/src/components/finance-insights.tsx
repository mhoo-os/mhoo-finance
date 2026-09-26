import React, { useState } from 'react';
import styled from '@emotion/styled';
import { financeInsightsPrimitiveStyles, financeInsightsResponsiveStyles, financeInsightsStyles } from './finance-insights-styles';
import { dateDay, dayDate, monthly, scopeFacts, summarize } from './finance-insights-model.mjs';
import type { WorkspaceFinanceData, WorkspaceFinanceFact, WorkspaceFinanceFollowUp } from '../investigation/workspace-finance-data';
import { FinanceButton, FinanceHeader, FinanceSourceRow } from './finance-ui/finance-insights-primitives';
import { FinancePeriodControls } from './finance-ui/finance-period-controls';
import { formatMoney, minor } from '../contracts/money';

const InsightsFrame = styled.div(financeInsightsStyles, financeInsightsPrimitiveStyles, financeInsightsResponsiveStyles);

const money = (value: number, code = 'USD') => {
  if (!Number.isSafeInteger(Math.round(value * 100))) return '—';
  try {
    const display = formatMoney({ currency: code as never, minor: minor(String(Math.round(value * 100))).toString() });
    return code === 'USD' ? display.replace('USD ', '$') : display;
  } catch { return '—'; }
};
const shortDate = (value: string) => new Date(value+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
type Props = { data: WorkspaceFinanceData; isSynthetic: boolean; onOpenFollowUp: (task: WorkspaceFinanceFollowUp)=>void; onOpenFact:(fact: WorkspaceFinanceFact)=>void };

export function FinanceInsights({data,isSynthetic,onOpenFollowUp,onOpenFact}:Props) {
  const dates = data.facts.map((fact) => fact.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  const domainStart = dates.length ? `${dates[0].slice(0, 4)}-01-01` : '';
  const domainEnd = dates.length ? `${dates.at(-1)!.slice(0, 4)}-12-31` : '';
  const defaultRange = domainStart <= '2026-06-01' && domainEnd >= '2026-08-31'
    ? { start: '2026-06-01', end: '2026-08-31' }
    : { start: dates[0] ?? '', end: dates.at(-1) ?? '' };
  const [range,setRange] = useState(defaultRange);
  const [draft,setDraft] = useState(range);
  const [datesOpen,setDatesOpen] = useState(false);
  const [filtersOpen,setFiltersOpen] = useState(false);
  const [account,setAccount] = useState('all');
  const [chartType,setChartType] = useState('both');
  const [compare,setCompare] = useState(false);
  const [error,setError] = useState('');
  const [hover,setHover] = useState<string|null>(null);
  const [drillMonth,setDrillMonth] = useState<string|null>(null);
  const endOfDomain = dateDay(domainEnd || range.end || '1970-01-01');
  const timelineMonths = (() => {
    const result: Array<{ label: string; start: number; end: number; key: string }> = [];
    if (!domainStart || !domainEnd) return result;
    const cursor = new Date(`${domainStart.slice(0, 7)}-01T00:00:00Z`);
    while (cursor.toISOString().slice(0, 10) <= domainEnd) {
      const start = dateDay(cursor.toISOString().slice(0, 10));
      const last = new Date(cursor); last.setUTCMonth(last.getUTCMonth() + 1, 0);
      const end = Math.min(endOfDomain, dateDay(last.toISOString().slice(0, 10)));
      result.push({ key: cursor.toISOString().slice(0, 7), label: cursor.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), start, end });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return result;
  })();
  const selected = scopeFacts(data,range.start,range.end,account);
  const rawTotals = summarize(selected);
  const totals = data.truncated ? { ...rawTotals, available: false, reason: 'Result limit reached' } : rawTotals;
  const months = monthly(selected,range.start,range.end);
  const startDay = dateDay(range.start), endDay = dateDay(range.end);
  const prior = summarize(scopeFacts(data,dayDate(startDay-(endDay-startDay+1)),dayDate(startDay-1),account));
  const related = data.followUps.filter((task:any)=>task.subjects.some((s:any)=>selected.some((f:any)=>f.id===s.reference)));
  const noteOrder = [0,1,3,2];
  const notes = noteOrder.map(i=>data.followUps[i]).filter(task=>related.includes(task));
  const max=Math.max(10000,...months.filter(m=>m.available).map(m=>m.incoming));
  const min=-Math.max(10000,...months.filter(m=>m.available).map(m=>m.outgoing));
  const top=Math.ceil(max/10000)*10000,bottom=Math.floor(min/10000)*10000;
  const y=(value:number)=>35+(top-value)/(top-bottom)*280;
  const x=(i:number)=>100+(i+.5)*(690/months.length);
  const ticks=[];for(let t=bottom;t<=top;t+=10000)ticks.push(t);
  const hovered=months.find(m=>m.key===hover);
  const drillFacts=selected.filter((f:any)=>!drillMonth||f.date.startsWith(drillMonth));
  const grouped = (direction:string) => {
    const groups = new Map<string,{total:number,facts:any[]}>();
    for(const f of selected.filter((f:any)=>f.direction===direction&&f.includedInTotals&&f.status==='POSTED')) {
      const name=f.description.split(' · ')[0];const g=groups.get(name)||{total:0,facts:[]};g.total+=Number(f.amountMinor)/100;g.facts.push(f);groups.set(name,g);
    }
    return [...groups].sort((a,b)=>b[1].total-a[1].total).slice(0,4);
  };
  return <InsightsFrame><section className="hi" aria-label="Hass Kitchen Insights">
    <FinanceHeader workspaceLabel={isSynthetic ? 'Hass Kitchen' : 'Workspace'} sample={isSynthetic} />
    {domainStart && domainEnd ? <FinancePeriodControls accounts={data.accounts} accountId={account} range={range} draft={draft} resetRange={defaultRange} domainStart={domainStart} domainEnd={domainEnd} months={timelineMonths.map((month) => ({ ...month, start: dayDate(month.start), end: dayDate(month.end) }))} filtersOpen={filtersOpen} datesOpen={datesOpen} compare={compare} error={error} onAccountIdChange={(next) => { setAccount(next); setDrillMonth(null); }} onDraftChange={setDraft} onRangeChange={(next) => { setRange(next); setDraft(next); setError(''); setDrillMonth(null); setHover(null); }} onValidationError={setError} onFiltersOpenChange={setFiltersOpen} onDatesOpenChange={setDatesOpen} onCompareChange={setCompare} /> : null}
    <p className="hi-mobile-hint">Swipe the timeline to see more months · drag the range edges</p><div className="hi-main"><aside className="hi-narrative"><p className="hi-label">Net cash movement</p><div className="hi-net" aria-live="polite">{totals.available?money(totals.net):'—'}</div>{compare&&<p className="hi-comparison">Previous equal-length period<br/>{prior.available?money(prior.net):'No imported activity to compare'}</p>}<div className="hi-notes">{notes.map((task:any)=><button key={task.id} className="hi-note" onClick={()=>onOpenFollowUp(task)}><span className="hi-arrow">↗</span><span><strong>{task.title.includes('$45')?'$45 payout difference':task.title.includes('supplier')?'Supplier payment ready for review':task.title.includes('espresso')?'Receipt still missing':'Catering receipt explained'}</strong><small>{task.title.includes('$45')?'Clover payout needs supporting detail.':task.title.includes('supplier')?'$1,284 invoice and bank payment agree.':task.title.includes('espresso')?'$325 equipment service payment.':'$2,400 matched in this staged review.'}</small></span></button>)}{!notes.length&&<p className="hi-empty-note">No linked follow-ups in this selection.</p>}</div><p className="hi-disclosure">Fictional demo data · review required.<br/>Cash movement is not profit.</p></aside>
    <section className="hi-plot"><div className="hi-chart-toolbar"><div><p className="hi-label">Money in</p><strong>{totals.available?money(totals.incoming):'—'}</strong></div><div><p className="hi-label">Money out</p><strong>{totals.available?'−'+money(totals.outgoing):'—'}</strong></div><div className="hi-chart-options"><span>Monthly</span><select aria-label="Chart type" value={chartType} onChange={e=>setChartType(e.target.value)}><option value="both">Bars + net</option><option value="bars">Bars</option><option value="line">Net line</option></select></div></div>
      {totals.available?<div className="hi-chart-wrap"><svg viewBox="0 0 830 365" role="group" aria-label="Monthly money in and out with monthly net movement in USD"><defs><linearGradient id="hi-in" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7379ee" stopOpacity=".29"/><stop offset="1" stopColor="#7379ee" stopOpacity=".055"/></linearGradient><linearGradient id="hi-out" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a9aaba" stopOpacity=".055"/><stop offset="1" stopColor="#a9aaba" stopOpacity=".28"/></linearGradient></defs>{ticks.map(t=><g key={t}><line x1="78" x2="810" y1={y(t)} y2={y(t)} className={t===0?'hi-zero':'hi-grid'}/><text x="62" y={y(t)+4} textAnchor="end">{t===0?'$0':`${t<0?'−':''}$${Math.abs(t)/1000}K`}</text></g>)}{months.map((m,i)=><g key={m.key}>{m.available&&chartType!=='line'&&<><rect x={x(i)-Math.min(57,250/months.length)} y={y(m.incoming)} width={Math.min(114,500/months.length)} height={y(0)-y(m.incoming)} fill="url(#hi-in)"/><line x1={x(i)-Math.min(57,250/months.length)} x2={x(i)+Math.min(57,250/months.length)} y1={y(m.incoming)} y2={y(m.incoming)} stroke="#7a80f6" strokeOpacity=".55"/><rect x={x(i)-Math.min(57,250/months.length)} y={y(0)} width={Math.min(114,500/months.length)} height={y(-m.outgoing)-y(0)} fill="url(#hi-out)"/></>}<text x={x(i)} y="350" textAnchor="middle">{m.label}</text>{!m.available&&<text x={x(i)} y={y(0)-15} textAnchor="middle" className="hi-no-data">No activity</text>}</g>)}{chartType!=='bars'&&months.map((m,i)=>m.available?<g key={m.key}>{i>0&&months[i-1].available&&<line x1={x(i-1)} y1={y(months[i-1].net)} x2={x(i)} y2={y(m.net)} stroke="#555dff" strokeWidth="1.7"/>}<circle cx={x(i)} cy={y(m.net)} r="4.5" fill="#555dff" stroke="white" strokeWidth="1.5"/></g>:null)}{months.map((m,i)=><rect key={m.key} x={x(i)-Math.min(75,320/months.length)} y="25" width={Math.min(150,640/months.length)} height="300" fill="transparent" role="button" tabIndex={0} aria-label={`Inspect ${m.label} transactions`} onMouseEnter={()=>setHover(m.key)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(m.key)} onBlur={()=>setHover(null)} onClick={()=>setDrillMonth(drillMonth===m.key?null:m.key)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setDrillMonth(drillMonth===m.key?null:m.key);}}}/>)}</svg>{hovered?.available&&<div className="hi-tooltip" role="status"><b>{hovered.label} 2026</b><span>In {money(hovered.incoming)}</span><span>Out −{money(hovered.outgoing)}</span><span>Net {money(hovered.net)}</span></div>}</div>:<div className="hi-no-activity">{selected.length?'Only excluded transfers in this range.':'No imported activity in this range.'}<small>Select June–August to explore the demo.</small></div>}
      <div className="hi-legend"><span><i className="hi-dot-in"/>Money in</span><span><i className="hi-dot-out"/>Money out</span><span><i className="hi-dot-net"/>Monthly net</span><small>Click a month to inspect transactions</small></div>
    </section></div>
    {drillMonth?<section className="hi-drill"><div className="hi-section-title"><h2>{months.find(m=>m.key===drillMonth)?.label} transactions</h2><FinanceButton onClick={()=>setDrillMonth(null)}>Close</FinanceButton></div>{drillFacts.map((f:any)=><FinanceSourceRow key={f.id} onClick={()=>onOpenFact(f)}><span>{f.date} · {f.description}{!f.includedInTotals&&<small>Excluded from cash-flow totals · internal transfer</small>}</span><strong>{f.direction==='out'?'−':''}{money(Number(f.amountMinor)/100, f.currency)}</strong></FinanceSourceRow>)}</section>:<div className="hi-breakdowns">{['in','out'].map(direction=><section key={direction}><h2>{direction==='in'?'Money in by source':'Money out by recipient'}</h2><p>{shortDate(range.start)} – {shortDate(range.end)}, {domainEnd.slice(0, 4)}</p>{grouped(direction).map(([name,group])=><FinanceSourceRow key={name} onClick={()=>onOpenFact(group.facts[0])}><span>{name}<small>{group.facts.length} transaction{group.facts.length===1?'':'s'} · open first</small></span><strong>{money(group.total, group.facts[0]?.currency)}</strong><span>›</span></FinanceSourceRow>)}{!grouped(direction).length&&<p>No included transactions.</p>}</section>)}</div>}
  </section></InsightsFrame>;
}
