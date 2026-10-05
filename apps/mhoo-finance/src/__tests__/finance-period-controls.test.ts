import { describe, expect, it } from 'vitest';

import {
  applyFinancePeriodDraft,
  moveFinancePeriodRange,
  moveFinancePeriodRangeToStart,
  resetFinancePeriodRange,
} from '../components/finance-ui/finance-period-controls-behavior';

describe('FinancePeriodControls behavior', () => {
  const domainStart = '2026-01-01';
  const domainEnd = '2026-12-31';

  it('applies a valid date draft and reports an invalid range instead of silently dropping it', () => {
    expect(applyFinancePeriodDraft({ start: '2026-07-01', end: '2026-07-31' }, domainStart, domainEnd)).toEqual({ range: { start: '2026-07-01', end: '2026-07-31' } });
    expect(applyFinancePeriodDraft({ start: '2026-09-01', end: '2026-08-31' }, domainStart, domainEnd)).toEqual({ error: 'Choose a valid range within 2026-01-01 and 2026-12-31.' });
  });

  it('resets Overview to its supplied initial scope, not the whole available domain', () => {
    expect(resetFinancePeriodRange({ start: '2026-06-01', end: '2026-08-31' })).toEqual({ start: '2026-06-01', end: '2026-08-31' });
  });

  it('moves the timeline brush by the exact pointer displacement while preserving its span', () => {
    expect(moveFinancePeriodRange({ kind: 'move', origin: 20_454, last: 20_818, initialStart: 20_605, initialEnd: 20_696, initialX: 100, clientX: 200, width: 730 })).toEqual({ start: '2026-07-21', end: '2026-10-20' });
  });

  it('moves the brush with a host-native range value without changing its selected length', () => {
    expect(moveFinancePeriodRangeToStart({ origin: 20_454, last: 20_818, start: 20_605, end: 20_696, nextStart: 20_700 })).toEqual({ start: '2026-09-04', end: '2026-12-04' });
    expect(moveFinancePeriodRangeToStart({ origin: 20_454, last: 20_818, start: 20_605, end: 20_696, nextStart: 21_000 })).toEqual({ start: '2026-10-01', end: '2026-12-31' });
  });
});
