/**
 * Formats a numeric value with standard comma separators (South Asian / International locale).
 * Example: formatCurrency(121300) => "৳1,21,300"
 */
export function formatCurrency(amount, currencySymbol = '৳', locale = 'en-IN') {
  const num = Number(amount) || 0;
  try {
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(num);
    return `${currencySymbol}${formatted}`;
  } catch {
    return `${currencySymbol}${num.toLocaleString()}`;
  }
}

export function formatNumber(amount, locale = 'en-IN') {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return num.toLocaleString();
  }
}
