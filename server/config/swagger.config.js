import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Brothers Mobile Shop ERP — API Reference',
      version: '1.0.0',
      description: `
## Brothers Mobile Shop ERP

A comprehensive Enterprise Resource Planning REST API for mobile shop management.

### Authentication
All protected endpoints require a **Bearer JWT token**.
Obtain a token via \`POST /auth/login-direct\` and pass it in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### Base URL
All endpoints are prefixed with \`/api/v1\`.

### Response Format
All responses follow the standard shape:
\`\`\`json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "pagination": { "total": 0, "page": 1, "limit": 20 }
}
\`\`\`
      `,
      contact: {
        name: 'Salah Uddin Kader',
        url: 'https://salahuddin.codes',
      },
      license: {
        name: 'Private — Internal Use Only',
      },
    },
    servers: [
      {
        url: `${process.env.APP_URL || 'http://localhost:5000'}/api/v1`,
        description: process.env.NODE_ENV === 'production' ? '🚀 Production Server' : '🛠 Development Server (localhost)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token (obtained from /auth/login-direct)',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 100 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                pages: { type: 'integer', example: 5 },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            username: { type: 'string', example: 'salahuddin' },
            email: { type: 'string', example: 'salah@example.com' },
            phone: { type: 'string', example: '01700000000' },
            fullName: { type: 'string', example: 'Salah Uddin' },
            roleName: { type: 'string', example: 'ADMIN' },
            permissions: { type: 'array', items: { type: 'string' }, example: ['sales:view', 'sales:create'] },
            isActive: { type: 'boolean', example: true },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Samsung Galaxy A55' },
            sku: { type: 'string', example: 'SAM-A55-BLK' },
            barcode: { type: 'string' },
            category: { type: 'string', example: 'Smartphone' },
            brand: { type: 'string', example: 'Samsung' },
            model: { type: 'string', example: 'Galaxy A55' },
            costPrice: { type: 'number', example: 35000 },
            sellingPrice: { type: 'number', example: 38000 },
            stockQuantity: { type: 'number', example: 15 },
            isActive: { type: 'boolean', example: true },
          },
        },
        Sale: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            invoiceNumber: { type: 'string', example: 'INV-2024-00123' },
            customerName: { type: 'string', example: 'Rahim Uddin' },
            customerPhone: { type: 'string', example: '01800000000' },
            subTotal: { type: 'number', example: 38000 },
            discount: { type: 'number', example: 500 },
            netTotal: { type: 'number', example: 37500 },
            paymentBreakdown: { type: 'object' },
            status: { type: 'string', example: 'COMPLETED' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Rahim Uddin' },
            phone: { type: 'string', example: '01800000000' },
            email: { type: 'string', example: 'rahim@example.com' },
            address: { type: 'string' },
            customerType: { type: 'string', enum: ['B2C', 'B2B'], example: 'B2C' },
            dueAmount: { type: 'number', example: 5000 },
            totalSpent: { type: 'number', example: 150000 },
          },
        },
        Supplier: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Samsung Distributor' },
            phone: { type: 'string', example: '01700000000' },
            email: { type: 'string', example: 'supplier@example.com' },
            address: { type: 'string' },
            company: { type: 'string', example: 'Samsung Bangladesh' },
            dueAmount: { type: 'number', example: 250000 },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Kamal Hossain' },
            phone: { type: 'string', example: '01900000000' },
            email: { type: 'string', example: 'kamal@example.com' },
            position: { type: 'string', example: 'Sales Executive' },
            department: { type: 'string', example: 'Sales' },
            salary: { type: 'number', example: 25000 },
            joinDate: { type: 'string', format: 'date' },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string', example: 'PO-2024-0001' },
            supplierName: { type: 'string', example: 'Samsung Distributor' },
            totalAmount: { type: 'number', example: 500000 },
            status: { type: 'string', enum: ['PENDING', 'RECEIVED', 'CANCELLED'], example: 'PENDING' },
            orderDate: { type: 'string', format: 'date-time' },
          },
        },
        Expense: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Shop Rent' },
            amount: { type: 'number', example: 15000 },
            category: { type: 'string', example: 'Rent' },
            date: { type: 'string', format: 'date' },
            notes: { type: 'string' },
          },
        },
        Repair: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            ticketNumber: { type: 'string', example: 'REP-2024-001' },
            customerName: { type: 'string', example: 'Rahim Uddin' },
            deviceModel: { type: 'string', example: 'iPhone 14' },
            issue: { type: 'string', example: 'Screen broken' },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'] },
            estimatedCost: { type: 'number', example: 5000 },
          },
        },
        Role: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'MANAGER' },
            description: { type: 'string', example: 'Shop manager with full access' },
            permissions: { type: 'array', items: { type: 'string' } },
            isSystem: { type: 'boolean', example: false },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Low Stock Alert' },
            message: { type: 'string', example: 'Samsung Galaxy A55 is running low' },
            type: { type: 'string', enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'] },
            isRead: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Brothers Mobile' },
            subdomain: { type: 'string', example: 'brothers' },
            customDomain: { type: 'string', example: 'brothers.example.com' },
            plan: { type: 'string', example: 'PRO' },
            status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'], example: 'ACTIVE' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: { type: 'string', example: 'salahuddin' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication, OTP & password management' },
      { name: 'Users', description: 'User account management' },
      { name: 'Sales', description: 'POS transactions, invoices & returns' },
      { name: 'Products', description: 'Product catalog & inventory' },
      { name: 'Customers', description: 'CRM — customers & due collection' },
      { name: 'Purchase Orders', description: 'Supplier purchase orders & GRN' },
      { name: 'Stock', description: 'Stock adjustments & transfers' },
      { name: 'Employees', description: 'Employee management' },
      { name: 'Payroll', description: 'Salary & payroll processing' },
      { name: 'Accounting', description: 'Chart of accounts, journals & reports' },
      { name: 'Loans', description: 'Loan taken/given & repayments' },
      { name: 'Investors', description: 'Investor management & transactions' },
      { name: 'Repairs', description: 'Repair ticket management' },
      { name: 'Warranty', description: 'Warranty claims & RMA' },
      { name: 'Reports', description: 'Financial & operational reports' },
      { name: 'Notifications', description: 'System notifications' },
      { name: 'Settings', description: 'ERP system configuration' },
      { name: 'SSE', description: 'Real-time Server-Sent Events stream' },
      { name: 'Health', description: 'Server health & diagnostics' },
    ],
  },
  apis: ['./modules/**/*.routes.js', './server.js'],
};

