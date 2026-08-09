import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { validateUploadedFile } from '../../config/upload.js';
import * as documentVaultService from './documentVault.service.js';

export const getDocuments = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const docs = await documentVaultService.getDocumentsByEntity(entityType, entityId, tenantId);
    return ApiResponse.success(res, docs, 'Documents retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No document file uploaded or file exceeds 5MB limit');
    }

    await validateUploadedFile(req);

    const { entityType, entityId, documentType, title, notes } = req.body;
    if (!entityType || !entityId || !title) {
      throw ApiError.badRequest('entityType, entityId, and title are required');
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const docData = {
      entityType,
      entityId,
      tenantId: req.user?.tenantId || null,
      documentType: documentType || 'Other',
      title,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      notes: notes || '',
      fileUrl,
    };

    const doc = await documentVaultService.createDocument(docData, req.user?.username);
    return ApiResponse.created(res, doc, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const doc = await documentVaultService.deleteDocument(req.params.id, tenantId);
    return ApiResponse.success(res, doc, 'Document removed successfully');
  } catch (error) {
    next(error);
  }
};
