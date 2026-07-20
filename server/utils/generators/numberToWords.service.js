export function numberToWordsBD(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Taka Zero Only';
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'Taka Zero Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (n) => {
    if (n < 10) return single[n];
    if (n < 20) return double[n - 10];
    const t = Math.floor(n / 10);
    const r = n % 10;
    return tens[t] + (r > 0 ? ' ' + single[r] : '');
  };

  const convertThreeDigits = (n) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let str = '';
    if (h > 0) str += single[h] + ' Hundred';
    if (r > 0) str += (str ? ' ' : '') + convertTwoDigits(r);
    return str;
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore > 0) words += (words ? ' ' : '') + convertThreeDigits(crore) + ' Crore';
  if (lakh > 0) words += (words ? ' ' : '') + convertTwoDigits(lakh) + ' Lakh';
  if (thousand > 0) words += (words ? ' ' : '') + convertThreeDigits(thousand) + ' Thousand';
  if (hundred > 0) words += (words ? ' ' : '') + convertThreeDigits(hundred);

  return words ? `Taka ${words} Only` : 'Taka Zero Only';
}
