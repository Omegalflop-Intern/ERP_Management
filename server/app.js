import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.config.js';
import { corsOptions } from './config/cors.config.js';
import { connectDB } from './config/db.js';
import { initMailer } from './config/mailer.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { renderServerLandingPage } from './utils/system/serverLandingHtml.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.middleware.js';
import { authenticate } from './middleware/auth.middleware.js';
import { authorize } from './middleware/role.middleware.js';
import { requireSuperAdmin, checkTenantStatus } from './middleware/tenant.middleware.js';
import { extractTenantFromHost } from './middleware/subdomain.middleware.js';
import mongoose from 'mongoose';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import roleRoutes from './modules/role/role.routes.js';
import productRoutes from './modules/product/product.routes.js';
import imeiRoutes from './modules/imei/imei.routes.js';
import stockRoutes from './modules/stock/stock.routes.js';
import saleRoutes from './modules/sale/sale.routes.js';
import reportRoutes from './modules/report/report.routes.js';
import supplierRoutes from './modules/supplier/supplier.routes.js';
import purchaseOrderRoutes from './modules/purchase/purchaseOrder.routes.js';
import accountingRoutes from './modules/accounting/accounting.routes.js';
import employeeRoutes from './modules/employee/employee.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import leaveRoutes from './modules/leave/leave.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import customerCrmRoutes from './modules/customer/customer.routes.js';
import warrantyRoutes from './modules/warranty/warranty.routes.js';
import repairRoutes from './modules/repair/repair.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import branchRoutes from './modules/branch/branch.routes.js';
import wholesaleRoutes from './modules/wholesale/wholesale.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import investorRoutes from './modules/investor/investor.routes.js';
import expenseRoutes from './modules/expense/expense.routes.js';
import loanRoutes from './modules/loan/loan.routes.js';
import sseRoutes from './modules/sse/sse.routes.js';
import documentVaultRoutes from './modules/documentVault/documentVault.routes.js';
import tenantRoutes from './modules/tenant/tenant.routes.js';
import plansRoutes from './modules/plans/plans.routes.js';
import auditLogRoutes from './modules/audit/auditLog.routes.js';
import { startLoanReminderJob } from './jobs/loanReminderCron.js';
import { auditDiffInterceptor } from './middleware/auditInterceptor.middleware.js';
import { Investor } from './modules/investor/investor.model.js';
import { Loan } from './modules/loan/loan.model.js';
import { seedDefaultRoles } from './modules/role/role.service.js';
import { Settings } from './modules/settings/settings.model.js';
import { getAuditLogs } from './utils/auth/auditLog.js';
import emitter, { EVENTS } from './events/index.js';
import { setupSwagger } from './config/swagger.config.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

const productionOrigins = [process.env.APP_URL, process.env.CLIENT_URL]
  .filter(Boolean)
  .map((u) => u.trim().replace(/\/+$/, ''));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: [
        "'self'",
        ...(process.env.NODE_ENV !== 'production'
          ? ['http://localhost:3000', 'https://localhost:3000', 'http://localhost:5000', 'https://localhost:5000', 'http://localhost:5173']
          : []),
        ...productionOrigins,
      ],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(extractTenantFromHost);

morgan.token('url', (req) => (req.originalUrl || req.url).replace(/([?&]token=)[^&]+/g, '$1[REDACTED]'));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const referer = req.headers.referer || req.headers.origin || '';
    const allowedReferers = [process.env.CLIENT_URL, process.env.APP_URL, process.env.ALLOWED_ORIGIN].filter(Boolean);
    if (allowedReferers.length === 0) {
      console.warn('[Uploads] No CLIENT_URL/APP_URL set — /uploads requests are unprotected in production.');
    }
    if (referer && !allowedReferers.some((r) => referer.startsWith(r))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(renderServerLandingPage(env.NODE_ENV || 'development'));
  }
  res.json({
    success: true,
    message: 'Mobile Shop ERP API Server is running',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/v1/health',
  });
});

app.get(['/api', '/api/v1'], (req, res) => {
  if (req.accepts('html')) {
    return res.redirect('/api-docs');
  }
  res.json({
    success: true,
    message: 'Mobile Shop ERP API Base Endpoint',
    documentation: '/api-docs',
    health: '/api/v1/health',
  });
});

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/healthz', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const isHealthy = dbStatus === 'UP';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'UNHEALTHY',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

setupSwagger(app);