const specs = swaggerJsdoc(options);

const CUSTOM_CSS = `
  /* ── Global Reset & Font ── */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .swagger-ui * { font-family: 'Inter', sans-serif !important; }

  /* ── Top Bar ── */
  .swagger-ui .topbar {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    border-bottom: 2px solid #dc2626;
    padding: 10px 0;
  }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .topbar-wrapper img { display: none; }
  .swagger-ui .topbar-wrapper::before {
    content: '🔴 Brothers Mobile Shop — API Docs';
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  /* ── Page Background ── */
  .swagger-ui { background: #0f172a !important; }
  body { background: #0f172a !important; margin: 0; }
  .swagger-ui .wrapper { background: #0f172a; }

  /* ── Info Section ── */
  .swagger-ui .information-container {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 28px 32px;
    margin: 20px 0;
  }
  .swagger-ui .info .title {
    color: #f8fafc !important;
    font-size: 26px !important;
    font-weight: 700 !important;
  }
  .swagger-ui .info .title small {
    background: #dc2626;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 11px;
    color: #fff !important;
  }
  .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td {
    color: #94a3b8 !important;
    font-size: 13px !important;
  }
  .swagger-ui .info h2, .swagger-ui .info h3 { color: #e2e8f0 !important; }
  .swagger-ui .info code {
    background: #1e293b !important;
    color: #38bdf8 !important;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 12px;
  }
  .swagger-ui .info pre {
    background: #1e293b !important;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
  }

  /* ── Servers Dropdown ── */
  .swagger-ui .scheme-container {
    background: #1e293b !important;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: none !important;
  }
  .swagger-ui .servers > label { color: #94a3b8 !important; font-size: 12px; }
  .swagger-ui .servers select {
    background: #0f172a !important;
    color: #f8fafc !important;
    border: 1px solid #475569 !important;
    border-radius: 6px;
    padding: 6px 10px;
  }

  /* ── Authorize Button ── */
  .swagger-ui .btn.authorize {
    background: #dc2626 !important;
    border-color: #dc2626 !important;
    color: #fff !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    padding: 8px 20px !important;
    transition: all 0.2s ease;
  }
  .swagger-ui .btn.authorize:hover { background: #b91c1c !important; }
  .swagger-ui .btn.authorize svg { fill: #fff !important; }
  .swagger-ui .auth-wrapper .btn-done {
    background: #16a34a !important;
    border-color: #16a34a !important;
    color: #fff !important;
    border-radius: 6px !important;
  }

  /* ── Operation Tags (Group Headers) ── */
  .swagger-ui .opblock-tag {
    color: #f8fafc !important;
    border-bottom: 1px solid #334155 !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    margin: 8px 0 !important;
    padding: 12px 0 !important;
  }
  .swagger-ui .opblock-tag:hover { background: #1e293b !important; border-radius: 8px; }
  .swagger-ui .opblock-tag small { color: #64748b !important; font-size: 12px !important; font-weight: 400 !important; }

  /* ── Operation Blocks ── */
  .swagger-ui .opblock {
    border-radius: 8px !important;
    border: 1px solid #334155 !important;
    margin: 4px 0 !important;
    box-shadow: none !important;
    background: #1e293b !important;
  }
  .swagger-ui .opblock:hover { border-color: #475569 !important; }
  .swagger-ui .opblock-summary { border-radius: 8px !important; }
  .swagger-ui .opblock-summary-path {
    color: #e2e8f0 !important;
    font-size: 13px !important;
    font-weight: 500 !important;
  }
  .swagger-ui .opblock-summary-description {
    color: #64748b !important;
    font-size: 12px !important;
  }

  /* ── HTTP Method Colors ── */
  .swagger-ui .opblock.opblock-get { border-left: 3px solid #0ea5e9 !important; background: rgba(14, 165, 233, 0.05) !important; }
  .swagger-ui .opblock.opblock-post { border-left: 3px solid #22c55e !important; background: rgba(34, 197, 94, 0.05) !important; }
  .swagger-ui .opblock.opblock-put { border-left: 3px solid #f59e0b !important; background: rgba(245, 158, 11, 0.05) !important; }
  .swagger-ui .opblock.opblock-patch { border-left: 3px solid #a78bfa !important; background: rgba(167, 139, 250, 0.05) !important; }
  .swagger-ui .opblock.opblock-delete { border-left: 3px solid #ef4444 !important; background: rgba(239, 68, 68, 0.05) !important; }

  /* ── HTTP Method Badges ── */
  .swagger-ui .opblock-summary-method {
    border-radius: 6px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    min-width: 60px !important;
    text-align: center !important;
  }

  /* ── Expanded Panel Body ── */
  .swagger-ui .opblock-body { background: #0f172a !important; border-radius: 0 0 8px 8px !important; }
  .swagger-ui .opblock-section-header { background: #1e293b !important; }
  .swagger-ui .opblock-section-header h4 { color: #e2e8f0 !important; }
  .swagger-ui .tab li { color: #94a3b8 !important; }
  .swagger-ui .tab li.active { color: #38bdf8 !important; border-bottom: 2px solid #38bdf8 !important; }

  /* ── Inputs & Textareas ── */
  .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {
    background: #1e293b !important;
    color: #f8fafc !important;
    border: 1px solid #475569 !important;
    border-radius: 6px !important;
  }
  .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus {
    border-color: #38bdf8 !important;
    outline: none !important;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
  }

  /* ── Execute Button ── */
  .swagger-ui .btn.execute {
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
  }
  .swagger-ui .btn.execute:hover { background: #1d4ed8 !important; }
  .swagger-ui .btn.try-out__btn {
    border-color: #475569 !important;
    color: #94a3b8 !important;
    border-radius: 6px !important;
  }
  .swagger-ui .btn.try-out__btn:hover { background: #1e293b !important; }
  .swagger-ui .btn.cancel { border-color: #475569 !important; color: #94a3b8 !important; border-radius: 6px !important; }

  /* ── Response Section ── */
  .swagger-ui .responses-table { background: #0f172a !important; }
  .swagger-ui .response-col_status { color: #e2e8f0 !important; }
  .swagger-ui .response-col_description { color: #94a3b8 !important; }
  .swagger-ui .highlight-code pre { background: #1e293b !important; border-radius: 6px !important; }
  .swagger-ui .microlight { color: #94a3b8 !important; background: #1e293b !important; }

  /* ── Parameters Table ── */
  .swagger-ui table { background: #0f172a !important; }
  .swagger-ui table thead tr th { background: #1e293b !important; color: #e2e8f0 !important; border-color: #334155 !important; }
  .swagger-ui table tbody tr td { color: #94a3b8 !important; border-color: #334155 !important; }
  .swagger-ui .parameter__name { color: #e2e8f0 !important; font-weight: 600 !important; }
  .swagger-ui .parameter__type { color: #38bdf8 !important; }
  .swagger-ui .parameter__in { color: #a78bfa !important; font-size: 11px !important; }

  /* ── Schemas / Models Section ── */
  .swagger-ui section.models { background: #1e293b !important; border: 1px solid #334155 !important; border-radius: 10px !important; }
  .swagger-ui section.models h4 { color: #f8fafc !important; font-weight: 600 !important; }
  .swagger-ui .model-container { background: #0f172a !important; border-radius: 8px !important; margin: 8px !important; }
  .swagger-ui .model { color: #94a3b8 !important; }
  .swagger-ui .model-title { color: #e2e8f0 !important; font-weight: 600 !important; }
  .swagger-ui .prop-type { color: #38bdf8 !important; }
  .swagger-ui .prop-format { color: #a78bfa !important; }

  /* ── Auth Modal ── */
  .swagger-ui .dialog-ux .modal-ux {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 12px !important;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important;
  }
  .swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid #334155 !important; }
  .swagger-ui .dialog-ux .modal-ux-header h3 { color: #f8fafc !important; }
  .swagger-ui .dialog-ux .modal-ux-content p, .swagger-ui .dialog-ux .modal-ux-content h4 { color: #94a3b8 !important; }
  .swagger-ui .dialog-ux .modal-ux-content code { color: #38bdf8 !important; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #475569; }

  /* ── Loading ── */
  .swagger-ui .loading-container { background: #0f172a !important; }
`;

const SWAGGER_OPTIONS = {
  explorer: false,
  customCss: CUSTOM_CSS,
  customSiteTitle: 'Brothers Mobile Shop — API Docs',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    tryItOutEnabled: false,
    defaultModelsExpandDepth: 1,
    syntaxHighlight: {
      activate: true,
      theme: 'arta',
    },
  },
};

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, SWAGGER_OPTIONS));
};

export default specs;
