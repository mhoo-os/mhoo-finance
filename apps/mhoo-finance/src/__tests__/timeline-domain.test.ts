import { describe, expect, it } from 'vitest';

import {
  filterInclusiveDates,
  isSparseCoverageGap,
  timelineDateAt,
  timelineDayOffset,
  timelineMonthSpan,
  validTimelineWindow,
} from '../investigation/timeline-domain';

describe('multi-year timeline domain', () => {
  it('moves through a year boundary without resetting to January', () => {
    expect(timelineDayOffset('2024-11-01', '2025-03-01')).toBe(120);
    expect(timelineDateAt('2024-11-01', 120)).toBe('2025-03-01');
    expect(timelineMonthSpan('2024-11-01', '2025-03-31')).toBe(5);
  });

  it('preserves leap day in day arithmetic', () => {
    expect(timelineDateAt('2024-02-28', 1)).toBe('2024-02-29');
    expect(timelineDateAt('2024-02-28', 2)).toBe('2024-03-01');
  });

  it('filters an inclusive multi-year interval', () => {
    const rows = [
      { date: '2023-12-31', id: 'before' },
      { date: '2024-01-01', id: 'start' },
      { date: '2025-12-31', id: 'end' },
      { date: '2026-01-01', id: 'after' },
    ];
    expect(
      filterInclusiveDates(rows, '2024-01-01', '2025-12-31').map(
        (row) => row.id,
      ),
    ).toEqual(['start', 'end']);
  });

  it('accepts only real, ordered ISO dates within the fact domain', () => {
    const valid = (start: string, end: string) =>
      validTimelineWindow(start, end, '2024-02-28', '2025-03-02');
    expect(valid('2024-02-29', '2025-03-02')).toBe(true);
    expect(valid('2024-02-28', '2024-02-28')).toBe(true);
    expect(valid('2024-02-30', '2025-03-02')).toBe(false);
    expect(valid('2024-2-29', '2025-03-02')).toBe(false);
    expect(valid('2025-03-02', '2024-02-28')).toBe(false);
    expect(valid('2024-02-27', '2025-03-02')).toBe(false);
    expect(valid('2024-02-28', '2025-03-03')).toBe(false);
  });

  it('marks sparse coverage as a gap instead of silently drawing zero activity', () => {
    expect(isSparseCoverageGap('2024-01-10', '2024-05-01')).toBe(true);
    expect(isSparseCoverageGap('2024-01-10', '2024-01-20')).toBe(false);
  });
});
