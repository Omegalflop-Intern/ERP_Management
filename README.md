<div align="center">

# Brothers Mobile Shop ERP

### Complete Enterprise Resource Planning System for Mobile Shop Management

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)
[![Security](https://img.shields.io/badge/Security-Policy-red.svg?style=for-the-badge)](SECURITY.md)
[![Contributing](https://img.shields.io/badge/Contributing-Guide-green.svg?style=for-the-badge)](CONTRIBUTING.md)

</div>

---

## Overview

Brothers Mobile Shop ERP is a full-stack enterprise resource planning system built for mobile phone shops. It covers sales, inventory, IMEI tracking, employee management, accounting, CRM, and more — with a modern UI featuring 7 design themes.

## Features

### Sales & Invoicing
- Point-of-Sale (POS) with quick product search
- Invoice generation with PDF export
- Sales returns and refunds
- Wholesale order management
- Receipt printing with thermal printer support

### Inventory Management
- Product catalog with categories and brands
- Stock overview with real-time quantities
- Stock transfers between branches
- Low stock alerts and notifications
- Bulk product import via Excel/CSV

### IMEI Tracker
- Unique IMEI tracking per device
- Status tracking (In Stock, Sold, Returned, In Repair)
- Bulk IMEI import via Excel
- IMEI passport and history

### HR & Employee Management
- Employee profiles with role assignment
- Attendance tracking (check-in/check-out)
- Leave management with approval workflow
- Payroll generation and salary slips

### Accounting
- Chart of Accounts
- Journal entries
- Trial Balance
- Profit & Loss statement
- Balance Sheet
- Expense tracking with categories
- Loan management
- Investor management

### CRM
- Customer database with purchase history
- Warranty tracking and claims
- Due collection with payment reminders
- Customer communication log

### Reports
- Sales reports with date filtering
- Revenue analytics with charts
- Stock reports
- Employee performance reports

### System
- Role-based access control (RBAC)
- Multi-branch support
- Activity audit logs
- System analytics dashboard
- Backup and restore
- 7 design themes (Flat, Neumorphism, Glassmorphism, Liquid Glass, Neo Brutalism, Aurora, Glassmorphism Pro)
- Dark/Light mode
- Inactivity auto-logout
- Responsive design (mobile + desktop)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, TanStack Query, React Router 7 |
| UI Components | shadcn/ui (Radix Primitives), Lucide React, Recharts |
| Backend | Node.js 20, Express 4, ESM Modules |
| Database | MongoDB 7, Mongoose 7 |
| Authentication | JWT (httpOnly cookies), bcrypt, OTP via email |
| Validation | Zod |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| File Uploads | Multer with MIME + magic number validation |
| Deployment | Docker, PM2 |

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20)
- MongoDB 6+ (local or Docker)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mobile-shop-erp.git
cd mobile-shop-erp
```

### Server Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration (see Environment Variables below)

# Seed default roles and settings
npm run seed

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`

### Client Setup

```bash
cd client
npm install

# Start development server
npm run dev
```

Client runs on `http://localhost:3000`

### Environment Variables

**Server** (`server/.env`):

```env
# Required
JWT_SECRET=your-super-secret-key-here

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/mobile_shop_erp

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# SMTP (optional — falls back to Ethereal in dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Seed passwords (production only)
SEED_PASSWORD_ADMIN=your-admin-password
SEED_PASSWORD_MANAGER=your-manager-password
```

**Client** (`client/.env`):

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Docker Setup

```bash
docker compose up -d
```

This starts MongoDB, the server, and the client.

## Project Structure

```
mobile-shop-erp/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layout/         # Sidebar, Topbar, DashboardLayout
│   │   │   └── ui/             # ThemeToggle, PasswordInput, etc.
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, utilities
│   │   ├── pages/              # Route pages
│   │   │   ├── Auth/           # Login, ForgotPassword
│   │   │   ├── Dashboard/      # Main dashboard
│   │   │   ├── Sales/          # POS, invoices, returns
│   │   │   ├── Inventory/      # Products, categories, IMEI
│   │   │   ├── HR/             # Employees, attendance, payroll
│   │   │   ├── Accounting/     # Journal, balance sheet, expenses
│   │   │   ├── CRM/            # Customers, warranty, dues
│   │   │   ├── Reports/        # Analytics and reports
│   │   │   ├── Settings/       # System settings, profile
│   │   │   └── Repairs/        # Repair tracking
│   │   └── utils/              # Offline sync, event emitter
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js backend
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Login, OTP, password reset
│   │   ├── user/               # User CRUD, roles
│   │   ├── product/            # Product catalog
│   │   ├── sale/               # Sales and invoicing
│   │   ├── imei/               # IMEI tracking
│   │   ├── purchase/           # Purchase orders
│   │   ├── customer/           # CRM
│   │   ├── employee/           # HR management
│   │   ├── attendance/         # Attendance tracking
│   │   ├── payroll/            # Salary processing
│   │   ├── expense/            # Expense tracking
│   │   ├── accounting/         # Journal, ledger, reports
│   │   ├── stock/              # Stock management
│   │   ├── repair/             # Repair tracking
│   │   ├── settings/           # System settings
│   │   ├── notification/       # Notifications
│   │   ├── role/               # Role management
│   │   ├── branch/             # Multi-branch
│   │   ├── warranty/           # Warranty claims
│   │   ├── wholesale/          # Wholesale orders
│   │   ├── loan/               # Loan management
│   │   ├── investor/           # Investor tracking
│   │   ├── leave/              # Leave management
│   │   ├── catalog/            # Brands, categories
│   │   └── report/             # Report generation
│   ├── middleware/              # Auth, validation, error handler
│   ├── config/                 # DB, CORS, Swagger config
│   ├── utils/                  # Helpers, token generation
│   └── app.js                  # Express app setup
│
├── docker-compose.yml
├── Dockerfile
├── SECURITY.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

## API Documentation

Once the server is running, visit:

```
http://localhost:5000/api/docs
```

Swagger UI provides interactive API documentation for all endpoints.

## Default Login

After running `npm run seed`:

```
Username: admin
Password: (set via SEED_PASSWORD_ADMIN env var)
```

## Design Themes

The application includes 7 built-in design themes:

| Theme | Description |
|-------|-------------|
| Flat | Clean, minimal design |
| Neumorphism | Soft, extruded UI elements |
| Glassmorphism | Frosted glass effects |
| Liquid Glass | Fluid, translucent glass |
| Neo Brutalism | Bold borders, offset shadows |
| Aurora | Animated gradient glow effects |
| Glassmorphism Pro | Premium multi-layer glass with gradient borders |

Toggle themes using the design mode button in the topbar.

## Scripts

### Server

```bash
npm run dev       # Development with hot reload
npm run start     # Production
npm run seed      # Seed default data
```

### Client

```bash
npm run dev       # Vite dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Security

See [SECURITY.md](SECURITY.md) for security policies, vulnerability reporting, and incident response procedures.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Developer

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/salahuddingfx">
        <img src="https://github.com/salahuddingfx.png" width="100px;" alt=""/>
        <br /><sub><b>Salah Uddin Kader</b></sub>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <sub>Intern at OmegaFlop Agency</sub>
    </td>
  </tr>
</table>

### Built With

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, TanStack Query, React Router 7
- **Backend**: Node.js 20, Express 4, MongoDB 7, Mongoose 7
- **Auth**: JWT, bcrypt, OTP, httpOnly cookies
- **UI**: shadcn/ui, Radix Primitives, Lucide React, Recharts
- **DevOps**: Docker, PM2, Swagger API Docs

### Contact

| Platform | Link |
|----------|------|
| GitHub | [@salahuddingfx](https://github.com/salahuddingfx) |
| Website | [salahuddin.codes](https://salahuddin.codes) |
| Agency | [OmegaFlop](https://omegaflop.com) |

## License

This project is licensed under the GNU Affero General Public License v3.0 — see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [Security Policy](SECURITY.md) for security-related concerns

---

<div align="center">

**Built with React, Node.js, and MongoDB**

</div>
# ERP_Management
