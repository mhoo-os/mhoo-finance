type TimelineMonth = Readonly<{ key: string }>;

/** Keeps a one-year ruler reference-sized and gives multi-year rulers a readable scroll width. */
export const financeTimelinePresentation = <T extends TimelineMonth>(months: readonly T[]) => {
  const years = months.filter((month, index) => index === 0 || month.key.slice(0, 4) !== months[index - 1]?.key.slice(0, 4));
  return { years, minimumWidth: years.length > 1 ? months.length * 48 : undefined };
};
