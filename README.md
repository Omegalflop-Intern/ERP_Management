<div align="center">

# Brothers Mobile Shop ERP

### Complete Enterprise Resource Planning System for Mobile Shop Management

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=for-the-badge)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Policy-red.svg?style=for-the-badge)](SECURITY.md)
[![Contributing](https://img.shields.io/badge/Contributing-Guide-green.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Documentation PDF](https://img.shields.io/badge/PDF_Guide-Download-purple.svg?style=for-the-badge)](MOBILE_SHOP_ERP_SYSTEM_GUIDE.pdf)

</div>

---

## Overview

**Brothers Mobile Shop ERP** is a full-stack enterprise resource planning system built specifically for mobile phone retail and wholesale businesses. It covers sales, inventory, IMEI serial tracking, employee management, CRM, double-entry accounting, repair tracking, multi-branch operations, and more — with a modern React UI featuring 7 customizable design modes.

> 📄 **Complete System PDF Guide:** For offline review, architecture breakdown, and end-to-end API documentation, download **[MOBILE_SHOP_ERP_SYSTEM_GUIDE.pdf](MOBILE_SHOP_ERP_SYSTEM_GUIDE.pdf)**.

---

## System Access & Default Credentials

| Component | URL / Endpoint | Details |
|-----------|----------------|---------|
| **Client Frontend Application** | `http://localhost:3000` | React 18 + Vite 5 Dashboard |
| **Backend REST API** | `http://localhost:5000/api/v1` | Node.js 20 + Express 4 ESM Server |
| **Interactive Swagger API Docs** | `http://localhost:5000/api/docs` | Live Swagger UI Documentation |
| **Database** | `mongodb://127.0.0.1:27017/mobile_shop_erp` | MongoDB 7 Connection |

### Default Credentials (after seeding)
- **Admin Username:** `admin` (Password configured via `SEED_PASSWORD_ADMIN` in `server/.env`)
- **Manager Username:** `manager` (Password configured via `SEED_PASSWORD_MANAGER` in `server/.env`)

---

## Core Features Breakdown

### 📱 Sales & Point of Sale (POS)
- POS interface with barcode scanner & instant IMEI search
- Professional invoice generation with PDF export
- Sales returns and customer refunds management
- Wholesale order processing with custom volume pricing tiers
- Thermal receipt printer compatibility

### 📦 Inventory & IMEI Tracking
- Product catalog organized by categories, brands, and models
- Real-time stock levels with multi-branch stock transfers
- Automated low-stock alerts and email notifications
- Unique IMEI serial number tracking per device
- Device IMEI lifecycle status: `In Stock` &rarr; `Sold` &rarr; `In Repair` &rarr; `Returned`
- Bulk Excel/CSV import for products and IMEI serials

### 🛠️ Device Repair Management
- Job sheet creation for customer device repairs
- Diagnostic issues tracking and estimated cost computation
- Real-time repair status updates (`Received`, `In Progress`, `Repaired`, `Delivered`)
- Repair billing linked directly to accounting revenue

### 👥 HR, Attendance & Payroll
- Employee management with role-based access control (RBAC)
- Daily attendance check-in / check-out with automatic hours calculation
- Leave application submission with multi-level approval flow
- Monthly payroll generation with itemized salary slips

### 💰 Accounting & Finance
- Double-entry Chart of Accounts
- General Ledger & Journal entries
- Trial Balance, Profit & Loss (P&L), and Balance Sheet statements
- Expense tracking with customized expense categories
- Loan management and investor profit-sharing calculations

### 📊 Business Analytics & Reports
- Interactive charts for sales revenue and profit margins
- Top-selling products and slow-moving inventory reports
- Employee sales performance metrics
- System audit activity logs

---

## 🛠️ Complete REST API Modules (26 Modules)

All REST endpoints are prefix-routed under `http://localhost:5000/api/v1`:

| Module | Base Path | Description |
|--------|-----------|-------------|
| **Auth** | `/auth` | Direct login (`/login-direct`), OTP verification, password reset, logout |
| **User & Role** | `/users`, `/roles` | User accounts, RBAC permissions matrix |
| **Catalog** | `/catalog` | Categories, brands, models, and measurement units |
| **Product** | `/products` | Product details, pricing, variants, cost margins |
| **IMEI Tracker** | `/imei` | Serial tracking, status flow, IMEI history passport |
| **Stock** | `/stock` | Inventory stock counts, low stock alerts, branch transfers |
| **Supplier** | `/suppliers` | Supplier profiles, purchases, due balances |
| **Purchase** | `/purchases` | Purchase orders, incoming inventory intake |
| **Sale (POS)** | `/sales` | Retail sales, POS transactions, invoice generation |
| **Wholesale** | `/wholesale` | Bulk orders, customized volume discount tiers |
| **Customer (CRM)** | `/customers` | Customer history, due collections, CRM logs |
| **Warranty** | `/warranties` | Warranty claim validation and replacement tracking |
| **Repair** | `/repairs` | Device repair job sheets, technician assignments |
| **Accounting** | `/accounting` | Journal entries, ledger, P&L, balance sheet |
| **Expense** | `/expenses` | Office expenses, category vouchers |
| **Investor** | `/investors` | Investor capital and profit share distribution |
| **Loan** | `/loans` | Business loan records, interest, repayment schedules |
| **Employee** | `/employees` | Staff directory, roles, compensation info |
| **Attendance** | `/attendance` | Daily check-in/out tracking, overtime hours |
| **Leave** | `/leaves` | Leave requests, multi-tier approvals |
| **Payroll** | `/payroll` | Monthly salary calculation, printable pay slips |
| **Branch** | `/branches` | Multi-branch management and branch stock allocations |
| **Settings** | `/settings` | Store configuration, receipt templates, design mode |
| **Notification** | `/notifications` | Live notifications, stock alerts, audit events |
| **SSE** | `/sse` | Server-Sent Events stream for real-time updates |
| **Reports** | `/reports` | Analytics, profit reports, export data |

---

## Getting Started

### Installation

```bash
# Clone repository
git clone https://github.com/Omegalflop-Intern/ERP_Management.git
cd ERP_Management
```

### Server Setup (Terminal 1)

```bash
cd server
npm install

# Create environment config
cp .env.example .env

# Seed default roles, settings & users
npm run seed

# Start server in dev mode (Node --watch)
npm run dev
```
*Backend server runs at `http://localhost:5000`*

### Client Setup (Terminal 2)

```bash
cd client
npm install

# Start Vite dev server
npm run dev
```
*Frontend client runs at `http://localhost:3000`*

---

## Docker Deployment

To build and run all services (MongoDB, Server API, and Client) via Docker:

```bash
docker compose up -d --build
```

---

## Design Themes

The application includes 7 built-in design modes (accessible via the topbar mode switcher):

- **Flat**: Minimal corporate UI
- **Neumorphism**: Soft extruded tactile surfaces
- **Glassmorphism & Glassmorphism Pro**: Frosted glass backdrop blur with gradient borders
- **Liquid Glass**: Translucent fluid glass design
- **Neo Brutalism**: Bold borders with retro offset box shadows
- **Aurora**: Dynamic glowing gradient backgrounds

---

## License

Licensed under the [AGPL v3 License](LICENSE).

<div align="center">
  <b>Built with React 18, Node.js 20, and MongoDB 7</b>
</div>
