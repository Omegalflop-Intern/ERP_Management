import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { numberToWordsBD } from '../utils/generators/numberToWords.service.js';
import { generateBarcodeBuffer } from '../utils/generators/barcode.service.js';
import { generateQRCodeBuffer } from '../utils/generators/qrcode.service.js';
import { calculateInvoiceFinancials } from '../utils/generators/calculation.service.js';
import { getAllSettings } from '../modules/settings/settings.service.js';

const BDT = (n) => `Tk ${Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export async function generateInvoicePdfBuffer(sale) {
  return new Promise(async (resolve, reject) => {
    try {
      // Load dynamic ERP settings from database (tenant-specific, falls back to global defaults)
      const dbSettings = await getAllSettings(undefined, sale?.tenantId || null).catch(() => ({}));

      const companyInfo = {
        name: dbSettings.companyName || 'OMNIMANAGE STORE',
        slogan: dbSettings.companySlogan || 'Your Trusted Mobile & Electronics Partner',
        address: dbSettings.companyAddress || 'Dhanmondi, Dhaka, Bangladesh',
        phone: dbSettings.companyPhone || '+880 1700-000000',
        email: dbSettings.companyEmail || 'sales@omnimanage.bd',
        binVat: dbSettings.binVat || 'BIN: 004829103-0101',
        invoiceFooter: dbSettings.invoiceFooter || 'Thank you for shopping with us!',
      };

      const doc = new PDFDocument({
        size: 'A4',
        margin: 35,
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const financials = calculateInvoiceFinancials(sale);

      // Pre-generate Barcode & QR Code PNG buffers
      const barcodeBuffer = await generateBarcodeBuffer(sale.invoiceNumber);
      const qrData = JSON.stringify({
        inv: sale.invoiceNumber,
        tot: financials.netTotal,
        dt: sale.createdAt,
        shop: companyInfo.name,
      });
      const qrBuffer = await generateQRCodeBuffer(qrData);

      const startX = 35;
      const endX = 560;
      const contentWidth = 525; // 560 - 35
      let y = 35;

      // ------------------------------------------------------------------
      // 1. TOP HEADER & BRANDING (DYNAMIC LOGO OR NAME)
      // ------------------------------------------------------------------
      let headerTextX = startX;
      let resolvedLogoPath = null;
      if (dbSettings.companyLogo) {
        const rawLogo = dbSettings.companyLogo.replace(/^[/\\]+/, '');
        const searchPaths = [
          path.resolve(process.cwd(), rawLogo),
          path.resolve(process.cwd(), 'server', rawLogo),
          path.resolve(process.cwd(), 'uploads', rawLogo.replace(/^uploads[/\\]/, '')),
          path.resolve(process.cwd(), 'server', 'uploads', rawLogo.replace(/^uploads[/\\]/, '')),
          path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../uploads', rawLogo.replace(/^uploads[/\\]/, '')),
        ];
        for (const p of searchPaths) {
          if (fs.existsSync(p)) {
            resolvedLogoPath = p;
            break;
          }
        }
      }

      if (resolvedLogoPath) {
        try {
          doc.image(resolvedLogoPath, startX, y - 2, { fit: [60, 24] });
          headerTextX = startX + 68;
        } catch (err) {
          console.error('Error embedding logo image in PDF:', err);
        }
      }

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(16).text(companyInfo.name, headerTextX, y);
      const nameWidth = doc.widthOfString(companyInfo.name);
      doc.roundedRect(headerTextX + nameWidth + 6, y + 2, 50, 12, 3).fill('#0F172A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(6).text('RETAIL ERP', headerTextX + nameWidth + 10, y + 5);
      y += 22;

      if (companyInfo.slogan) {
        doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(companyInfo.slogan, startX, y);
        y += 11;
      }
      if (companyInfo.address) {
        doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text(companyInfo.address, startX, y);
        y += 11;
      }
      const contactLine = [
        companyInfo.phone && `Phone: ${companyInfo.phone}`,
        companyInfo.email && `Email: ${companyInfo.email}`,
        companyInfo.binVat && `${companyInfo.binVat}`,
      ].filter(Boolean).join('  •  ');
      if (contactLine) {
        doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text(contactLine, startX, y);
      }

      // Top Right: Retail Invoice Badge & Metadata
      const rightMetaX = 420;
      const rightMetaY = 35;

      doc.roundedRect(rightMetaX, rightMetaY, 140, 18, 4).fill('#0F172A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5).text('RETAIL INVOICE', rightMetaX, rightMetaY + 5, { width: 140, align: 'center' });

      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(6.5).text('INVOICE NO', rightMetaX, rightMetaY + 23, { width: 140, align: 'right' });
      doc.fillColor('#0F172A').font('Courier-Bold').fontSize(12).text(sale.invoiceNumber || 'INV-0000', rightMetaX, rightMetaY + 31, { width: 140, align: 'right' });

      const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-BD', { month: 'short', day: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString();
      const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString();

      doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(`Date: ${dateStr}`, rightMetaX, rightMetaY + 46, { width: 140, align: 'right' });
      doc.text(`Time: ${timeStr}`, rightMetaX, rightMetaY + 56, { width: 140, align: 'right' });
      if (sale.cashierUsername) {
        doc.fillColor('#64748B').fontSize(7).text(`Served By: ${sale.cashierUsername}`, rightMetaX, rightMetaY + 66, { width: 140, align: 'right' });
      }

      // Full Width Horizontal Divider Line
      y = 112;
      doc.strokeColor('#0F172A').lineWidth(1.2).moveTo(startX, y).lineTo(endX, y).stroke();

      // ------------------------------------------------------------------
      // 2. CUSTOMER DETAILS & PAID STATUS STAMP
      // ------------------------------------------------------------------
      y += 10;

      // Customer Card (Left)
      const custWidth = 350;
      doc.roundedRect(startX, y, custWidth, 48, 5).fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(6.5).text('CUSTOMER DETAILS / BILL TO', startX + 10, y + 8);
      doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(startX + 10, y + 18).lineTo(startX + custWidth - 10, y + 18).stroke();

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(sale.customerName || sale.customerId?.name || 'Walk-in Customer', startX + 10, y + 23);
      doc.fillColor('#475569').font('Courier').fontSize(8).text(`Phone: ${sale.customerPhone || sale.customerId?.phone || 'N/A'}`, startX + 10, y + 35);

      if (sale.customerAddress || sale.customerId?.address) {
        doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(`Address: ${sale.customerAddress || sale.customerId?.address}`, startX + 180, y + 23, { width: 150 });
      }

      // Status Stamp (Right)
      const stampX = 415;
      const stampWidth = 145;
      doc.lineWidth(1.8);
      if (financials.dueAmount <= 0) {
        doc.roundedRect(stampX, y + 2, stampWidth, 42, 5).fillAndStroke('#ECFDF5', '#10B981');
        doc.fillColor('#10B981').font('Helvetica-Bold').fontSize(15).text('PAID', stampX, y + 15, { width: stampWidth, align: 'center' });
      } else {
        doc.roundedRect(stampX, y + 2, stampWidth, 42, 5).fillAndStroke('#FFF1F2', '#E11D48');
        doc.fillColor('#E11D48').font('Helvetica-Bold').fontSize(13).text(financials.statusLabel, stampX, y + 11, { width: stampWidth, align: 'center' });
        doc.fillColor('#E11D48').font('Helvetica-Bold').fontSize(7.5).text(`Due: Tk ${financials.dueAmount.toLocaleString()}`, stampX, y + 27, { width: stampWidth, align: 'center' });
      }

      // ------------------------------------------------------------------
      // 3. PRODUCTS DATA TABLE
      // ------------------------------------------------------------------
      y += 58;

      const col = [
        { label: '#', x: startX, width: 25, align: 'center' },
        { label: 'PRODUCT & SPECIFICATION', x: startX + 25, width: 170, align: 'left' },
        { label: 'IMEI / SERIAL NUMBER', x: startX + 195, width: 120, align: 'left' },
        { label: 'WARRANTY', x: startX + 315, width: 60, align: 'center' },
        { label: 'QTY', x: startX + 375, width: 30, align: 'center' },
        { label: 'UNIT PRICE', x: startX + 405, width: 60, align: 'right' },
        { label: 'TOTAL', x: startX + 465, width: 60, align: 'right' },
      ];

      // Header Row
      const headerHeight = 20;
      doc.roundedRect(startX, y, contentWidth, headerHeight, 3).fill('#0F172A');

      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
      col.forEach((c) => {
        doc.text(c.label, c.x + 4, y + 6, { width: c.width - 8, align: c.align });
      });

      y += headerHeight;

      // Table Body Rows
      financials.lineItems.forEach((item, index) => {
        const rowHeight = item.imeiOrSerial ? 28 : 22;

        if (index % 2 === 1) {
          doc.rect(startX, y, contentWidth, rowHeight).fill('#F8FAFC');
        }

        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(startX, y, contentWidth, rowHeight).stroke();

        const p = item.productId || {};
        const description = item.description || p.name || 'Mobile Phone Item';
        const brandModel = [p.brand, p.model].filter(Boolean).join(' ');
        const specs = [p.ram && `${p.ram} RAM`, p.storage && `${p.storage} Storage`, p.color].filter(Boolean).join(' • ');

        // #
        doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text((index + 1).toString(), col[0].x + 4, y + 7, { width: col[0].width - 8, align: 'center' });

        // Description
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8).text(description, col[1].x + 4, y + 5, { width: col[1].width - 8 });
        if (brandModel || specs) {
          const specText = [brandModel, specs].filter(Boolean).join(' • ');
          doc.fillColor('#64748B').font('Helvetica').fontSize(6.5).text(specText, col[1].x + 4, y + 14, { width: col[1].width - 8 });
        }

        // IMEI
        if (item.imeiOrSerial) {
          doc.roundedRect(col[2].x + 4, y + 6, 110, 13, 2).fillAndStroke('#F1F5F9', '#CBD5E1');
          doc.fillColor('#0F172A').font('Courier-Bold').fontSize(7).text(`IMEI: ${item.imeiOrSerial}`, col[2].x + 8, y + 9);
        } else {
          doc.fillColor('#94A3B8').font('Helvetica-Oblique').fontSize(7).text('Bulk Product (No IMEI)', col[2].x + 4, y + 7);
        }

        // Warranty
        const warrantyStr = p.defaultWarrantyMonths ? `${p.defaultWarrantyMonths} Months` : '1 Year Official';
        doc.fillColor('#334155').font('Helvetica').fontSize(7.5).text(warrantyStr, col[3].x + 4, y + 7, { width: col[3].width - 8, align: 'center' });

        // Qty
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8).text(item.qty.toString(), col[4].x + 4, y + 7, { width: col[4].width - 8, align: 'center' });

        // Unit Price
        doc.fillColor('#334155').font('Helvetica').fontSize(7.5).text(BDT(item.unitPrice), col[5].x + 4, y + 7, { width: col[5].width - 8, align: 'right' });

        // Line Total
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8).text(BDT(item.totalPrice), col[6].x + 4, y + 7, { width: col[6].width - 8, align: 'right' });

        y += rowHeight;
      });

      // ------------------------------------------------------------------
      // 4. FINANCIAL SUMMARY & AMOUNT IN WORDS
      // ------------------------------------------------------------------
      y += 10;

      const leftColWidth = 310;
      
      // Payment Method Box
      const payText = [];
      if (financials.cash > 0) payText.push(`Cash (Tk ${financials.cash.toLocaleString()})`);
      if (financials.bkash > 0) payText.push(`bKash (Tk ${financials.bkash.toLocaleString()})`);
      if (financials.rocket > 0) payText.push(`Rocket (Tk ${financials.rocket.toLocaleString()})`);
      if (financials.nagad > 0) payText.push(`Nagad (Tk ${financials.nagad.toLocaleString()})`);
      if (financials.bank > 0) payText.push(`Bank (Tk ${financials.bank.toLocaleString()})`);
      const payStr = payText.length > 0 ? payText.join(', ') : 'Cash';

      doc.roundedRect(startX, y, leftColWidth, 32, 5).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(6.5).text('PAYMENT METHOD / RECEIVED VIA', startX + 10, y + 7);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8).text(payStr, startX + 10, y + 17, { width: leftColWidth - 20 });

      // Amount in Words Box
      const wordsY = y + 38;
      const wordsStr = numberToWordsBD(financials.netTotal);
      doc.roundedRect(startX, wordsY, leftColWidth, 34, 5).fillAndStroke('#F1F5F9', '#CBD5E1');
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(6.5).text('AMOUNT IN WORDS', startX + 10, wordsY + 7);
      doc.fillColor('#0F172A').font('Helvetica-BoldOblique').fontSize(8.5).text(wordsStr, startX + 10, wordsY + 17, { width: leftColWidth - 20 });

      // Right Column (Totals Calculation Card with Extra Bottom Padding)
      const rightCardX = 360;
      const rightCardWidth = 200;
      const cardHeight = financials.dueAmount > 0 ? 86 : 76;
      doc.roundedRect(rightCardX, y, rightCardWidth, cardHeight, 6).fillAndStroke('#F8FAFC', '#CBD5E1');

      let calcY = y + 8;
      // Subtotal
      doc.fillColor('#475569').font('Helvetica').fontSize(8).text('Subtotal', rightCardX + 10, calcY);
      doc.text(BDT(financials.subTotal), rightCardX + 100, calcY, { width: 90, align: 'right' });
      calcY += 12;

      // Discount
      if (financials.discount > 0) {
        doc.fillColor('#E11D48').font('Helvetica').fontSize(8).text('Special Discount', rightCardX + 10, calcY);
        doc.text(`-${BDT(financials.discount)}`, rightCardX + 100, calcY, { width: 90, align: 'right' });
        calcY += 12;
      }

      // Tax / VAT
      if (financials.tax > 0) {
        doc.fillColor('#475569').font('Helvetica').fontSize(8).text('VAT / Govt Tax', rightCardX + 10, calcY);
        doc.text(`+${BDT(financials.tax)}`, rightCardX + 100, calcY, { width: 90, align: 'right' });
        calcY += 12;
      }

      // GRAND TOTAL (Dark Bar)
      doc.roundedRect(rightCardX + 6, calcY - 2, rightCardWidth - 12, 17, 3).fill('#0F172A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5).text('GRAND TOTAL', rightCardX + 12, calcY + 3);
      doc.text(BDT(financials.netTotal), rightCardX + 90, calcY + 3, { width: 92, align: 'right' });
      calcY += 21;

      // Total Paid
      doc.fillColor('#059669').font('Helvetica-Bold').fontSize(8).text('Total Paid', rightCardX + 10, calcY);
      doc.text(BDT(financials.totalPaid), rightCardX + 100, calcY, { width: 90, align: 'right' });

      // Balance Due
      if (financials.dueAmount > 0) {
        calcY += 12;
        doc.fillColor('#E11D48').font('Helvetica-Bold').fontSize(8).text('Balance Due', rightCardX + 10, calcY);
        doc.text(BDT(financials.dueAmount), rightCardX + 100, calcY, { width: 90, align: 'right' });
      }

      // ------------------------------------------------------------------
      // 5. WARRANTY & RETURN TERMS BOX (PINNED TO PAGE BOTTOM)
      // ------------------------------------------------------------------
      const termsY = Math.max(y + cardHeight + 15, 665);
      doc.roundedRect(startX, termsY, contentWidth, 38, 5).fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(7.5).text('WARRANTY & RETURN TERMS', startX + 10, termsY + 6);
      doc.fillColor('#475569').font('Helvetica').fontSize(6.5);
      doc.text('1. Original receipt and intact IMEI/serial label are required for all warranty claims.', startX + 10, termsY + 15);
      doc.text('2. Warranty covers hardware manufacturing defects only. Software, liquid damage, or physical abuse is strictly excluded.', startX + 10, termsY + 22);
      doc.text('3. Goods once sold are non-refundable after 7 days from invoice date.', startX + 10, termsY + 29);

      // ------------------------------------------------------------------
      // 6. FOOTER: SIGNATURES, BARCODE & QR CODE (PINNED FIXED AT BOTTOM)
      // ------------------------------------------------------------------
      const sigY = Math.max(termsY + 50, 740);
      doc.strokeColor('#0F172A').lineWidth(0.5);

      // Customer Signature
      doc.moveTo(startX, sigY).lineTo(startX + 140, sigY).dash(3, { space: 2 }).stroke().undash();
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(7.5).text('Customer Signature', startX, sigY + 4, { width: 140, align: 'center' });

      // Barcode Image
      if (barcodeBuffer) {
        doc.image(barcodeBuffer, startX + 180, sigY - 12, { width: 155, height: 28 });
      }

      // Authorized Signature
      doc.moveTo(endX - 140, sigY).lineTo(endX, sigY).dash(3, { space: 2 }).stroke().undash();
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(7.5).text('Authorized Signature & Seal', endX - 140, sigY + 4, { width: 140, align: 'center' });

      // Bottom Metadata Bar (Dynamic Company Info & Custom Footer Note)
      const bottomY = Math.max(sigY + 38, 785);
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(startX, bottomY).lineTo(endX, bottomY).stroke();

      const printTimeStr = new Date().toLocaleString('en-BD');
      doc.fillColor('#64748B').font('Helvetica').fontSize(6.5).text(`Printed on: ${printTimeStr} | ${companyInfo.invoiceFooter} • Powered by OmniManage ERP Suite`, startX, bottomY + 5);

      if (qrBuffer) {
        doc.image(qrBuffer, endX - 22, bottomY + 2, { width: 18, height: 18 });
      }

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(6.5).text(companyInfo.name, endX - 135, bottomY + 6, { width: 100, align: 'right' });
      doc.fillColor('#64748B').font('Helvetica').fontSize(5.5).text('Scan to verify invoice', endX - 135, bottomY + 13, { width: 100, align: 'right' });

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
}
