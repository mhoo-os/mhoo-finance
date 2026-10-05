import { useRef } from 'react';

import type { WorkspaceFinanceData } from '../../investigation/workspace-finance-data';
import { FinanceButton } from './finance-insights-primitives';
import { applyFinancePeriodDraft, moveFinancePeriodRange, moveFinancePeriodRangeToStart, resetFinancePeriodRange, type FinancePeriodDragKind, type FinancePeriodRange } from './finance-period-controls-behavior';
import { financeTimelinePresentation } from './finance-timeline-presentation';

type Month = Readonly<{ key: string; label: string; start: string; end: string }>;
export type { FinancePeriodRange } from './finance-period-controls-behavior';

const DAY = 86_400_000;
const day = (value: string) => Math.floor(Date.parse(`${value}T00:00:00Z`) / DAY);
const shortDate = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export type FinancePeriodControlsProps = Readonly<{
  accounts: WorkspaceFinanceData['accounts']; accountId: string; range: FinancePeriodRange; draft: FinancePeriodRange; resetRange: FinancePeriodRange; domainStart: string; domainEnd: string; months: readonly Month[]; filtersOpen: boolean; datesOpen: boolean; compare?: boolean; error?: string;
  onAccountIdChange: (accountId: string) => void; onDraftChange: (range: FinancePeriodRange) => void; onRangeChange: (range: FinancePeriodRange) => void; onValidationError?: (error: string) => void; onFiltersOpenChange: (open: boolean) => void; onDatesOpenChange: (open: boolean) => void; onCompareChange?: (compare: boolean) => void;
}>;

