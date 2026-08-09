import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as tenantController from './tenant.controller.js';
import * as tempAdminController from './tempAdmin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createTenantSchema, updateTenantSchema, updateTenantStatusSchema, verifyKycSchema } from './tenant.validator.js';

const uploadDir = 'uploads/tenants/kyc';
const logoDir = 'uploads/tenants/logos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `kyc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files allowed'));
  },
});

const router = express.Router();

// Public: check subdomain availability
router.get('/check-subdomain/:slug', tenantController.checkSubdomain);
router.get('/public/by-subdomain/:subdomain', tenantController.getPublicTenantInfo);

// Public: shop self-registration (also used by super admin from SaaS panel)
router.post('/', validate(createTenantSchema), tenantController.createTenant);

// Super admin only: list, inspect, change status, approve KYC, bulk delete
router.get('/stats', authenticate, requireSuperAdmin, tenantController.getTenantStats);
router.get('/', authenticate, requireSuperAdmin, tenantController.getTenants);
router.delete('/bulk', authenticate, requireSuperAdmin, tenantController.bulkDeleteTenants);

// Authenticated shop user: get their own tenant info
router.get('/me', authenticate, tenantController.getMyTenant);
router.get('/:id', authenticate, requireSuperAdmin, tenantController.getTenant);
router.put('/:id', authenticate, requireSuperAdmin, validate(updateTenantSchema), tenantController.updateTenant);
router.patch('/:id/status', authenticate, requireSuperAdmin, validate(updateTenantStatusSchema), tenantController.updateStatus);
router.patch('/:id/verify-kyc', authenticate, requireSuperAdmin, validate(verifyKycSchema), tenantController.handleVerifyKyc);

// Super admin: subdomain info
router.get('/:id/subdomain', authenticate, requireSuperAdmin, tenantController.getSubdomainInfo);

// Temp admin routes
router.get('/temp-admin/active', authenticate, requireSuperAdmin, tempAdminController.getAllActiveTempAdmins);
router.post('/:id/temp-admin', authenticate, requireSuperAdmin, tempAdminController.createTempAdmin);
router.get('/:id/temp-admin', authenticate, requireSuperAdmin, tempAdminController.getShopTempAdmins);
router.delete('/temp-admin/:id/revoke', authenticate, requireSuperAdmin, tempAdminController.revokeTempAdmin);

// Public: KYC document upload right after registration
router.post(
  '/:id/kyc-upload',
  upload.fields([
    { name: 'nidFront', maxCount: 1 },
    { name: 'nidBack', maxCount: 1 },
    { name: 'tradeLicenseFile', maxCount: 1 },
    { name: 'tinCertificate', maxCount: 1 },
  ]),
  tenantController.uploadKyc
);

// Public: Shop logo upload during registration
router.post(
  '/:id/logo-upload',
  uploadLogo.single('logo'),
  tenantController.uploadLogo
);

export default router;
