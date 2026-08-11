import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ApiError } from '../utils/http/ApiError.js';
import { fileTypeFromBuffer } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, '../uploads');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = path.join(UPLOADS_ROOT, 'avatars'); ensureDir(dir); cb(null, dir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.userId}-${uniqueSuffix}${ext}`);
  },
});

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = path.join(UPLOADS_ROOT, 'products'); ensureDir(dir); cb(null, dir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only image files (jpg, png, webp, gif) are allowed'), false);
  }
};

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = path.join(UPLOADS_ROOT, 'logos'); ensureDir(dir); cb(null, dir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('avatar');

export const uploadProductImage = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = path.join(UPLOADS_ROOT, 'documents'); ensureDir(dir); cb(null, dir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const allowedDocMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const allowedDocExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

const docFileFilter = (req, file, cb) => {
  if (allowedDocMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only PDF, JPG, and PNG files under 5MB are allowed'), false);
  }
};

export const uploadCompanyLogo = multer({
  storage: logoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('logo');

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: docFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Enforce 5MB limit
}).single('file');

export const validateUploadedFile = async (req) => {
  if (!req.file) return;
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext) && !allowedDocExtensions.includes(ext)) {
    fs.unlinkSync(req.file.path);
    throw ApiError.badRequest('Invalid file extension');
  }

  try {
    const buffer = fs.readFileSync(req.file.path);
    const type = await fileTypeFromBuffer(buffer);
    
    const validMimes = [...allowedMimeTypes, ...allowedDocMimeTypes];
    if (!type || !validMimes.includes(type.mime)) {
      fs.unlinkSync(req.file.path);
      throw ApiError.badRequest('Invalid file type - file content does not match allowed PDF/Image format');
    }
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
};
