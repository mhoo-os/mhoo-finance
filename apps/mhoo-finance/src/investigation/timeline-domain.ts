const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const parse = (date: string) => {
  if (!ISO_DATE.test(date)) throw new Error('Invalid ISO date');
  const value = Date.parse(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(value) ||
    new Date(value).toISOString().slice(0, 10) !== date
  )
    throw new Error('Invalid calendar date');
  return value;
};

export const timelineDayOffset = (domainStart: string, date: string) =>
  Math.round((parse(date) - parse(domainStart)) / DAY_MS);

export const timelineDateAt = (domainStart: string, day: number) =>
  new Date(parse(domainStart) + day * DAY_MS).toISOString().slice(0, 10);

export const validTimelineWindow = (
  start: string,
  end: string,
  domainStart: string,
  domainEnd: string,
) => {
  try {
    parse(start);
    parse(end);
    return domainStart <= start && start <= end && end <= domainEnd;
  } catch {
    return false;
  }
};

export const timelineMonthSpan = (domainStart: string, domainEnd: string) =>
  (Number(domainEnd.slice(0, 4)) - Number(domainStart.slice(0, 4))) * 12 +
  Number(domainEnd.slice(5, 7)) -
  Number(domainStart.slice(5, 7)) +
  1;

export const isSparseCoverageGap = (
  previousDate: string,
  nextDate: string,
  thresholdDays = 45,
) => timelineDayOffset(previousDate, nextDate) > thresholdDays;

export const filterInclusiveDates = <T extends { date: string }>(
  rows: readonly T[],
  start: string,
  end: string,
) => rows.filter((row) => row.date >= start && row.date <= end);
