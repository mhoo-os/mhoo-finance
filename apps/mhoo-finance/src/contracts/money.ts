/** Wire values are decimal integer strings, never JSON numbers or floats. */
export const MAX_MINOR = 9_223_372_036_854_775_807n;
const EXPONENTS = { USD: 2, THB: 2, EUR: 2, GBP: 2, JPY: 0, KWD: 3 } as const;
export type Currency = keyof typeof EXPONENTS;
export type Money = { currency: Currency; minor: string };
export type SignConvention = 'INFLOW_POSITIVE' | 'OUTFLOW_POSITIVE';

export function currency(value: unknown): Currency {
  if (
    typeof value !== 'string' ||
    !Object.prototype.hasOwnProperty.call(EXPONENTS, value)
  )
    throw new Error('Unsupported or ambiguous currency');
  return value as Currency;
}

export function minor(value: unknown): bigint {
  if (typeof value !== 'string' || !/^(0|-?[1-9]\d{0,18})$/.test(value))
    throw new Error('Minor units must be canonical integer text');
  const result = BigInt(value);
  if (result > MAX_MINOR || result < -MAX_MINOR)
    throw new Error('Money overflow');
  return result;
}

export function sourceMoney(
  amount: unknown,
  code: unknown,
  sign: unknown,
): Money {
  const unit = currency(code);
  if (sign !== 'INFLOW_POSITIVE' && sign !== 'OUTFLOW_POSITIVE')
    throw new Error('Ambiguous sign convention');
  if (
    typeof amount !== 'string' ||
    amount.length > 24 ||
    !/^-?(0|[1-9]\d*)(\.\d+)?$/.test(amount)
  )
    throw new Error('Source amount must be unambiguous decimal text');
  const [whole, fraction = ''] = amount.replace(/^-/, '').split('.');
  const exponent = EXPONENTS[unit];
  if (fraction.length > exponent) throw new Error('Unsupported precision');
  let value = BigInt(whole + fraction.padEnd(exponent, '0'));
  if (amount.startsWith('-')) value = -value;
  if (sign === 'OUTFLOW_POSITIVE') value = -value;
  return { currency: unit, minor: minor(value.toString()).toString() };
}

export function legacyCents(value: number, code: Currency): Money {
  if (EXPONENTS[currency(code)] !== 2 || !Number.isSafeInteger(value))
    throw new Error('Legacy cents cannot be represented losslessly');
  return { currency: code, minor: minor(String(value)).toString() };
}

export function sumMoney(values: readonly Money[], code: Currency): Money {
  currency(code);
  let total = 0n;
  for (const value of values) {
    if (value.currency !== code) throw new Error('Mixed currency aggregation');
    total += minor(value.minor);
  }
  return { currency: code, minor: minor(total.toString()).toString() };
}

/** Exact, locale-neutral display that never converts minor units to Number. */
export function formatMoney(value: Money): string {
  const unit = currency(value.currency);
  const amount = minor(value.minor);
  const exponent = EXPONENTS[unit];
  const absolute = amount < 0n ? -amount : amount;
  const digits = absolute.toString().padStart(exponent + 1, '0');
  const whole = exponent === 0 ? digits : digits.slice(0, -exponent);
  const fraction = exponent === 0 ? '' : `.${digits.slice(-exponent)}`;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0n ? '-' : ''}${unit} ${grouped}${fraction}`;
}

/** CSV readers and notebooks MUST retain these columns as strings (Python int). */
export function moneyCsv(value: Money): string {
  currency(value.currency);
  minor(value.minor);
  return `currency,minor\n${value.currency},${value.minor}\n`;
}
export function readMoneyCsv(value: string): Money {
  const match = /^currency,minor\n([A-Z]{3}),(-?\d+)\n$/.exec(value);
  if (!match) throw new Error('Invalid money CSV');
  return { currency: currency(match[1]), minor: minor(match[2]).toString() };
}
