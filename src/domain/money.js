const MAX_MINOR = 9223372036854775807n;
const EXPONENTS = { USD: 2, THB: 2, EUR: 2, GBP: 2, JPY: 0, KWD: 3 };
function currency(value) {
  if (typeof value !== "string" || !Object.prototype.hasOwnProperty.call(EXPONENTS, value))
    throw new Error("Unsupported or ambiguous currency");
  return value;
}
function minor(value) {
  if (typeof value !== "string" || !/^(0|-?[1-9]\d{0,18})$/.test(value))
    throw new Error("Minor units must be canonical integer text");
  const result = BigInt(value);
  if (result > MAX_MINOR || result < -MAX_MINOR)
    throw new Error("Money overflow");
  return result;
}
function sourceMoney(amount, code, sign) {
  const unit = currency(code);
  if (sign !== "INFLOW_POSITIVE" && sign !== "OUTFLOW_POSITIVE")
    throw new Error("Ambiguous sign convention");
  if (typeof amount !== "string" || amount.length > 24 || !/^-?(0|[1-9]\d*)(\.\d+)?$/.test(amount))
    throw new Error("Source amount must be unambiguous decimal text");
  const [whole, fraction = ""] = amount.replace(/^-/, "").split(".");
  const exponent = EXPONENTS[unit];
  if (fraction.length > exponent) throw new Error("Unsupported precision");
  let value = BigInt(whole + fraction.padEnd(exponent, "0"));
  if (amount.startsWith("-")) value = -value;
  if (sign === "OUTFLOW_POSITIVE") value = -value;
  return { currency: unit, minor: minor(value.toString()).toString() };
}
function legacyCents(value, code) {
  if (EXPONENTS[currency(code)] !== 2 || !Number.isSafeInteger(value))
    throw new Error("Legacy cents cannot be represented losslessly");
  return { currency: code, minor: minor(String(value)).toString() };
}
function sumMoney(values, code) {
  currency(code);
  let total = 0n;
  for (const value of values) {
    if (value.currency !== code) throw new Error("Mixed currency aggregation");
    total += minor(value.minor);
  }
  return { currency: code, minor: minor(total.toString()).toString() };
}
function moneyCsv(value) {
  currency(value.currency);
  minor(value.minor);
  return `currency,minor
${value.currency},${value.minor}
`;
}
function readMoneyCsv(value) {
  const match = /^currency,minor\n([A-Z]{3}),(-?\d+)\n$/.exec(value);
  if (!match) throw new Error("Invalid money CSV");
  return { currency: currency(match[1]), minor: minor(match[2]).toString() };
}
export {
  MAX_MINOR,
  currency,
  legacyCents,
  minor,
  moneyCsv,
  readMoneyCsv,
  sourceMoney,
  sumMoney
};