app.get('/api/v1/audit-logs', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, module, userId, action, from, to } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await getAuditLogs(Number(page), Number(limit), { module, userId, action, from, to }, tenantId);
    res.json({ success: true, data: result.logs, pagination: result.pagination });
  } catch (error) { next(error); }
});

app.delete('/api/v1/audit-logs*', authenticate, (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Hard deletion of audit log entries is strictly prohibited.',
  });
});

app.get('/api/v1/system/analytics', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const serverStartedAt = global.__serverStartTime || new Date();
    const uptimeSeconds = Math.floor((Date.now() - serverStartedAt.getTime()) / 1000);

    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const processMem = process.memoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    let dbStats = { collections: 0, documents: 0, storageSize: 0, dataSize: 0 };
    try {
      const admin = mongoose.connection.db.admin();
      const stats = await admin.command({ dbStats: 1 });
      dbStats = {
        collections: stats.collections || 0,
        documents: stats.objects || 0,
        storageSize: stats.storageSize || 0,
        dataSize: stats.dataSize || 0,
        indexSize: stats.indexSize || 0,
        avgObjSize: stats.avgObjSize || 0,
      };
    } catch (e) {}

    let collections = [];
    try {
      const collList = await mongoose.connection.db.listCollections().toArray();
      for (const coll of collList) {
        try {
          const collStats = await mongoose.connection.db.command({ collStats: coll.name });
          collections.push({
            name: coll.name,
            count: collStats.count || 0,
            size: collStats.size || 0,
            storageSize: collStats.storageSize || 0,
            avgObjSize: collStats.avgObjSize || 0,
          });
        } catch (e) {
          collections.push({ name: coll.name, count: 0, size: 0, storageSize: 0, avgObjSize: 0 });
        }
      }
      collections.sort((a, b) => b.size - a.size);
    } catch (e) {}

    let uploadsSize = 0;
    try {
      const fs = await import('fs');
      const uploadsDir = path.join(__dirname, '../uploads');
      const walkDir = (dir) => {
        if (!fs.default.existsSync(dir)) return;
        const files = fs.default.readdirSync(dir);
        for (const f of files) {
          const fp = path.join(dir, f);
          const stat = fs.default.statSync(fp);
          if (stat.isDirectory()) walkDir(fp);
          else uploadsSize += stat.size;
        }
      };
      walkDir(uploadsDir);
    } catch (e) {}

    return res.json({
      success: true,
      data: {
        server: {
          uptime: uptimeSeconds,
          startedAt: serverStartedAt.toISOString(),
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          pid: process.pid,
          env: env.NODE_ENV || 'development',
        },
        memory: {
          total: memTotal,
          free: memFree,
          used: memUsed,
          usagePercent: ((memUsed / memTotal) * 100).toFixed(1),
          processRss: processMem.rss,
          processHeapUsed: processMem.heapUsed,
          processHeapTotal: processMem.heapTotal,
        },
        cpu: {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
          loadAverage: { '1m': loadAvg[0]?.toFixed(2), '5m': loadAvg[1]?.toFixed(2), '15m': loadAvg[2]?.toFixed(2) },
        },
        database: dbStats,
        collections,
        uploads: { totalSize: uploadsSize },
        disk: { platform: os.platform() },
      },
    });
  } catch (error) { next(error); }
});

if (process.env.NODE_ENV !== 'test') {
  startLoanReminderJob();
}

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', imeiRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/finance', reportRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/accounting', accountingRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/customers', customerCrmRoutes);
app.use('/api/v1/warranties', warrantyRoutes);
app.use('/api/v1/repairs', repairRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/wholesale', wholesaleRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/documents', documentVaultRoutes);
app.use('/api/v1/investors', auditDiffInterceptor('Investor', () => Investor), investorRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/loans', auditDiffInterceptor('Loan', () => Loan), loanRoutes);
app.use('/api/v1/sse', sseRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/plans', plansRoutes);
app.use('/api/v1/super-admin/audit-logs', auditLogRoutes);

// Production: Serve client build if CLIENT_DIST_PATH is set (e.g. when server + client on same host)
// On separate deployments (Nginx + Node API), leave CLIENT_DIST_PATH empty — API-only mode
if (process.env.NODE_ENV === 'production' && process.env.CLIENT_DIST_PATH) {
  const clientDist = path.resolve(process.env.CLIENT_DIST_PATH);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'Route Not Found',
  });
});

app.use(errorHandler);

export default app;
