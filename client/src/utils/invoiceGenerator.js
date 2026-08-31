import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { companyInfo, numberToWordsBD } from '../components/sales/Invoice';
import api from '../lib/api';

const BDT = (n) => `Tk ${Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

// Download PDF directly from backend PDFKit engine stream
export const downloadBackendInvoicePdf = async (saleIdOrToken, invoiceNumber) => {
  try {
    const isToken =
      typeof saleIdOrToken === 'string' &&
      (saleIdOrToken.length > 20 || saleIdOrToken.includes('-'));
    const endpoint = isToken ? `/sales/public/${saleIdOrToken}/pdf` : `/sales/${saleIdOrToken}/pdf`;
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber || 'Invoice'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Backend PDF download error:', error);
    return false;
  }
};

// 100% Bulletproof Native Client-Side Print Engine
export const executeClientPrint = (element, title = 'Invoice', printSize = 'a4full') => {
  window.print();
};

// Generate standard Code128 barcode image as data URL using JsBarcode
const generateBarcode = (text) => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 1.5,
        height: 35,
        displayValue: true,
        fontSize: 10,
        margin: 2,
        background: '#FFFFFF',
        lineColor: '#0F172A',
      });
      resolve(canvas.toDataURL('image/png'));
    } catch {
      resolve(null);
    }
  });
};

const generateQR = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      width: 80,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });
  } catch {
    return null;
  }
};

const getTotalPaid = (sale) => {
  return (
    (sale.paymentBreakdown?.cash || 0) +
    (sale.paymentBreakdown?.bkash || 0) +
    (sale.paymentBreakdown?.rocket || 0) +
    (sale.paymentBreakdown?.nagad || 0) +
    (sale.paymentBreakdown?.bank || 0)
  );
};

// Helper for capturing DOM element directly to PDF for 100% exact visual parity with oklch color fallback
const captureElementToPDF = async (element, pdfFormat, filename) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      onclone: (clonedDoc) => {
        const styleTags = clonedDoc.getElementsByTagName('style');
        for (let i = 0; i < styleTags.length; i++) {
          if (styleTags[i].innerHTML.includes('oklch')) {
            styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/oklch\([^)]+\)/g, '#0f172a');
          }
        }

        const allElems = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElems.length; i++) {
          const el = allElems[i];
          ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
            if (el.style[prop] && el.style[prop].includes('oklch')) {
              el.style[prop] =
                prop === 'backgroundColor'
                  ? '#ffffff'
                  : prop === 'borderColor'
                    ? '#cbd5e1'
                    : '#0f172a';
            }
          });
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    let targetFormat = pdfFormat;

    if (pdfFormat === 'a4') {
      targetFormat = 'a4';
    } else if (pdfFormat === 'a5' || pdfFormat === 'a4half') {
      targetFormat = 'a5';
    } else if (Array.isArray(pdfFormat)) {
      targetFormat = pdfFormat;
    } else if (pdfFormat === 'receipt' || pdfFormat === '80mm') {
      const calcHeight = Math.max(100, Math.round((canvas.height * 80) / canvas.width));
      targetFormat = [80, calcHeight];
    } else if (pdfFormat === 'thermal' || pdfFormat === '58mm') {
      const calcHeight = Math.max(80, Math.round((canvas.height * 58) / canvas.width));
      targetFormat = [58, calcHeight];
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: targetFormat,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('html2canvas capture error:', err);
    return false;
  }
};

// ----------------------------------------------------------------------
// 1. GENERATE A4 FULL SIZE PDF
// ----------------------------------------------------------------------
export const generateA4Invoice = async (sale, element = null) => {
  if (element) {
    const success = await captureElementToPDF(element, 'a4', `${sale.invoiceNumber}-A4.pdf`);
    if (success) return;
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(companyInfo.name, 14, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(companyInfo.slogan, 14, 25);
  const contactParts = [
    companyInfo.phone && `Phone: ${companyInfo.phone}`,
    companyInfo.email && `Email: ${companyInfo.email}`,
    companyInfo.binVat && `${companyInfo.binVat}`,
  ].filter(Boolean);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), 14, 33);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Invoice No: ${sale.invoiceNumber}`, pageWidth - 14, 28, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-BD')}`, pageWidth - 14, 33, {
    align: 'right',
  });
  if (sale.cashierUsername) {
    doc.text(`Served By: ${sale.cashierUsername}`, pageWidth - 14, 37, { align: 'right' });
  }

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(14, 40, pageWidth - 14, 40);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 44, 120, 22, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CUSTOMER DETAILS / BILL TO', 18, 49);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sale.customerName || 'Walk-in Customer', 18, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${sale.customerPhone || 'N/A'}`, 18, 60);
  if (sale.customerAddress) doc.text(`Address: ${sale.customerAddress}`, 70, 60);

  const due = sale.paymentBreakdown?.dueAmount || 0;
  const statusLabel = due <= 0 ? 'PAID' : getTotalPaid(sale) > 0 ? 'PARTIAL' : 'UNPAID';

  doc.setLineWidth(1);
  if (due <= 0) {
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(236, 253, 245);
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setDrawColor(225, 29, 72);
    doc.setFillColor(255, 241, 242);
    doc.setTextColor(225, 29, 72);
  }
  doc.roundedRect(pageWidth - 64, 44, 50, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(statusLabel, pageWidth - 39, 55, { align: 'center' });
  if (due > 0) {
    doc.setFontSize(8);
    doc.text(`Due: Tk ${due.toLocaleString()}`, pageWidth - 39, 61, { align: 'center' });
  }

  const tableData = (sale.lineItems || []).map((item, index) => {
    const p = item.productId || {};
    const specs = [p.brand, p.model, p.storage && `${p.storage}`].filter(Boolean).join(' • ');
    const desc = `${item.description || p.name || 'Mobile Item'}${specs ? `\n(${specs})` : ''}`;
    return [
      index + 1,
      desc,
      item.imeiOrSerial ? `${item.imeiOrSerial}` : 'Bulk (N/A)',
      p.defaultWarrantyMonths ? `${p.defaultWarrantyMonths} Months` : '1 Year Official',
      item.qty,
      BDT(item.unitPrice),
      BDT(item.totalPrice),
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [
      [
        '#',
        'Product & Specification',
        'IMEI / Serial Number',
        'Warranty',
        'Qty',
        'Unit Price',
        'Total',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 55 },
      2: { cellWidth: 38, font: 'courier' },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 23 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable?.finalY || 120;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY + 4, 110, 14, 1, 1, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT METHOD / RECEIVED VIA', 18, finalY + 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Cash: Tk ${(sale.paymentBreakdown?.cash || 0).toLocaleString()}, bKash: Tk ${(sale.paymentBreakdown?.bkash || 0).toLocaleString()}`,
    18,
    finalY + 14
  );

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY + 20, 110, 14, 1, 1, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('AMOUNT IN WORDS', 18, finalY + 25);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(numberToWordsBD(sale.netTotal), 18, finalY + 30);

  const totalPaid = getTotalPaid(sale);
  const rightX = pageWidth - 14;
  let summaryY = finalY + 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', rightX - 50, summaryY + 4, { align: 'right' });
  doc.text(BDT(sale.subTotal), rightX, summaryY + 4, { align: 'right' });

  if (sale.discount > 0) {
    summaryY += 5;
    doc.setTextColor(225, 29, 72);
    doc.text('Discount:', rightX - 50, summaryY + 4, { align: 'right' });
    doc.text(`-${BDT(sale.discount)}`, rightX, summaryY + 4, { align: 'right' });
  }

  if (sale.tax > 0) {
    summaryY += 5;
    doc.setTextColor(71, 85, 105);
    doc.text('VAT / Tax:', rightX - 50, summaryY + 4, { align: 'right' });
    doc.text(`+${BDT(sale.tax)}`, rightX, summaryY + 4, { align: 'right' });
  }

  summaryY += 10;
  doc.setFillColor(15, 23, 42);
  doc.rect(rightX - 65, summaryY - 4, 65, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', rightX - 45, summaryY, { align: 'right' });
  doc.text(BDT(sale.netTotal), rightX - 2, summaryY, { align: 'right' });

  summaryY += 8;
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('Total Paid:', rightX - 50, summaryY, { align: 'right' });
  doc.text(BDT(totalPaid), rightX, summaryY, { align: 'right' });

  if (due > 0) {
    summaryY += 5;
    doc.setTextColor(225, 29, 72);
    doc.text('Balance Due:', rightX - 50, summaryY, { align: 'right' });
    doc.text(BDT(due), rightX, summaryY, { align: 'right' });
  }

  const termsY = pageHeight - 45;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, termsY, pageWidth - 14, termsY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('WARRANTY & RETURN TERMS:', 14, termsY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    '1. Original receipt & intact IMEI sticker required for warranty claims.  2. Software, liquid or physical damage excluded.',
    14,
    termsY + 8
  );

  const barcodeY = pageHeight - 32;
  const barcodeImg = await generateBarcode(sale.invoiceNumber);
  const qrData = JSON.stringify({ inv: sale.invoiceNumber, tot: sale.netTotal });
  const qrImg = await generateQR(qrData);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(14, barcodeY, 54, barcodeY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Customer Signature', 34, barcodeY + 4, { align: 'center' });

  doc.line(pageWidth - 54, barcodeY, pageWidth - 14, barcodeY);
  doc.text('Authorized Signature & Seal', pageWidth - 34, barcodeY + 4, { align: 'center' });

  if (barcodeImg) doc.addImage(barcodeImg, 'PNG', (pageWidth - 40) / 2, barcodeY - 5, 40, 10);
  if (qrImg) doc.addImage(qrImg, 'PNG', pageWidth - 26, barcodeY + 6, 12, 12);

  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Printed on: ${new Date().toLocaleString('en-BD')} | Omni-Manage`, 14, pageHeight - 6);

  doc.save(`${sale.invoiceNumber}-A4.pdf`);
};

// ----------------------------------------------------------------------
// 2. GENERATE HALF A4 (A5: 148mm x 210mm) PDF
// ----------------------------------------------------------------------
export const generateA4HalfInvoice = async (sale, element = null) => {
  if (element) {
    const success = await captureElementToPDF(
      element,
      [148, 210],
      `${sale.invoiceNumber}-A5-Half.pdf`
    );
    if (success) return;
  }

  const doc = new jsPDF({ unit: 'mm', format: [148, 210] });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(companyInfo.name, 10, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${companyInfo.address} | Phone: ${companyInfo.phone}`, 10, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`INVOICE: ${sale.invoiceNumber}`, pageWidth - 10, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-BD')}`, pageWidth - 10, 18, {
    align: 'right',
  });

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, 22, pageWidth - 20, 12, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Customer: ${sale.customerName || 'Walk-in Customer'}`, 13, 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Phone: ${sale.customerPhone || 'N/A'}`, 13, 31);

  const tableData = (sale.lineItems || []).map((item, index) => [
    index + 1,
    `${item.description}${item.imeiOrSerial ? `\nIMEI: ${item.imeiOrSerial}` : ''}`,
    item.qty,
    BDT(item.unitPrice),
    BDT(item.totalPrice),
  ]);

  autoTable(doc, {
    startY: 37,
    head: [['#', 'Item Description / IMEI', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 55 },
      2: { halign: 'center', cellWidth: 10 },
      3: { halign: 'right', cellWidth: 27 },
      4: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = doc.lastAutoTable?.finalY || 80;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const revisedNet = Math.max(0, (sale.netTotal || 0) - (sale.returnedAmount || 0));
  doc.text(`Words: ${numberToWordsBD(revisedNet || sale.netTotal)}`, 10, finalY + 6);

  const rawPaid = getTotalPaid(sale);
  const netPaid = Math.max(0, rawPaid - (sale.returnedAmount || 0));
  const due = sale.paymentBreakdown?.dueAmount || 0;
  const rightX = pageWidth - 10;
  let summaryY = finalY + 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ${BDT(sale.netTotal)}`, rightX, summaryY, { align: 'right' });

  if (sale.returnedAmount > 0) {
    summaryY += 5;
    doc.setTextColor(225, 29, 72);
    doc.text(`Less Refund: -${BDT(sale.returnedAmount)}`, rightX, summaryY, { align: 'right' });
    summaryY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Net Revised Total: ${BDT(revisedNet)}`, rightX, summaryY, { align: 'right' });
  }

  summaryY += 5;
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text(`Net Paid: ${BDT(netPaid)}`, rightX, summaryY, { align: 'right' });

  if (due > 0) {
    summaryY += 5;
    doc.setTextColor(225, 29, 72);
    doc.text(`Balance Due: ${BDT(due)}`, rightX, summaryY, { align: 'right' });
  }

  const sigY = pageHeight - 20;
  doc.setDrawColor(15, 23, 42);
  doc.line(10, sigY, 40, sigY);
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Customer Sig.', 25, sigY + 3, { align: 'center' });

  doc.line(pageWidth - 40, sigY, pageWidth - 10, sigY);
  doc.text('Auth. Seal', pageWidth - 25, sigY + 3, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Thank you for shopping at ${companyInfo.name}!`, pageWidth / 2, pageHeight - 5, {
    align: 'center',
  });

  doc.save(`${sale.invoiceNumber}-A5-Half.pdf`);
};

// ----------------------------------------------------------------------
// 3. GENERATE 80mm RECEIPT PDF
// ----------------------------------------------------------------------
export const generateReceipt80 = async (sale, element = null) => {
  if (element) {
    const success = await captureElementToPDF(element, [80, 200], `${sale.invoiceNumber}-80mm.pdf`);
    if (success) return;
  }

  const w = 80;
  const doc = new jsPDF({ unit: 'mm', format: [w, 297] });
  let y = 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, w / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.slogan, w / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Phone: ${companyInfo.phone}`, w / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(7);
  doc.text(`Inv: ${sale.invoiceNumber}`, 4, y);
  y += 4;
  doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-BD')}`, 4, y);
  y += 4;
  if (sale.customerName) {
    doc.text(`Cust: ${sale.customerName}`, 4, y);
    y += 4;
  }

  doc.setDrawColor(180);
  doc.line(4, y, w - 4, y);
  y += 4;

  (sale.lineItems || []).forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.description, 4, y);
    if (item.imeiOrSerial) {
      y += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.text(`IMEI: ${item.imeiOrSerial}`, 4, y);
    }
    doc.setFont('helvetica', 'normal');
    doc.text(`x${item.qty} @${BDT(item.unitPrice)}`, 4, y + 3.5);
    doc.text(BDT(item.totalPrice), w - 4, y + 3.5, { align: 'right' });
    y += 8;
  });

  doc.line(4, y, w - 4, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`NET TOTAL: ${BDT(sale.netTotal)}`, 4, y);
  y += 5;
  doc.text(`Paid: ${BDT(getTotalPaid(sale))}`, 4, y);
  y += 4;

  const due = sale.paymentBreakdown?.dueAmount || 0;
  if (due > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text(`DUE: ${BDT(due)}`, 4, y);
    y += 5;
  }

  doc.save(`${sale.invoiceNumber}-80mm.pdf`);
};

// ----------------------------------------------------------------------
// 4. GENERATE 58mm THERMAL PDF
// ----------------------------------------------------------------------
export const generateReceipt58 = async (sale, element = null) => {
  if (element) {
    const success = await captureElementToPDF(element, [58, 200], `${sale.invoiceNumber}-58mm.pdf`);
    if (success) return;
  }

  const w = 58;
  const doc = new jsPDF({ unit: 'mm', format: [w, 297] });
  let y = 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, w / 2, y, { align: 'center' });
  y += 4;

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Inv: ${sale.invoiceNumber}`, 3, y);
  y += 3;
  doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-BD')}`, 3, y);
  y += 3;

  (sale.lineItems || []).forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.text((item.description || '').substring(0, 18), 3, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`x${item.qty}`, 3, y + 3);
    doc.text(BDT(item.totalPrice), w - 3, y + 3, { align: 'right' });
    y += 7;
  });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: ${BDT(sale.netTotal)}`, 3, y);

  doc.save(`${sale.invoiceNumber}-58mm.pdf`);
};