/** Exact approved Overview toolbar, popovers, and brush shared by every Finance data view. */
export const FinancePeriodControls = ({ accounts, accountId, range, draft, resetRange, domainStart, domainEnd, months, filtersOpen, datesOpen, compare = false, error = '', onAccountIdChange, onDraftChange, onRangeChange, onValidationError, onFiltersOpenChange, onDatesOpenChange, onCompareChange }: FinancePeriodControlsProps) => {
  const ruler = useRef<HTMLDivElement>(null);
  const drag = useRef<null | { kind: FinancePeriodDragKind; x: number; width: number; start: number; end: number }>(null);
  const origin = day(domainStart); const last = day(domainEnd); const span = Math.max(1, last - origin + 1); const start = day(range.start); const end = day(range.end);
  const selectedSpan = Math.max(1, end - start + 1);
  const nativeRangeStyle = { left: `${-(start - origin) / selectedSpan * 100}%`, width: `${span / selectedSpan * 100}%` };
  const timelinePresentation = financeTimelinePresentation(months);
  const update = (nextStart: number, nextEnd: number) => onRangeChange({ start: new Date(nextStart * DAY).toISOString().slice(0, 10), end: new Date(nextEnd * DAY).toISOString().slice(0, 10) });
  const beginDrag = (event: React.PointerEvent<HTMLButtonElement>, kind: FinancePeriodDragKind) => {
    event.preventDefault(); event.stopPropagation();
    const capture = event.currentTarget.setPointerCapture;
    const measure = ruler.current?.getBoundingClientRect;
    if (typeof capture !== 'function' || typeof measure !== 'function') return;
    try {
      const width = measure.call(ruler.current).width;
      if (!width) return;
      capture.call(event.currentTarget, event.pointerId);
      drag.current = { kind, x: event.clientX, width, start, end };
    } catch {
      drag.current = null;
    }
  };
  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => { const current = drag.current; if (!current) return; onRangeChange(moveFinancePeriodRange({ kind: current.kind, origin, last, initialStart: current.start, initialEnd: current.end, initialX: current.x, clientX: event.clientX, width: current.width })); };
  const keyboard = (event: React.KeyboardEvent<HTMLButtonElement>, kind: FinancePeriodDragKind) => { if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return; event.preventDefault(); const step = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 7 : 1); onRangeChange(moveFinancePeriodRange({ kind, origin, last, initialStart: start, initialEnd: end, initialX: 0, clientX: step, width: span })); };
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const result = applyFinancePeriodDraft(draft, domainStart, domainEnd); if ('error' in result) { onValidationError?.(result.error); return; } onRangeChange(result.range); onDatesOpenChange(false); };
  return <>
    <div className="hi-toolbar"><div className="hi-anchor"><FinanceButton aria-expanded={filtersOpen} onClick={() => { onFiltersOpenChange(!filtersOpen); onDatesOpenChange(false); }}>☷ &nbsp; Filters {accountId !== 'all' ? '· 1' : ''} <span>⌄</span></FinanceButton>{filtersOpen && <div className="hi-popover"><label>Account<select aria-label="Filter account" value={accountId} onChange={(event) => onAccountIdChange(event.target.value)}><option value="all">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.label}</option>)}</select></label><p>Internal transfers stay outside cash-flow totals.</p><FinanceButton onClick={() => onFiltersOpenChange(false)}>Done</FinanceButton></div>}</div><div className="hi-toolbar-right"><div className="hi-anchor"><FinanceButton aria-expanded={datesOpen} onClick={() => { onDatesOpenChange(!datesOpen); onFiltersOpenChange(false); }}>▦ &nbsp; {shortDate(range.start)} – {shortDate(range.end)}, {domainEnd.slice(0, 4)} <span>⌄</span></FinanceButton>{datesOpen && <form className="hi-popover hi-date-popover" onSubmit={submit}><label>From<input type="date" min={domainStart} max={domainEnd} value={draft.start} onChange={(event) => onDraftChange({ ...draft, start: event.target.value })} /></label><label>To<input type="date" min={domainStart} max={domainEnd} value={draft.end} onChange={(event) => onDraftChange({ ...draft, end: event.target.value })} /></label>{error && <p role="alert">{error}</p>}<div className="hi-date-actions"><FinanceButton type="button" onClick={() => { onRangeChange(resetFinancePeriodRange(resetRange)); onDatesOpenChange(false); }}>Reset</FinanceButton><FinanceButton type="submit" className="hi-primary">Apply</FinanceButton></div></form>}</div>{onCompareChange ? <FinanceButton className={compare ? 'hi-selected' : ''} aria-pressed={compare} onClick={() => onCompareChange(!compare)}>▣ &nbsp; Compare {compare ? 'on' : 'to'}</FinanceButton> : null}</div></div>
    <div className="hi-ruler-scroll" aria-label="Scrollable finance month timeline"><div className="hi-ruler" ref={ruler} style={timelinePresentation.minimumWidth ? { minWidth: `${timelinePresentation.minimumWidth}px` } : undefined}>{timelinePresentation.years.map((month) => <span className="hi-year" key={month.key} style={{ left: `${(day(month.start) - origin) / span * 100}%` }}>{month.key.slice(0, 4)}</span>)}{months.map((month) => <button className="hi-month" key={month.key} style={{ left: `${(day(month.start) - origin) / span * 100}%`, width: `${(day(month.end) - day(month.start) + 1) / span * 100}%` }} aria-label={`Select ${month.label} ${month.key.slice(0, 4)}`} onClick={(event) => update(event.shiftKey ? Math.min(start, day(month.start)) : day(month.start), event.shiftKey ? Math.max(end, day(month.end)) : day(month.end))}>{month.label}</button>)}<div className="hi-selection" style={{ left: `${(start - origin) / span * 100}%`, width: `${(end - start + 1) / span * 100}%` }}><span className="hi-range-label">{shortDate(range.start)} – {shortDate(range.end)}</span><div className="hi-native-range-clip"><input type="range" className="hi-native-range" min={String(origin)} max={String(Math.max(origin, last - selectedSpan + 1))} value={String(start)} aria-label="Move selected time range with slider" aria-valuetext={`${range.start} through ${range.end}`} title="Drag selected time range" style={nativeRangeStyle} onInput={(event) => onRangeChange(moveFinancePeriodRangeToStart({ origin, last, start, end, nextStart: Number(event.target.value) }))} /></div><button className="hi-range-move" aria-label="Move selected time range with arrow keys" title="Arrow keys move one day · Shift moves seven" onPointerDown={(event) => beginDrag(event, 'move')} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={(event) => keyboard(event, 'move')} />{(['start', 'end'] as const).map((kind) => <button key={kind} className={`hi-handle hi-handle-${kind}`} aria-label={`Resize range ${kind}`} title={`Drag when supported · use arrow keys`} onPointerDown={(event) => beginDrag(event, kind)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={(event) => keyboard(event, kind)} />)}</div></div></div>
  </>;
};
