import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import fs from 'fs';

export function formatDocumentVault(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    entityType: row.entity_type,
    entityId: String(row.entity_id),
    documentType: row.document_type || 'Other',
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: Number(row.file_size || 0),
    mimeType: row.mime_type,
    notes: row.notes || '',
    uploadedBy: row.uploaded_by || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const getDocumentsByEntity = async (entityType = null, entityId = null, tenantId = null, branchId = null) => {
  const query = db('document_vaults').where({ is_deleted: false });
  if (entityType) query.where('entity_type', entityType);
  if (entityId) query.where('entity_id', entityId);
  applyTenantScope(query, tenantId);
  if (branchId && branchId !== 'all') {
    query.where('branch_id', branchId);
  }

  const rows = await query.orderBy('created_at', 'desc');
  return rows.map(formatDocumentVault);
};

export const createDocument = async (docData, username = 'system', branchId = null) => {
  const [insertedId] = await db('document_vaults').insert({
    tenant_id: docData.tenantId || null,
    branch_id: docData.branchId || branchId || null,
    entity_type: docData.entityType,
    entity_id: docData.entityId,
    document_type: docData.documentType || 'Other',
    title: docData.title,
    file_name: docData.fileName,
    file_path: docData.filePath,
    file_size: docData.fileSize,
    mime_type: docData.mimeType,
    notes: docData.notes || null,
    uploaded_by: username,
    is_deleted: false,
  });

  const q = db('document_vaults').where({ id: insertedId });
  if (docData.tenantId) q.andWhere('tenant_id', docData.tenantId);
  const row = await q.first();
  return formatDocumentVault(row);
};

export const deleteDocument = async (id, tenantId = null) => {
  const query = db('document_vaults').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);

  const doc = await query.first();
  if (!doc) throw ApiError.notFound('Document not found');

  const delQ = db('document_vaults').where({ id });
  if (tenantId) delQ.andWhere('tenant_id', tenantId);
  await delQ.update({ is_deleted: true });

  if (fs.existsSync(doc.file_path)) {
    try { fs.unlinkSync(doc.file_path); } catch (e) { console.error('Failed to delete physical file:', e.message); }
  }

  return formatDocumentVault({ ...doc, is_deleted: true });
};
