import https from 'https';

const BASE_URL = 'https://localhost:5000/api/v1';
const agent = new https.Agent({ rejectUnauthorized: false });

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      agent,
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPLETE SHOP & PAGE AUDIT FOR USER: salahuddin_1');
  console.log('================================================================\n');

  // 1. Authenticate
  console.log('1️⃣ Authenticating with username: salahuddin_1 ...');
  const loginRes = await request('/auth/login-direct', {
    method: 'POST',
    body: { login: 'salahuddin_1', password: 'Salah5537' }
  });

  if (loginRes.status !== 200 || !loginRes.data?.success) {
    console.error('❌ Login failed:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.data.accessToken || loginRes.data.data.token;
  const user = loginRes.data.data.user;
  console.log(`✅ Logged in successfully!`);
  console.log(`   • Full Name:  ${user.fullName}`);
  console.log(`   • Username:   @${user.username}`);
  console.log(`   • Email:      ${user.email}`);
  console.log(`   • Role:       ${user.role?.name || user.roleName}`);
  console.log(`   • Tenant ID:  ${user.tenantId || user.tenant_id}\n`);

  const results = [];

  const testEndpoint = async (name, path, options = {}) => {
    try {
      const res = await request(path, { ...options, token });
      const ok = res.status >= 200 && res.status < 300 && (res.data?.success !== false);
      let count = 0;
      if (Array.isArray(res.data?.data)) {
        count = res.data.data.length;
      } else if (Array.isArray(res.data?.data?.items)) {
        count = res.data.data.items.length;
      } else if (Array.isArray(res.data?.data?.accounts)) {
        count = res.data.data.accounts.length;
      } else if (Array.isArray(res.data?.data?.orders)) {
        count = res.data.data.orders.length;
      } else if (res.data?.data) {
        count = 1;
      }

      results.push({ name, path, status: res.status, ok, count, error: ok ? null : (res.data?.message || res.text) });
      const statusIcon = ok ? '✅' : '❌';
      console.log(`${statusIcon} [${res.status}] ${name.padEnd(32)} -> ${ok ? `OK (records: ${count})` : `FAILED: ${res.data?.message || res.text}`}`);
      return res.data;
    } catch (err) {
      results.push({ name, path, status: 500, ok: false, count: 0, error: err.message });
      console.log(`❌ [ERR] ${name.padEnd(32)} -> ${err.message}`);
      return null;
    }
  };

  console.log('2️⃣ Auditing All Core ERP Pages & API Services:');
  console.log('----------------------------------------------------------------');
  
  // Dashboard & Analytics
  await testEndpoint('Dashboard Overview', '/reports/dashboard');
  await testEndpoint('Business Analytics', '/reports/analytics?range=30days');
  await testEndpoint('Sales Trend Analytics', '/reports/sales-trend?days=30');
  await testEndpoint('Top Products Report', '/reports/top-products?limit=10');
  await testEndpoint('Customer Analytics Report', '/reports/customers');
  await testEndpoint('Employee Analytics Report', '/reports/employees');
  await testEndpoint('Inventory Report', '/reports/inventory');
  
  // Tenant & Branches
  await testEndpoint('Tenant Shop Profile', '/tenants/me');
  await testEndpoint('Branch & Outlets', '/branches');
  
  // Products, Categories & Inventory
  await testEndpoint('Product Catalog', '/products?limit=20');
  await testEndpoint('Categories & Brands', '/catalog?type=CATEGORY');
  await testEndpoint('Stock Overview', '/stock?limit=20');
  await testEndpoint('IMEI Tracker', '/imei?limit=20');
  
  // Sales & POS
  await testEndpoint('Sales Invoices List', '/sales?limit=20');
  
  // Purchases & Suppliers
  await testEndpoint('Purchase Orders', '/purchase-orders?limit=20');
  await testEndpoint('Supplier Directory', '/suppliers?limit=20');
  
  // Customers & Wholesale
  await testEndpoint('Customer CRM List', '/customers?limit=20');
  await testEndpoint('Customer CRM Stats', '/customers/stats');
  await testEndpoint('Wholesale Orders', '/wholesale/orders?limit=20');
  await testEndpoint('Wholesale Price Rules', '/wholesale/prices?limit=20');
  
  // Service & Warranty
  await testEndpoint('Repair Service Jobs', '/repairs?limit=20');
  await testEndpoint('Warranty Claims', '/warranties?limit=20');
  
  // Accounting & Financials
  await testEndpoint('Chart of Accounts', '/accounting/accounts?limit=200');
  await testEndpoint('Journal Entries Ledger', '/accounting/journal-entries?limit=20');
  await testEndpoint('Trial Balance Report', '/accounting/reports/trial-balance');
  await testEndpoint('Profit & Loss Statement', '/accounting/reports/profit-loss');
  await testEndpoint('Balance Sheet Report', '/accounting/reports/balance-sheet');
  await testEndpoint('Cash Flow Statement', '/accounting/reports/cash-flow');
  
  // Expenses & Operating Costs
  await testEndpoint('Expenses List', '/expenses?limit=20');
  await testEndpoint('Recurring Expenses', '/recurring-expenses?limit=20');
  await testEndpoint('Expense Categories', '/expenses/categories');
  
  // HR & Employees
  await testEndpoint('Employee List', '/employees?limit=20');
  await testEndpoint('Attendance Report', '/attendance/report');
  await testEndpoint('Leave Applications', '/leave');
  await testEndpoint('Payroll Sheets', '/payroll?limit=20');
  
  // Loans & Investors
  await testEndpoint('Shop Loan Portfolios', '/loans?limit=20');
  await testEndpoint('Investor Investments', '/investors?limit=20');
  
  // Administration, Settings & Logs
  await testEndpoint('User Management', '/users?limit=20');
  await testEndpoint('Roles & Permissions', '/roles');
  await testEndpoint('Support Tickets', '/tickets?limit=20');
  await testEndpoint('Document Vault', '/documents?limit=20');
  await testEndpoint('Notification Inbox', '/notifications?limit=15');
  await testEndpoint('Shop General Settings', '/settings');

  console.log('\n================================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`Total Modules & Pages Tested: ${total}`);
  console.log(`Passed:                       ${passed}`);
  console.log(`Failed:                       ${failed}`);
  console.log(`Success Rate:                 ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️ Failed Endpoints Detail:');
    results.filter(r => !r.ok).forEach(f => {
      console.log(`  • ${f.name} [${f.path}]: ${f.error}`);
    });
  } else {
    console.log('\n🌟 ALL 37 ERP MODULES & PAGES ARE 100% OPERATIONAL WITH ZERO ERRORS!');
  }
}

runAudit().catch(console.error);
