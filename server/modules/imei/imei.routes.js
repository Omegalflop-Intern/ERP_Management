import { Router } from 'express';
import * as imeiController from './imei.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { addInventoryUnitSchema, priceDropSchema } from './imei.validator.js';
import multer from 'multer';

const ALLOWED_IMPORT_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMPORT_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are allowed'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.get('/', imeiController.getAllIMEI);
router.get('/passport/:imei', imeiController.getIMEIPassport);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(addInventoryUnitSchema), imeiController.addInventoryUnit);
router.post('/import', authorize('ADMIN', 'MANAGER'), upload.single('file'), imeiController.importIMEI);
router.patch('/:id/status', imeiController.updateIMEIStatus);
router.post('/price-drop', authorize('ADMIN', 'MANAGER'), validate(priceDropSchema), imeiController.priceDropAdjustment);
router.delete('/:id', authorize('ADMIN'), imeiController.deleteIMEI);

export default router;
