import mongoose from 'mongoose';
import { DocumentVault } from './documentVault.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import fs from 'fs';

export const getDocumentsByEntity = async (entityType, entityId, tenantId = null) => {
  if (!entityType || !entityId) {
    throw ApiError.badRequest('entityType and entityId are required');
  }
  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    return [];
  }
  const query = { entityType, entityId, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  return DocumentVault.find(query).sort({ createdAt: -1 }).lean();
};

export const createDocument = async (docData, username) => {
  const doc = await DocumentVault.create({
    ...docData,
    uploadedBy: username,
  });
  return doc;
};

export const deleteDocument = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const doc = await DocumentVault.findOne(query);
  if (!doc) throw ApiError.notFound('Document not found');

  doc.isDeleted = true;
  await doc.save();

  // Optionally clean up file from disk if needed, or keep for soft delete
  if (fs.existsSync(doc.filePath)) {
    try {
      fs.unlinkSync(doc.filePath);
    } catch (e) {
      console.error('Failed to delete physical file:', e.message);
    }
  }

  return doc;
};
