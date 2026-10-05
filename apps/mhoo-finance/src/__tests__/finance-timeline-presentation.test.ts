import { describe, expect, it } from 'vitest';

import { financeTimelinePresentation } from '../components/finance-ui/finance-timeline-presentation';

describe('finance timeline presentation', () => {
  it('keeps the approved one-year ruler at its natural width', () => {
    const months = Array.from({ length: 12 }, (_, index) => ({ key: `2026-${String(index + 1).padStart(2, '0')}` }));

    expect(financeTimelinePresentation(months)).toEqual({ years: [months[0]], minimumWidth: undefined });
  });

  it('uses readable multi-year month columns and one marker per year', () => {
    const months = ['2021-01', '2021-02', '2022-01', '2022-02', '2023-01'].map((key) => ({ key }));

    expect(financeTimelinePresentation(months)).toEqual({
      years: [months[0], months[2], months[4]],
      minimumWidth: 240,
    });
  });
});
