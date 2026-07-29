# Product Requirement Document (PRD) — Brothers Mobile Shop ERP

> **Document Version:** 1.0.0 (Production Specification)  
> **Date:** July 2026  
> **System Scope:** Full-Stack Enterprise Resource Planning (ERP), Point of Sale (POS), IMEI Tracker, Service Repairs, HR & Double-Entry Accounting System  
> **Target Stack:** React 18 (Vite 5) + Node.js 20 (ESM) + MongoDB 7  

---

## Table of Contents

1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [User Personas & Role-Based Access Control (RBAC)](#2-user-personas--role-based-access-control-rbac)
3. [System Architecture & Technology Stack](#3-system-architecture--technology-stack)
4. [Comprehensive Functional Specifications (28 Modules)](#4-comprehensive-functional-specifications-28-modules)
5. [Data Models & Entity Schemas](#5-data-models--entity-schemas)
6. [UI/UX Design System & 7 Custom Themes](#6-uiux-design-system--7-custom-themes)
7. [Integrations, SSE Real-Time Engine & Service Specs](#7-integrations-sse-real-time-engine--service-specs)
8. [Non-Functional Requirements (NFRs)](#8-non-functional-requirements-nfrs)
9. [DevOps, Infrastructure & Deployment Architecture](#9-devops-infrastructure--deployment-architecture)
10. [Release Roadmap & Key Metrics (KPIs)](#10-release-roadmap--key-metrics-kpis)

---

## 1. Executive Summary & Product Vision

**Brothers Mobile Shop ERP** is an enterprise-grade ERP system built specifically for mobile phone retailers, authorized service centers, and electronics wholesalers. 

Mobile phone retail operations face unique challenges:
- Individual device tracking via 15-digit serial numbers (IMEI)
- Rapid price fluctuations and multi-tiered wholesale/retail pricing
- Device service management (repair job sheets, diagnostic issues, technician labor, parts billing)
- Multi-branch stock allocation and transfers
- Integrated double-entry accounting and HR payroll

This platform unites POS sales, inventory management, repair job tracking, customer CRM, vendor procurement, HR payroll, and double-entry accounting into a single real-time solution with 7 dynamic UI design modes.

---

## 2. User Personas & Role-Based Access Control (RBAC)

### 2.1 User Personas

1. **Super Admin / Business Owner:** Full system access, audit log review, investor management, branch creation, global settings, financial statements.
2. **Branch Manager:** Store operations, branch inventory counts, staff attendance approvals, local sales oversight, stock transfer requests.
3. **POS Cashier / Sales Executive:** Barcode/IMEI scanning, thermal receipt printing, invoice creation, customer due collections, sales return intake.
4. **Stock & Inventory Specialist:** Catalog maintenance, supplier purchase intake, IMEI serial registration, stock transfer dispatch & verification.
5. **Device Repair Technician:** Repair job sheet diagnosis, labor & parts cost estimation, status updates (`Received` -> `In Progress` -> `Repaired`).
6. **Accountant & HR Manager:** Journal entries, trial balance, P&L generation, loan/investor schedules, staff payroll processing, leave approvals.

### 2.2 Role Permission Matrix (27 System Permissions)

| Permission Scope | Super Admin | Branch Manager | POS Cashier | Stock Manager | Technician | Accountant |
|---|---|---|---|---|---|---|
| `sales:create` / `sales:view` | Yes | Yes | Yes | No | No | View |
| `sales:refund` | Yes | Yes | Approval | No | No | No |
| `products:manage` / `imei:track` | Yes | Yes | View | Yes | View | View |
| `repairs:assign` / `repairs:edit` | Yes | Yes | No | No | Yes | No |
| `accounting:journal` / `reports:financial` | Yes | No | No | No | No | Yes |
| `payroll:process` / `leaves:approve` | Yes | Leave Only | No | No | No | Yes |
| `users:manage` / `settings:edit` | Yes | No | No | No | No | No |

---

## 3. System Architecture & Technology Stack

### 3.1 Tech Stack Summary

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | Fast SPA, AG Grid Community, Lucide React icons, Sonner toasts |
| **State** | Zustand + TanStack Query v5 | Client theme/auth persistence + TanStack server state caching |
| **Styling** | Tailwind CSS v3 + Radix UI | Responsive layouts, 7 theme modes (`flat`, `glassmorphism`, `neumorphism`, etc.) |
| **Backend** | Node.js 20 (ESM) + Express 4 | Modular monolith architecture (`server/modules/<name>`) |
| **Database** | MongoDB 7 + Mongoose 8 | Indexed collections, atomic transactions |
| **Real-Time** | Server-Sent Events (SSE) | Node `EventEmitter` push stream (`/api/v1/sse`) |
| **Auth & Security** | JWT + TOTP MFA + Zod | Bearer header & HTTP-Only cookies, magic-byte file validation |

---

## 4. Comprehensive Functional Specifications (28 Modules)

1. **Auth (`/auth`):** Direct login (`/login-direct`), OTP verification, refresh token flow, TOTP 2FA.
2. **User & Role (`/users`, `/roles`):** User directory, RBAC permission arrays, security profile edit.
3. **Catalog (`/catalog`):** Categories, brands, models, and custom specs.
4. **Product (`/products`):** SKUs, barcodes, cost margins, retail & wholesale price tiers.
5. **IMEI Tracker (`/imei`):** 15-digit serial validation, status lifecycle (`IN_STOCK`, `SOLD`, `IN_REPAIR`, `RETURNED`, `SCRAPPED`), history passport.
6. **Stock (`/stock`):** Multi-branch stock levels, transfer order dispatch & receive flow, low stock alerts.
7. **Supplier (`/suppliers`):** Vendor profiles, credit balance ledgers, purchase history.
8. **Purchase (`/purchases`):** Purchase orders, incoming GRN, IMEI serial intake, AP posting.
9. **Sale (POS) (`/sales`):** POS interface, barcode scanner, thermal receipts, PDF invoices, sales returns.
10. **Wholesale (`/wholesale`):** Tiered volume pricing matrices, credit limit validation, bulk IMEI reservation.
11. **Customer CRM (`/customers`):** Customer directory, receivables ledger, credit limit enforcement.
12. **Warranty (`/warranties`):** Warranty registration, claim validation, unit replacement dispatch.
13. **Repair (`/repairs`):** Job sheet creation, technician assignment, status progression, parts billing.
14. **Accounting (`/accounting`):** Double-entry ledger, journal entries, Trial Balance, P&L, Balance Sheet.
15. **Expense (`/expenses`):** Office expenses, petty cash vouchers, file attachment uploads.
16. **Investor (`/investors`):** Investor capital records, equity share ratios, dividend distributions.
17. **Loan (`/loans`):** Business loan records, interest schedules, repayment logs.
18. **Employee (`/employees`):** Staff profiles, department allocation, base compensation specs.
19. **Attendance (`/attendance`):** Check-in/check-out tracking, overtime calculation, monthly summaries.
20. **Leave (`/leaves`):** Multi-tier leave approvals, leave balance deductions.
21. **Payroll (`/payroll`):** Monthly salary calculations, deductions, printable pay slips.
22. **Branch (`/branches`):** Multi-branch store locations, stock isolation.
23. **Document Vault (`/documentVault`):** Document uploads, categorizations, file previews.
24. **Settings (`/settings`):** Business info, receipt template headers/footers, currency configuration.
25. **Notification (`/notifications`):** Alert feeds, system notifications.
26. **SSE Stream (`/sse`):** Server-Sent Events push stream.
27. **Audit Logs (`server/models/AuditLog.js`):** Immutable event audit trail (User ID, IP, action, diffs).
28. **Reports (`/reports`):** Business analytics, sales performance, profit margins, inventory valuation.

---

## 5. Data Models & Entity Schemas

### 5.1 Core Database Schemas

- **Product Schema (`server/modules/product/product.model.js`):** Fields for `name`, `sku`, `category`, `brand`, `model`, `hasImei`, `costPrice`, `retailPrice`, `wholesalePrice`, `minStockLevel`.
- **IMEI Tracker Schema (`server/modules/imei/imei.model.js`):** Fields for `imeiNumber`, `product`, `branch`, `status`, `purchaseOrder`, `saleInvoice`, `warrantyExpiry`.
- **Sale Invoice Schema (`server/modules/sale/sale.model.js`):** Fields for `invoiceNumber`, `branch`, `customer`, `soldBy`, `saleType`, `items`, `subTotal`, `discount`, `taxAmount`, `grandTotal`, `paidAmount`, `dueAmount`, `paymentMethod`.

---

## 6. UI/UX Design System & 7 Custom Themes

The application includes 7 built-in design modes configured in `client/src/store/themeStore.js`:
- **Flat:** Minimal corporate UI
- **Neumorphism:** Tactile extruded 3D surfaces
- **Glassmorphism & Glassmorphism Pro:** Translucent backdrop blur with frosted glass accents
- **Liquid Glass:** Dynamic fluid gradients
- **Neo Brutalism:** High-contrast 3px borders with retro offset shadows
- **Aurora:** Glowing dark-mode ambient gradients

---

## 7. Integrations & Real-Time Engine

- **Server-Sent Events (SSE):** Push notifications for real-time stock alerts and repair status updates.
- **Client Event Emitter:** Decoupled client events via `client/src/utils/EventEmitter.js`.
- **Offline Sync:** Service Worker + IndexedDB (`offlineDB.js` & `offlineSync.js`) for queuing offline transactions.

---

## 8. Non-Functional Requirements (NFRs)

- **Performance:** Sub-100ms API response time, sub-50ms barcode scan lookup.
- **Security:** OWASP Top 10 mitigation, Bcrypt (salt=10), Helmet CSP, magic-byte file validation.
- **Scalability:** Indexed MongoDB queries on `imeiNumber`, `invoiceNumber`, `branchId`.

---

## 9. DevOps & Deployment Architecture

```bash
# Docker Compose stack
docker compose up -d --build
```
Includes MongoDB 7, Node.js 20 Express REST API server, and Vite React client frontend.

---

## 10. Release Roadmap & Key Metrics

- **Phase 1 (Core ERP):** Auth, Catalog, Product, IMEI Tracker, Stock, POS Sales, Accounting (**Completed**).
- **Phase 2 (Enterprise Ops):** Multi-Branch, Repairs, HR/Payroll, Investor, Loan, SSE Stream, 7 Themes (**Completed**).
- **Phase 3 (Integrations):** SMS Gateway OTP, direct thermal USB printing (**Q4 2026 Target**).
