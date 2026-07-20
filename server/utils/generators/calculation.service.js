export function calculateInvoiceFinancials(sale) {
  let subTotal = 0;
  const lineItems = (sale.lineItems || []).map((item) => {
    const qty = Number(item.qty || 1);
    const unitPrice = Number(item.unitPrice || 0);
    const totalPrice = qty * unitPrice;
    subTotal += totalPrice;
    return {
      ...item.toObject ? item.toObject() : item,
      qty,
      unitPrice,
      totalPrice,
    };
  });

  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const netTotal = subTotal - discount + tax;

  const pb = sale.paymentBreakdown || {};
  const cash = Number(pb.cash || 0);
  const bkash = Number(pb.bkash || 0);
  const rocket = Number(pb.rocket || 0);
  const nagad = Number(pb.nagad || 0);
  const bank = Number(pb.bank || 0);

  const totalPaid = cash + bkash + rocket + nagad + bank;
  const dueAmount = Math.max(0, netTotal - totalPaid);

  let statusLabel = 'PAID';
  if (sale.status === 'RETURNED') statusLabel = 'RETURNED';
  else if (sale.status === 'PARTIALLY_RETURNED') statusLabel = 'PARTIAL RETURN';
  else if (dueAmount > 0) statusLabel = totalPaid > 0 ? 'PARTIAL' : 'UNPAID';

  return {
    subTotal,
    discount,
    tax,
    netTotal,
    cash,
    bkash,
    rocket,
    nagad,
    bank,
    totalPaid,
    dueAmount,
    statusLabel,
    lineItems,
  };
}
