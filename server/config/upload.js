import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/http/ApiError.js';
import { fileTypeFromBuffer } from 'file-type';

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = 'uploads/avatars'; ensureDir(dir); cb(null, dir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.userId}-${uniqueSuffix}${ext}`);
  },
});

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = 'uploads/products'; ensureDir(dir); cb(null, dir); },
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
  destination: (req, file, cb) => { const dir = 'uploads/logos'; ensureDir(dir); cb(null, dir); },
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

export const uploadCompanyLogo = multer({
  storage: logoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('logo');

export const validateUploadedFile = async (req) => {
  if (!req.file) return;
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    fs.unlinkSync(req.file.path);
    throw ApiError.badRequest('Invalid file extension');
  }

  try {
    const buffer = fs.readFileSync(req.file.path);
    const type = await fileTypeFromBuffer(buffer);
    
    if (!type || !allowedMimeTypes.includes(type.mime)) {
      fs.unlinkSync(req.file.path);
      throw ApiError.badRequest('Invalid file type - file content does not match image format');
    }
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
};
