import PDFDocument from 'pdfkit';
import { getAllSettings } from '../modules/settings/settings.service.js';

const BDT = (n) => `Tk ${Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

async function getCompanyInfo(tenantId = null) {
  const dbSettings = await getAllSettings(undefined, tenantId).catch(() => ({}));
  return {
    name: dbSettings.companyName || 'OMNIMANAGE STORE',
    address: dbSettings.companyAddress || 'Dhanmondi, Dhaka, Bangladesh',
    phone: dbSettings.companyPhone || '+880 1700-000000',
  };
}

function drawHeader(doc, company, title, subtitle, dateRange) {
  doc.fontSize(18).font('Helvetica-Bold').text(company.name, { align: 'center' });
  doc.fontSize(9).font('Helvetica').text(company.address, { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(35, doc.y).lineTo(560, doc.y).stroke('#2563EB');
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor('#666').text(subtitle, { align: 'center' });
  if (dateRange) {
    doc.fontSize(8).text(`Period: ${dateRange}`, { align: 'center' });
  }
  doc.fillColor('#000');
  doc.moveDown(1);
}

function drawTableHeader(doc, columns, y) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#fff');
  doc.rect(35, y, 525, 18).fill('#2563EB');
  doc.fillColor('#fff');
  let x = 40;
  for (const col of columns) {
    doc.text(col.label, x, y + 4, { width: col.width, align: col.align || 'left' });
    x += col.width;
  }
  doc.fillColor('#000');
  return y + 18;
}

function drawTableRow(doc, columns, values, y, isBold = false, bgColor = null) {
  if (bgColor) {
    doc.rect(35, y, 525, 16).fill(bgColor);
  }
  doc.fontSize(8).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#000');
  let x = 40;
  for (let i = 0; i < columns.length; i++) {
    const val = values[i] || '';
    doc.text(String(val), x, y + 3, { width: columns[i].width, align: columns[i].align || 'left' });
    x += columns[i].width;
  }
  return y + 16;
}

function drawTotalRow(doc, columns, values, y) {
  doc.rect(35, y, 525, 18).fill('#F3F4F6');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#111');
  let x = 40;
  for (let i = 0; i < columns.length; i++) {
    doc.text(String(values[i] || ''), x, y + 4, { width: columns[i].width, align: columns[i].align || 'left' });
    x += columns[i].width;
  }
  doc.fillColor('#000');
  return y + 18;
}

export async function generateBalanceSheetPdf(data, tenantId = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const company = await getCompanyInfo(tenantId);
      const doc = new PDFDocument({ size: 'A4', margin: 35, bufferPages: true });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawHeader(doc, company, 'Balance Sheet', 'Statement of Financial Position',
        data.asOf ? new Date(data.asOf).toLocaleDateString('BD') : '');

      const columns = [
        { label: 'Code', width: 50 },
        { label: 'Account Name', width: 200 },
        { label: 'Type', width: 80 },
        { label: 'Balance (৳)', width: 100, align: 'right' },
      ];

      let y = doc.y;
      // Assets
      doc.fontSize(10).font('Helvetica-Bold').text('ASSETS', 35, y);
      y += 16;
      y = drawTableHeader(doc, columns, y);
      let totalAssets = 0;
      for (const a of data.assets?.accounts || []) {
        if (y > 750) { doc.addPage(); y = 50; y = drawTableHeader(doc, columns, y); }
        y = drawTableRow(doc, columns, [a.code, a.name, a.type, BDT(a.balance)], y);
        totalAssets += a.balance;
      }
      y = drawTotalRow(doc, columns, ['', 'Total Assets', '', BDT(totalAssets)], y);
      y += 12;

      // Liabilities
      doc.fontSize(10).font('Helvetica-Bold').text('LIABILITIES', 35, y);
      y += 16;
      y = drawTableHeader(doc, columns, y);
      let totalLiab = 0;
      for (const a of data.liabilities?.accounts || []) {
        if (y > 750) { doc.addPage(); y = 50; y = drawTableHeader(doc, columns, y); }
        y = drawTableRow(doc, columns, [a.code, a.name, a.type, BDT(a.balance)], y);
        totalLiab += a.balance;
      }
      y = drawTotalRow(doc, columns, ['', 'Total Liabilities', '', BDT(totalLiab)], y);
      y += 12;

      // Equity
      doc.fontSize(10).font('Helvetica-Bold').text('EQUITY', 35, y);
      y += 16;
      y = drawTableHeader(doc, columns, y);
      let totalEq = 0;
      for (const a of data.equity?.accounts || []) {
        if (y > 750) { doc.addPage(); y = 50; y = drawTableHeader(doc, columns, y); }
        y = drawTableRow(doc, columns, [a.code, a.name, a.type, BDT(a.balance)], y);
        totalEq += a.balance;
      }
      y = drawTotalRow(doc, columns, ['', 'Total Equity', '', BDT(totalEq)], y);
      y += 12;

      // Check
      const balanced = data.balanced;
      doc.fontSize(9).font('Helvetica-Bold')
        .fillColor(balanced ? '#16A34A' : '#DC2626')
        .text(`Accounting Equation: ${balanced ? 'BALANCED' : 'UNBALANCED'}`, 35, y);
      doc.fillColor('#000');

      doc.end();
    } catch (err) { reject(err); }
  });
}

export async function generateProfitLossPdf(data, tenantId = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const company = await getCompanyInfo(tenantId);
      const doc = new PDFDocument({ size: 'A4', margin: 35, bufferPages: true });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const period = data.period ? `${new Date(data.period.from).toLocaleDateString('BD')} - ${new Date(data.period.to).toLocaleDateString('BD')}` : '';
      drawHeader(doc, company, 'Profit & Loss Statement', 'Income Statement', period);

      let y = doc.y;
      const columns = [
        { label: 'Description', width: 300 },
        { label: 'Amount (৳)', width: 120, align: 'right' },
      ];

      y = drawTableHeader(doc, columns, y);
      y = drawTableRow(doc, columns, ['Revenue', ''], y, true);
      y = drawTableRow(doc, columns, ['  Sales Revenue', BDT(data.revenue?.total)], y);
      y = drawTableRow(doc, columns, ['  Returns', `(${BDT(data.revenue?.totalReturns || 0)})`], y);
      y += 4;
      y = drawTableRow(doc, columns, ['Cost of Goods Sold', `(${BDT(data.cogs?.total || 0)})`], y, true);
      y += 4;
      y = drawTotalRow(doc, columns, ['Gross Profit', BDT(data.grossProfit)], y);
      y += 8;

      y = drawTableRow(doc, columns, ['Operating Expenses', ''], y, true);
      for (const exp of data.expenses?.byCategory || []) {
        y = drawTableRow(doc, columns, [`  ${exp.category}`, BDT(exp.total)], y);
      }
      y = drawTableRow(doc, columns, ['  Payroll', BDT(data.expenses?.payroll || 0)], y);
      y += 4;
      y = drawTotalRow(doc, columns, ['Total Expenses', BDT(data.expenses?.total)], y);
      y += 8;

      const isProfit = data.netIncome >= 0;
      doc.rect(35, y, 525, 22).fill(isProfit ? '#DCFCE7' : '#FEE2E2');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(isProfit ? '#16A34A' : '#DC2626')
        .text(`Net ${isProfit ? 'Profit' : 'Loss'}: ${BDT(Math.abs(data.netIncome))}`, 40, y + 6, { width: 500 });
      doc.fillColor('#000');

      doc.end();
    } catch (err) { reject(err); }
  });
}

export async function generateTrialBalancePdf(data, tenantId = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const company = await getCompanyInfo(tenantId);
      const doc = new PDFDocument({ size: 'A4', margin: 35, bufferPages: true });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawHeader(doc, company, 'Trial Balance', 'List of all accounts with balances', '');

      let y = doc.y;
      const columns = [
        { label: 'Code', width: 50 },
        { label: 'Account Name', width: 180 },
        { label: 'Type', width: 80 },
        { label: 'Debit (৳)', width: 100, align: 'right' },
        { label: 'Credit (৳)', width: 100, align: 'right' },
      ];

      y = drawTableHeader(doc, columns, y);
      for (const a of data.accounts || []) {
        if (y > 750) { doc.addPage(); y = 50; y = drawTableHeader(doc, columns, y); }
        y = drawTableRow(doc, columns, [
          a.code, a.name, a.type,
          a.debit ? BDT(a.debit) : '',
          a.credit ? BDT(a.credit) : '',
        ], y);
      }
      y = drawTotalRow(doc, columns, ['', 'TOTAL', '', BDT(data.totalDebit), BDT(data.totalCredit)], y);
      y += 8;

      const balanced = data.balanced;
      doc.fontSize(9).font('Helvetica-Bold')
        .fillColor(balanced ? '#16A34A' : '#DC2626')
        .text(`Status: ${balanced ? 'BALANCED' : 'UNBALANCED'}`, 35, y);

      doc.end();
    } catch (err) { reject(err); }
  });
}

export async function generateCashFlowPdf(data, tenantId = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const company = await getCompanyInfo(tenantId);
      const doc = new PDFDocument({ size: 'A4', margin: 35, bufferPages: true });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const period = data.period ? `${new Date(data.period.from).toLocaleDateString('BD')} - ${new Date(data.period.to).toLocaleDateString('BD')}` : '';
      drawHeader(doc, company, 'Cash Flow Statement', 'Statement of Cash Flows', period);

      let y = doc.y;
      const columns = [
        { label: 'Description', width: 300 },
        { label: 'Amount (৳)', width: 120, align: 'right' },
      ];

      // Operating
      y = drawTableRow(doc, columns, ['OPERATING ACTIVITIES', ''], y, true);
      y = drawTableRow(doc, columns, ['  Cash from Sales', BDT(data.operating?.inflows?.sales)], y);
      y = drawTableRow(doc, columns, ['  Due Collections', BDT(data.operating?.inflows?.dueCollections)], y);
      y = drawTableRow(doc, columns, ['  Repair Services', BDT(data.operating?.inflows?.repairServices)], y);
      y = drawTableRow(doc, columns, ['  Total Operating Inflows', BDT(data.operating?.inflows?.total)], y, true);
      y += 2;
      y = drawTableRow(doc, columns, ['  Expenses Paid', `(${BDT(data.operating?.outflows?.expenses)})`], y);
      y = drawTableRow(doc, columns, ['  Payroll Paid', `(${BDT(data.operating?.outflows?.payroll)})`], y);
      y = drawTableRow(doc, columns, ['  Total Operating Outflows', `(${BDT(data.operating?.outflows?.total)})`], y, true);
      y += 2;
      const opColor = data.operating?.netCashFlow >= 0 ? '#16A34A' : '#DC2626';
      doc.fontSize(9).font('Helvetica-Bold').fillColor(opColor)
        .text(`  Net Operating Cash Flow: ${BDT(data.operating?.netCashFlow)}`, 40, y);
      doc.fillColor('#000');
      y += 16;

      // Investing
      y = drawTableRow(doc, columns, ['INVESTING ACTIVITIES', ''], y, true);
      y = drawTableRow(doc, columns, ['  Asset Purchases', `(${BDT(data.investing?.outflows?.assetPurchases)})`], y);
      const invColor = data.investing?.netCashFlow >= 0 ? '#16A34A' : '#DC2626';
      doc.fontSize(9).font('Helvetica-Bold').fillColor(invColor)
        .text(`  Net Investing Cash Flow: ${BDT(data.investing?.netCashFlow)}`, 40, y);
      doc.fillColor('#000');
      y += 16;

      // Financing
      y = drawTableRow(doc, columns, ['FINANCING ACTIVITIES', ''], y, true);
      y = drawTableRow(doc, columns, ['  Investor Deposits', BDT(data.financing?.inflows?.investorDeposits)], y);
      y = drawTableRow(doc, columns, ['  Loan Disbursements', BDT(data.financing?.inflows?.loanDisbursements)], y);
      y = drawTableRow(doc, columns, ['  Investor Withdrawals', `(${BDT(data.financing?.outflows?.investorWithdrawals)})`], y);
      const finColor = data.financing?.netCashFlow >= 0 ? '#16A34A' : '#DC2626';
      doc.fontSize(9).font('Helvetica-Bold').fillColor(finColor)
        .text(`  Net Financing Cash Flow: ${BDT(data.financing?.netCashFlow)}`, 40, y);
      doc.fillColor('#000');
      y += 16;

      // Net change
      const netColor = data.netCashChange >= 0 ? '#16A34A' : '#DC2626';
      doc.rect(35, y, 525, 22).fill(data.netCashChange >= 0 ? '#DCFCE7' : '#FEE2E2');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(netColor)
        .text(`Net Change in Cash: ${BDT(data.netCashChange)}`, 40, y + 6, { width: 500 });
      doc.fillColor('#000');

      doc.end();
    } catch (err) { reject(err); }
  });
}
