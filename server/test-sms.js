import './config/env.config.js';

import { sendSMS, sendCustomerInvoiceSMS } from './config/sms.js';

const phone = process.argv[2] || '8801764623083';
const message = process.argv[3] || 'Test SMS from Brothers Mobile ERP';

async function main() {
  console.log(`Sending to: ${phone}`);
  console.log(`Message: ${message}`);
  console.log('---');

  const result = await sendSMS(phone, message);
  console.log('Result:', JSON.stringify(result, null, 2));

  console.log('\n--- Testing invoice SMS ---');
  const invoiceResult = await sendCustomerInvoiceSMS(phone, 'Salah Uddin', 'INV-2026-00001', 45000, 'abc123token');
  console.log('Invoice SMS Result:', JSON.stringify(invoiceResult, null, 2));
}

main().catch(console.error);
