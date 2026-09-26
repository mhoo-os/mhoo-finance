export type FinancePeriodRange = Readonly<{ start: string; end: string }>;
export type FinancePeriodDragKind = 'move' | 'start' | 'end';

const DAY = 86_400_000;
const date = (value: number) => new Date(value * DAY).toISOString().slice(0, 10);

export const validateFinancePeriodRange = (range: FinancePeriodRange, domainStart: string, domainEnd: string) => {
  if (!range.start || !range.end || range.start > range.end || range.start < domainStart || range.end > domainEnd) return `Choose a valid range within ${domainStart} and ${domainEnd}.`;
  return undefined;
};

export const applyFinancePeriodDraft = (draft: FinancePeriodRange, domainStart: string, domainEnd: string) => {
  const error = validateFinancePeriodRange(draft, domainStart, domainEnd);
  return error ? { error } : { range: draft };
};

export const resetFinancePeriodRange = (resetRange: FinancePeriodRange): FinancePeriodRange => ({ ...resetRange });

/** Keeps a selected interval intact when a host-native range input supplies its new start day. */
export const moveFinancePeriodRangeToStart = ({ origin, last, start, end, nextStart }: Readonly<{ origin: number; last: number; start: number; end: number; nextStart: number }>): FinancePeriodRange => {
  const length = Math.max(0, end - start);
  const safeStart = Math.max(origin, Math.min(last - length, nextStart));
  return { start: date(safeStart), end: date(safeStart + length) };
};

export const moveFinancePeriodRange = ({ kind, origin, last, initialStart, initialEnd, initialX, clientX, width }: Readonly<{ kind: FinancePeriodDragKind; origin: number; last: number; initialStart: number; initialEnd: number; initialX: number; clientX: number; width: number }>): FinancePeriodRange => {
  const delta = Math.round((clientX - initialX) / width * Math.max(1, last - origin + 1));
  if (kind === 'move') {
    const step = Math.max(origin - initialStart, Math.min(last - initialEnd, delta));
    return { start: date(initialStart + step), end: date(initialEnd + step) };
  }
  if (kind === 'start') return { start: date(Math.max(origin, Math.min(initialEnd, initialStart + delta))), end: date(initialEnd) };
  return { start: date(initialStart), end: date(Math.min(last, Math.max(initialStart, initialEnd + delta))) };
};
